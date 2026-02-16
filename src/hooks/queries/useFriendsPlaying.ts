/**
 * PRIORITE 1 & 3 - React Query hook for Friends Playing
 *
 * Replaces direct get_friends_playing RPC calls with cached query.
 * Query key: ['friends_playing', userId]
 *
 * The RPC function get_friends_playing is defined in the
 * voice_party_tracking migration and returns friends who are:
 * - Currently playing a game (current_game set, recent last_seen_at)
 * - Or in a voice party (voice_channel_id set)
 */
import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

export interface FriendPlaying {
  friend_id: string
  username: string
  avatar_url: string | null
  current_game: string | null
  last_seen_at: string | null
  squad_id: string
  squad_name: string
  party_member_count: number
  voice_channel_id: string | null
  is_in_voice: boolean
}

// Fetch friends who are currently playing or in voice party
async function fetchFriendsPlaying(userId: string): Promise<FriendPlaying[]> {
  try {
    // Call RPC with p_user_id parameter (matches the fix migration 20260206140001)
    const { data, error } = await supabase.rpc('get_friends_playing', {
      p_user_id: userId,
    })

    if (error) {
      // get_friends_playing requiert is_online/current_game dans profiles (migration 20260206140001).
      // En attendant ces colonnes, on retourne gracieusement une liste vide.
      return []
    }

    return data || []
  } catch {
    return []
  }
}

/**
 * Hook to fetch friends who are playing or in voice party
 * Query key: ['friends_playing', userId]
 */
export function useFriendsPlayingQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['friends_playing', userId] as const,
    queryFn: () => (userId ? fetchFriendsPlaying(userId) : []),
    enabled: !!userId,
    staleTime: 30_000, // 30 seconds
    retry: false, // Don't retry if RPC doesn't exist
  })
}
