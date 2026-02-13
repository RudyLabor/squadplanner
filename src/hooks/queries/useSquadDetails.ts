/**
 * PRIORITE 1 - React Query hook for Squad Details
 *
 * Centralizes squad detail fetching (id, is_premium, etc).
 * Query key: ['squads', squadId]
 */
import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

export interface SquadDetails {
  id: string
  name: string
  game: string
  invite_code: string
  owner_id: string
  is_premium: boolean
  created_at: string
  total_sessions?: number
  total_members?: number
}

// Fetch squad details by ID
async function fetchSquadDetails(squadId: string): Promise<SquadDetails | null> {
  const { data, error } = await supabase
    .from('squads')
    .select(
      'id, name, game, invite_code, owner_id, is_premium, created_at, total_sessions, total_members'
    )
    .eq('id', squadId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

// Fetch premium status for multiple squads
async function fetchSquadsPremiumStatus(squadIds: string[]): Promise<Record<string, boolean>> {
  if (squadIds.length === 0) return {}

  const { data, error } = await supabase.from('squads').select('id, is_premium').in('id', squadIds)

  if (error) throw error

  const result: Record<string, boolean> = {}
  data?.forEach((s) => {
    result[s.id] = s.is_premium || false
  })
  return result
}

/**
 * Hook to fetch details for a specific squad
 * Query key: ['squads', squadId]
 */
export function useSquadDetailsQuery(squadId: string | undefined) {
  return useQuery({
    queryKey: ['squads', squadId] as const,
    queryFn: () => (squadId ? fetchSquadDetails(squadId) : null),
    enabled: !!squadId,
    staleTime: 30_000,
  })
}

/**
 * Hook to fetch premium status for multiple squads
 * Query key: ['squads', 'premium', squadIds]
 */
export function useSquadsPremiumStatusQuery(squadIds: string[]) {
  return useQuery({
    queryKey: ['squads', 'premium', squadIds] as const,
    queryFn: () => fetchSquadsPremiumStatus(squadIds),
    enabled: squadIds.length > 0,
    staleTime: 60_000, // Premium status doesn't change often
  })
}
