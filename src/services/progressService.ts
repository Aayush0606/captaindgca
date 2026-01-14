import { supabase } from '@/lib/supabase';
import { UserProgress, CategoryProgress } from '@/types/questions';

export interface UserProgressResponse {
  user_id: string;
  total_tests_taken: number;
  total_questions_attempted: number;
  correct_answers: number;
  streak: number;
  last_active_date: string | null;
  updated_at: string;
}

export interface CategoryProgressResponse {
  id: string;
  user_id: string;
  category_id: string;
  questions_attempted: number;
  correct_answers: number;
  average_score: number | null;
  last_attempted: string | null;
}

/**
 * Get user progress
 */
export async function getUserProgress(
  userId: string
): Promise<{ data: UserProgressResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
}

/**
 * Get category progress for a user
 */
export async function getCategoryProgress(
  userId: string
): Promise<{ data: CategoryProgressResponse[] | null; error: any }> {
  const { data, error } = await supabase
    .from('category_progress')
    .select('*')
    .eq('user_id', userId)
    .order('last_attempted', { ascending: false, nullsFirst: false });

  return { data, error };
}

/**
 * Get category progress for a specific category
 */
export async function getCategoryProgressByCategory(
  userId: string,
  categoryId: string
): Promise<{ data: CategoryProgressResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('category_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .single();

  return { data, error };
}

/**
 * Map database response to application UserProgress type
 * Note: This function combines user_progress with category_progress and test_results
 * You may need to call multiple services and combine the results
 */
export function mapUserProgressToApp(
  userProgress: UserProgressResponse,
  categoryProgress: CategoryProgressResponse[],
  recentTests: any[] = []
): UserProgress {
  return {
    userId: userProgress.user_id,
    totalTestsTaken: userProgress.total_tests_taken,
    totalQuestionsAttempted: userProgress.total_questions_attempted,
    correctAnswers: userProgress.correct_answers,
    streak: userProgress.streak,
    lastActiveDate: userProgress.last_active_date
      ? new Date(userProgress.last_active_date)
      : new Date(),
    categoryProgress: categoryProgress.map(mapCategoryProgressToApp),
    recentTests: recentTests, // Should be mapped from test results
    bookmarkedQuestions: [], // Should be fetched separately
  };
}

/**
 * Map database response to application CategoryProgress type
 */
export function mapCategoryProgressToApp(
  categoryProgress: CategoryProgressResponse
): CategoryProgress {
  return {
    categoryId: categoryProgress.category_id,
    questionsAttempted: categoryProgress.questions_attempted,
    correctAnswers: categoryProgress.correct_answers,
    averageScore: categoryProgress.average_score ?? 0,
    lastAttempted: categoryProgress.last_attempted
      ? new Date(categoryProgress.last_attempted)
      : new Date(),
  };
}
