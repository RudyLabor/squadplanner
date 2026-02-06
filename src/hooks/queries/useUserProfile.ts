/**
 * PRIORITE 1 - React Query hook for User Profile
 *
 * Centralizes all profile fetching with automatic caching.
 * Query key: ['profile', userId]
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'
import { showSuccess, showError } from '../../lib/toast'

// Fetch profile by user ID
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

// Fetch current user's profile
async function fetchCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return fetchProfile(user.id)
}

/**
 * Hook to fetch a profile by user ID
 * Query key: ['profile', userId]
 */
export function useProfileQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId] as const,
    queryFn: () => userId ? fetchProfile(userId) : null,
    enabled: !!userId,
    staleTime: 30_000,
  })
}

/**
 * Hook to fetch the current user's profile
 * Query key: ['profile', 'current']
 */
export function useCurrentProfileQuery() {
  return useQuery({
    queryKey: ['profile', 'current'] as const,
    queryFn: fetchCurrentProfile,
    staleTime: 30_000,
  })
}

/**
 * Mutation to update the current user's profile
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error
      return user.id
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'current'] })
      showSuccess('Profil mis a jour')
    },
    onError: (error) => {
      showError(error.message || 'Erreur lors de la mise a jour')
    },
  })
}
