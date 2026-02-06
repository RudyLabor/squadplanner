/**
 * PHASE 1.1 - React Query Configuration
 *
 * QueryClient configuration optimized for Squad Planner:
 * - 30s stale time (data considered fresh for 30s)
 * - 5min cache time (garbage collect after 5min)
 * - Automatic refetch on window focus
 * - Retry with exponential backoff
 *
 * Benefits:
 * - Request deduplication (same query key = 1 request)
 * - Smart caching (34 requests → ~10)
 * - Instant navigation (cached data shown immediately)
 * - Background refetching (stale data updated silently)
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30 seconds
      staleTime: 30 * 1000,
      // Keep in cache for 5 minutes after last use
      gcTime: 5 * 60 * 1000,
      // Retry failed requests with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Refetch on window focus (user comes back to tab)
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
})

// Query key factory for consistent key management
export const queryKeys = {
  // Squads
  squads: {
    all: ['squads'] as const,
    lists: () => [...queryKeys.squads.all, 'list'] as const,
    list: () => [...queryKeys.squads.lists()] as const,
    details: () => [...queryKeys.squads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.squads.details(), id] as const,
    members: (squadId: string) => [...queryKeys.squads.detail(squadId), 'members'] as const,
  },

  // Sessions
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (squadId?: string) => squadId
      ? [...queryKeys.sessions.lists(), { squadId }] as const
      : [...queryKeys.sessions.lists()] as const,
    upcoming: () => [...queryKeys.sessions.all, 'upcoming'] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
    rsvps: (sessionId: string) => [...queryKeys.sessions.detail(sessionId), 'rsvps'] as const,
  },

  // User profile
  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
    byId: (id: string) => [...queryKeys.profile.all, id] as const,
    stats: (userId: string) => [...queryKeys.profile.byId(userId), 'stats'] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    squad: (squadId: string) => [...queryKeys.messages.all, 'squad', squadId] as const,
    direct: (recipientId: string) => [...queryKeys.messages.all, 'direct', recipientId] as const,
    conversations: () => [...queryKeys.messages.all, 'conversations'] as const,
    unread: () => [...queryKeys.messages.all, 'unread'] as const,
  },

  // Friends playing
  friendsPlaying: {
    all: ['friends-playing'] as const,
    list: () => [...queryKeys.friendsPlaying.all, 'list'] as const,
  },

  // Premium
  premium: {
    all: ['premium'] as const,
    status: () => [...queryKeys.premium.all, 'status'] as const,
  },

  // Challenges
  challenges: {
    all: ['challenges'] as const,
    active: () => [...queryKeys.challenges.all, 'active'] as const,
    completed: () => [...queryKeys.challenges.all, 'completed'] as const,
  },
}
