/**
 * PRIORITE 1 - React Query hook for User Profile
 *
 * Centralizes all profile fetching with automatic caching.
 * Query key: ['profile', userId]
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'
import { showSuccess } from '../../lib/toast'
import { createOptimisticMutation } from '../../utils/optimisticUpdate'

// Fetch profile by user ID
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

// Fetch current user's profile
async function fetchCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    queryFn: () => (userId ? fetchProfile(userId) : null),
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
 * Optimistic update: profile changes reflect instantly, rollback on error
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  const optimistic = createOptimisticMutation<string, Partial<Profile>>(queryClient, {
    queryKeys: [['profile', 'current']],
    updateCache: (qc, updates) => {
      qc.setQueryData<Profile | null>(['profile', 'current'], (old) =>
        old ? { ...old, ...updates, updated_at: new Date().toISOString() } : old
      )
    },
    errorMessage: 'Erreur lors de la mise a jour du profil',
    invalidateKeys: (userId) => [
      ['profile', userId],
      ['profile', 'current'],
    ],
  })

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error
      return user.id
    },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSuccess: () => {
      showSuccess('Profil mis a jour')
    },
    onSettled: optimistic.onSettled,
  })
}
