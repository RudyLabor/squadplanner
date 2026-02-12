/**
 * PHASE 6 - React Query hooks for Social Discovery
 *
 * Hooks for browsing public squads, global leaderboard, and matchmaking.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryClient'
import type {
  PublicSquadResult,
  GlobalLeaderboardEntry,
  MatchmakingPlayer,
} from '../../types/database'

// --- Browse Public Squads ---

async function fetchPublicSquads(game?: string, region?: string): Promise<PublicSquadResult[]> {
  const { data, error } = await supabase.rpc('browse_public_squads', {
    p_game: game || null,
    p_region: region || null,
    p_limit: 20,
    p_offset: 0,
  })

  if (error) {
    console.warn('browse_public_squads error:', error.message)
    return []
  }

  const squads = (data || []) as PublicSquadResult[]

  // Filter out test/debug squads
  const TEST_PATTERNS = /\b(test|debug|audit)\b/i
  return squads.filter((s) => !TEST_PATTERNS.test(s.name))
}

export function useBrowseSquadsQuery(game?: string, region?: string) {
  return useQuery({
    queryKey: queryKeys.discover.publicSquads(game, region),
    queryFn: () => fetchPublicSquads(game, region),
    staleTime: 60_000,
    retry: false,
  })
}

// --- Global Leaderboard ---

async function fetchGlobalLeaderboard(
  game?: string,
  region?: string,
  limit = 50
): Promise<GlobalLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_global_leaderboard', {
    p_game: game || null,
    p_region: region || null,
    p_limit: limit,
  })

  if (error) {
    console.warn('get_global_leaderboard error:', error.message)
    return []
  }

  return (data || []) as GlobalLeaderboardEntry[]
}

export function useGlobalLeaderboardQuery(game?: string, region?: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.discover.globalLeaderboard(game, region),
    queryFn: () => fetchGlobalLeaderboard(game, region, limit),
    staleTime: 60_000,
    retry: false,
  })
}

// --- Matchmaking: Find Players ---

async function fetchMatchmakingPlayers(
  game?: string,
  region?: string
): Promise<MatchmakingPlayer[]> {
  const { data, error } = await supabase.rpc('find_players_for_squad', {
    p_game: game || null,
    p_region: region || null,
    p_limit: 20,
  })

  if (error) {
    console.warn('find_players_for_squad error:', error.message)
    return []
  }

  return (data || []) as MatchmakingPlayer[]
}

export function useMatchmakingQuery(game?: string, region?: string) {
  return useQuery({
    queryKey: queryKeys.discover.matchmaking(game, region),
    queryFn: () => fetchMatchmakingPlayers(game, region),
    staleTime: 60_000,
    retry: false,
  })
}

// --- Public Profile by username ---

async function fetchPublicProfile(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, avatar_url, bio, reliability_score, total_sessions, total_checkins, total_noshow, total_late, xp, level, streak_days, region, preferred_games, playstyle, twitch_username, discord_username, created_at'
    )
    .eq('username', username)
    .single()

  if (error) {
    return null
  }

  return data
}

export function usePublicProfileQuery(username: string | undefined) {
  return useQuery({
    queryKey: queryKeys.discover.publicProfile(username || ''),
    queryFn: () => (username ? fetchPublicProfile(username) : null),
    enabled: !!username,
    staleTime: 60_000,
    retry: false,
  })
}
