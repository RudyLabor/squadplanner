/**
 * PRIORITE 1 - React Query hook for Squad Leaderboard
 *
 * Replaces direct rpc('get_squad_leaderboard') calls with cached query.
 * Query key: ['leaderboard', squadId]
 */
import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  xp: number
  level: number
  reliability_score: number
  streak_days: number
}

// Fetch squad leaderboard
async function fetchSquadLeaderboard(squadId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_squad_leaderboard', {
    p_squad_id: squadId,
  })

  if (error) {
    console.warn('Leaderboard RPC error:', error.message)
    return []
  }

  return data || []
}

/**
 * Hook to fetch squad leaderboard
 * Query key: ['leaderboard', squadId]
 */
export function useSquadLeaderboardQuery(squadId: string | undefined) {
  return useQuery({
    queryKey: ['leaderboard', squadId] as const,
    queryFn: () => (squadId ? fetchSquadLeaderboard(squadId) : []),
    enabled: !!squadId,
    staleTime: 60_000, // 1 minute
    retry: false, // Don't retry if RPC doesn't exist
  })
}
