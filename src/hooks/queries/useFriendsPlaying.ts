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
import { supabase } from '../../lib/supabase'

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
    const { data, error } = await supabase.rpc('get_friends_playing', {
      user_id: userId
    })

    if (error) {
      // RPC might not exist yet - silent failure
      console.warn('get_friends_playing RPC not available:', error.message)
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
    queryFn: () => userId ? fetchFriendsPlaying(userId) : [],
    enabled: !!userId,
    staleTime: 30_000, // 30 seconds
    retry: false, // Don't retry if RPC doesn't exist
  })
}
