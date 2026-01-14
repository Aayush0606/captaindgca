import { supabase } from '@/lib/supabase';
import { Question } from '@/types/questions';

export interface BulkUploadQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface BulkUploadResult {
  success: boolean;
  inserted: number;
  errors: BulkUploadError[];
  message?: string;
}

export interface BulkUploadError {
  index: number;
  question: string;
  error: string;
}

/**
 * Validate bulk upload question structure
 */
export function validateBulkUploadQuestion(q: any): { valid: boolean; error?: string } {
  if (!q.question || typeof q.question !== 'string') {
    return { valid: false, error: 'Question text is required' };
  }

  if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
    return { valid: false, error: 'Options must be an array with at least 2 items' };
  }

  if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
    return { valid: false, error: 'Correct answer must be a valid index (0-based)' };
  }

  if (q.difficulty && !['easy', 'medium', 'hard'].includes(q.difficulty)) {
    return { valid: false, error: 'Difficulty must be easy, medium, or hard' };
  }

  return { valid: true };
}

/**
 * Validate bulk upload JSON data
 */
export function validateBulkUploadData(data: any): { valid: boolean; error?: string; questions?: BulkUploadQuestion[] } {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Data must be an array of questions' };
  }

  if (data.length === 0) {
    return { valid: false, error: 'Array cannot be empty' };
  }

  const validatedQuestions: BulkUploadQuestion[] = [];
  for (let i = 0; i < data.length; i++) {
    const validation = validateBulkUploadQuestion(data[i]);
    if (!validation.valid) {
      return { valid: false, error: `Question ${i + 1}: ${validation.error}` };
    }
    validatedQuestions.push(data[i] as BulkUploadQuestion);
  }

  return { valid: true, questions: validatedQuestions };
}

/**
 * Bulk upload questions to a topic
 */
export async function bulkUploadQuestionsToTopic(
  questions: BulkUploadQuestion[],
  topicId: string,
  userId: string
): Promise<BulkUploadResult> {
  const errors: BulkUploadError[] = [];
  const inserted: any[] = [];

  // Prepare questions for batch insert
  const questionsToInsert = questions.map((q) => ({
    topic_id: topicId,
    question: q.question,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation || null,
    difficulty: q.difficulty || 'medium',
    created_by: userId,
  }));

  // Batch insert (Supabase supports up to 1000 rows per insert)
  const batchSize = 1000;
  for (let i = 0; i < questionsToInsert.length; i += batchSize) {
    const batch = questionsToInsert.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(batch)
        .select();

      if (error) {
        // Add all questions in this batch as errors
        batch.forEach((_, index) => {
          errors.push({
            index: i + index,
            question: questions[i + index].question.substring(0, 50) + '...',
            error: error.message,
          });
        });
      } else {
        inserted.push(...(data || []));
      }
    } catch (err: any) {
      batch.forEach((_, index) => {
        errors.push({
          index: i + index,
          question: questions[i + index].question.substring(0, 50) + '...',
          error: err.message || 'Unknown error',
        });
      });
    }
  }

  return {
    success: errors.length === 0,
    inserted: inserted.length,
    errors,
    message: errors.length === 0
      ? `Successfully uploaded ${inserted.length} questions`
      : `Uploaded ${inserted.length} questions with ${errors.length} errors`,
  };
}

/**
 * Bulk upload questions - automatically determines topic based on destination type
 */
export async function bulkUploadQuestions(
  questions: BulkUploadQuestion[],
  destination: {
    type: 'topic' | 'subcategory' | 'category';
    id: string;
  },
  userId: string
): Promise<BulkUploadResult> {
  if (destination.type === 'topic') {
    return bulkUploadQuestionsToTopic(questions, destination.id, userId);
  }

  // For subcategory or category, we need to find/create a default topic
  // or return an error asking user to specify a topic
  return {
    success: false,
    inserted: 0,
    errors: [],
    message: 'Bulk upload to subcategory or category requires specifying a topic. Please select a topic for upload.',
  };
}

/**
 * Parse JSON file content
 */
export async function parseJsonFile(file: File): Promise<{ data: any; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        resolve({ data });
      } catch (err: any) {
        resolve({ data: null, error: `Invalid JSON: ${err.message}` });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}
