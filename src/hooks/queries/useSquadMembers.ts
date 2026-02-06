/**
 * PRIORITE 1 - React Query hook for Squad Members
 *
 * Centralizes all squad_members fetching with automatic caching.
 * Replaces direct supabase.from('squad_members').select(...) calls.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface SquadMemberWithProfile {
  id: string
  squad_id: string
  user_id: string
  role: 'leader' | 'moderator' | 'member'
  joined_at: string
  profiles?: {
    username?: string
    avatar_url?: string
    reliability_score?: number
  }
}

// Fetch members for a specific squad
async function fetchSquadMembers(squadId: string): Promise<SquadMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('squad_members')
    .select('*, profiles(username, avatar_url, reliability_score)')
    .eq('squad_id', squadId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Fetch all squad IDs for a user
async function fetchUserSquadIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('squad_members')
    .select('squad_id')
    .eq('user_id', userId)

  if (error) throw error
  return data?.map(m => m.squad_id) || []
}

// Fetch member count for multiple squads
async function fetchMemberCounts(squadIds: string[]): Promise<Record<string, number>> {
  if (squadIds.length === 0) return {}

  const { data, error } = await supabase
    .from('squad_members')
    .select('squad_id')
    .in('squad_id', squadIds)

  if (error) throw error

  const counts: Record<string, number> = {}
  data?.forEach(m => {
    counts[m.squad_id] = (counts[m.squad_id] || 0) + 1
  })
  return counts
}

/**
 * Hook to fetch members for a specific squad
 * Query key: ['squad_members', squadId]
 */
export function useSquadMembersQuery(squadId: string | undefined) {
  return useQuery({
    queryKey: ['squad_members', squadId] as const,
    queryFn: () => squadId ? fetchSquadMembers(squadId) : [],
    enabled: !!squadId,
    staleTime: 30_000,
  })
}

/**
 * Hook to fetch user's squad IDs
 * Query key: ['squad_members', 'user', userId]
 */
export function useUserSquadIdsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['squad_members', 'user', userId] as const,
    queryFn: () => userId ? fetchUserSquadIds(userId) : [],
    enabled: !!userId,
    staleTime: 30_000,
  })
}

/**
 * Hook to fetch member counts for multiple squads
 * Query key: ['squad_members', 'counts', squadIds]
 */
export function useMemberCountsQuery(squadIds: string[]) {
  return useQuery({
    queryKey: ['squad_members', 'counts', squadIds] as const,
    queryFn: () => fetchMemberCounts(squadIds),
    enabled: squadIds.length > 0,
    staleTime: 30_000,
  })
}
