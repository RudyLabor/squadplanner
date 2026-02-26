/**
 * PRIORITE 1 & 4 - React Query hook for Unread Message Count
 *
 * Replaces HEAD requests with optimized count queries.
 * Query key: ['messages', 'unread']
 *
 * Uses select('id') instead of select('*') to reduce server load.
 * Gracefully handles 503/5xx errors by returning 0 counts instead of throwing.
 */
import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

interface UnreadCounts {
  squadUnread: number
  dmUnread: number
  totalUnread: number
}

const ZERO_COUNTS: UnreadCounts = { squadUnread: 0, dmUnread: 0, totalUnread: 0 }

// Fetch unread counts with optimized queries
async function fetchUnreadCounts(userId: string, squadIds: string[]): Promise<UnreadCounts> {
  if (squadIds.length === 0) {
    return ZERO_COUNTS
  }

  try {
    // Use Promise.allSettled to gracefully handle partial failures
    const [squadCountResult, dmCountResult] = await Promise.allSettled([
      // Count unread squad messages - use 'id' instead of '*' to reduce load
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('squad_id', squadIds)
        .neq('sender_id', userId)
        .not('read_by', 'cs', `{${userId}}`),

      // Count unread DMs
      supabase
        .from('direct_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .is('read_at', null),
    ])

    // Extract counts gracefully — return 0 on error/503 instead of crashing
    const squadUnread =
      squadCountResult.status === 'fulfilled' && !squadCountResult.value.error
        ? squadCountResult.value.count || 0
        : 0

    const dmUnread =
      dmCountResult.status === 'fulfilled' && !dmCountResult.value.error
        ? dmCountResult.value.count || 0
        : 0

    return {
      squadUnread,
      dmUnread,
      totalUnread: squadUnread + dmUnread,
    }
  } catch {
    // Network error or other unexpected failure — return zeros silently
    return ZERO_COUNTS
  }
}

/**
 * Hook to fetch unread message counts
 * Query key: ['messages', 'unread', userId]
 */
export function useUnreadCountQuery(userId: string | undefined, squadIds: string[]) {
  return useQuery({
    queryKey: ['messages', 'unread', userId] as const,
    queryFn: () => (userId ? fetchUnreadCounts(userId, squadIds) : ZERO_COUNTS),
    enabled: !!userId && squadIds.length > 0,
    staleTime: 30_000,
    retry: 1,
    // Unread counts are updated via Realtime subscriptions in the app,
    // this is just the initial fetch
  })
}
