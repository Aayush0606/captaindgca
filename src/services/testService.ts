import { supabase } from '@/lib/supabase';
import { TestResult, UserAnswer } from '@/types/questions';

export interface TestResultInput {
  categoryId: string | null;
  score: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
}

export interface TestResultResponse {
  id: string;
  user_id: string;
  category_id: string | null;
  score: number;
  total_questions: number;
  time_taken: number;
  answers: UserAnswer[];
  created_at: string;
}

/**
 * Save a test result to the database
 */
export async function saveTestResult(
  userId: string,
  testResult: TestResultInput
): Promise<{ data: TestResultResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('test_results')
    .insert({
      user_id: userId,
      category_id: testResult.categoryId,
      score: testResult.score,
      total_questions: testResult.totalQuestions,
      time_taken: testResult.timeTaken,
      answers: testResult.answers,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get test results for a user
 */
export async function getUserTestResults(
  userId: string,
  limit: number = 50
): Promise<{ data: TestResultResponse[] | null; error: any }> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * Get a specific test result by ID
 */
export async function getTestResultById(
  testResultId: string
): Promise<{ data: TestResultResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('id', testResultId)
    .single();

  return { data, error };
}

/**
 * Save an incomplete test result (when user exits test)
 */
export async function saveIncompleteTestResult(
  userId: string,
  testResult: TestResultInput & { exited: boolean }
): Promise<{ data: TestResultResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('test_results')
    .insert({
      user_id: userId,
      category_id: testResult.categoryId,
      score: testResult.score,
      total_questions: testResult.totalQuestions,
      time_taken: testResult.timeTaken,
      answers: testResult.answers,
      // Store exit status in answers metadata or as a separate field
      // For now, we'll add a flag in the answers array metadata
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Convert database response to application TestResult type
 */
export function mapTestResultToApp(result: TestResultResponse): TestResult {
  return {
    id: result.id,
    date: new Date(result.created_at),
    categoryId: result.category_id || '',
    score: result.score,
    totalQuestions: result.total_questions,
    timeTaken: result.time_taken,
    answers: result.answers as UserAnswer[],
  };
}
