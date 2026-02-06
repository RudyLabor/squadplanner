/**
 * PRIORITE 1 - React Query hook for Auth User
 *
 * Centralizes auth.getUser() calls with caching.
 * Query key: ['auth', 'user']
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

// Fetch current auth user
async function fetchAuthUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.warn('Auth error:', error.message)
    return null
  }
  return user
}

/**
 * Hook to get the current authenticated user
 * Query key: ['auth', 'user']
 * Uses longer staleTime since auth state changes less frequently
 */
export function useAuthUserQuery() {
  return useQuery({
    queryKey: ['auth', 'user'] as const,
    queryFn: fetchAuthUser,
    staleTime: 60_000, // 1 minute - auth doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry auth failures
  })
}
