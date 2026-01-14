import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone_number: string;
  created_at: string;
  email?: string; // Email might not be available from profiles table
}

export interface UserStats {
  tests_taken: number;
  questions_attempted: number;
}

export interface UserWithStats extends UserProfile {
  stats: UserStats;
}

export interface UserProfileResponse {
  id: string;
  full_name: string | null;
  phone_number: string;
  created_at: string;
}

/**
 * Get all users with their statistics
 */
export async function getAllUsers(): Promise<{ data: UserWithStats[] | null; error: any }> {
  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError || !profiles) {
    return { data: null, error: profilesError };
  }

  // Get stats for each user
  const usersWithStats = await Promise.all(
    profiles.map(async (profile) => {
      // Get test count
      const { count: testCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      // Get questions attempted from user_progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('total_questions_attempted')
        .eq('user_id', profile.id)
        .single();

      return {
        id: profile.id,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        created_at: profile.created_at,
        stats: {
          tests_taken: testCount || 0,
          questions_attempted: progress?.total_questions_attempted || 0,
        },
      };
    })
  );

  return { data: usersWithStats, error: null };
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<{ data: UserStats | null; error: any }> {
  // Get test count
  const { count: testCount } = await supabase
    .from('test_results')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get questions attempted from user_progress
  const { data: progress, error: progressError } = await supabase
    .from('user_progress')
    .select('total_questions_attempted')
    .eq('user_id', userId)
    .single();

  if (progressError && progressError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is fine (user might not have progress yet)
    return { data: null, error: progressError };
  }

  return {
    data: {
      tests_taken: testCount || 0,
      questions_attempted: progress?.total_questions_attempted || 0,
    },
    error: null,
  };
}
