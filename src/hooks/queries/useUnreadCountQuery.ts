/**
 * PRIORITE 1 & 4 - React Query hook for Unread Message Count
 *
 * Replaces HEAD requests with optimized count queries.
 * Query key: ['messages', 'unread']
 *
 * Uses select('id') instead of select('*') to reduce server load.
 */
import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

interface UnreadCounts {
  squadUnread: number
  dmUnread: number
  totalUnread: number
}

// Fetch unread counts with optimized queries
async function fetchUnreadCounts(userId: string, squadIds: string[]): Promise<UnreadCounts> {
  if (squadIds.length === 0) {
    return { squadUnread: 0, dmUnread: 0, totalUnread: 0 }
  }

  // Use Promise.all for parallel queries
  const [squadCountResult, dmCountResult] = await Promise.all([
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

  const squadUnread = squadCountResult.count || 0
  const dmUnread = dmCountResult.count || 0

  return {
    squadUnread,
    dmUnread,
    totalUnread: squadUnread + dmUnread,
  }
}

/**
 * Hook to fetch unread message counts
 * Query key: ['messages', 'unread', userId]
 */
export function useUnreadCountQuery(userId: string | undefined, squadIds: string[]) {
  return useQuery({
    queryKey: ['messages', 'unread', userId] as const,
    queryFn: () =>
      userId
        ? fetchUnreadCounts(userId, squadIds)
        : { squadUnread: 0, dmUnread: 0, totalUnread: 0 },
    enabled: !!userId && squadIds.length > 0,
    staleTime: 30_000,
    // Unread counts are updated via Realtime subscriptions in the app,
    // this is just the initial fetch
  })
}
