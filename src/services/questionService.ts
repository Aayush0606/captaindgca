import { supabase } from '@/lib/supabase';
import { Question } from '@/types/questions';

export interface QuestionFilters {
  topicId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface QuestionInput {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionResponse {
  id: string;
  topic_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Get questions with optional filters
 */
export async function getQuestions(
  filters?: QuestionFilters
): Promise<{ data: QuestionResponse[] | null; error: any }> {
  let query = supabase.from('questions').select('*');

  if (filters?.topicId) {
    query = query.eq('topic_id', filters.topicId);
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  if (filters?.search) {
    // Use PostgreSQL full-text search or ILIKE for simple search
    query = query.or(
      `question.ilike.%${filters.search}%,explanation.ilike.%${filters.search}%`
    );
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 100) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  return { data, error };
}

/**
 * Get a question by ID
 */
export async function getQuestionById(
  id: string
): Promise<{ data: QuestionResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Get questions by topic
 */
export async function getQuestionsByTopic(
  topicId: string
): Promise<{ data: QuestionResponse[] | null; error: any }> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Get questions by category (through topics)
 */
export async function getQuestionsByCategory(
  categoryId: string
): Promise<{ data: QuestionResponse[] | null; error: any }> {
  // First, get all topics for this category using junction table
  const { data: topicCategories, error: junctionError } = await supabase
    .from('topic_categories')
    .select('topic_id')
    .eq('category_id', categoryId);

  if (junctionError || !topicCategories || topicCategories.length === 0) {
    return { data: [], error: junctionError };
  }

  const topicIds = topicCategories.map(tc => tc.topic_id);

  // Get all questions for these topics
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('topic_id', topicIds)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Get all questions (for "all categories" option)
 */
export async function getAllQuestions(): Promise<{ data: QuestionResponse[] | null; error: any }> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}


/**
 * Create a new question (admin only)
 */
export async function createQuestion(
  question: QuestionInput,
  userId: string
): Promise<{ data: QuestionResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      topic_id: question.topicId,
      question: question.question,
      options: question.options,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      created_by: userId,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a question (admin only)
 */
export async function updateQuestion(
  id: string,
  question: Partial<QuestionInput>
): Promise<{ data: QuestionResponse | null; error: any }> {
  const updateData: any = {};

  if (question.question !== undefined) updateData.question = question.question;
  if (question.options !== undefined) updateData.options = question.options;
  if (question.correctAnswer !== undefined) updateData.correct_answer = question.correctAnswer;
  if (question.explanation !== undefined) updateData.explanation = question.explanation;
  if (question.topicId !== undefined) updateData.topic_id = question.topicId;
  if (question.difficulty !== undefined) updateData.difficulty = question.difficulty;

  const { data, error } = await supabase
    .from('questions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a question (admin only)
 */
export async function deleteQuestion(
  id: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Map database response to application Question type
 */
export function mapQuestionToApp(question: QuestionResponse): Question {
  return {
    id: question.id,
    question: question.question,
    options: question.options,
    correctAnswer: question.correct_answer,
    explanation: question.explanation || '',
    topicId: question.topic_id,
    difficulty: question.difficulty,
  };
}
