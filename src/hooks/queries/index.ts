/**
 * PHASE 1.1 - React Query hooks exports
 *
 * Centralized exports for all React Query hooks.
 * These hooks provide:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Optimistic updates
 * - Loading and error states
 */

// Squads
export {
  useSquadsQuery,
  useSquadQuery,
  useCreateSquadMutation,
  useJoinSquadMutation,
  useLeaveSquadMutation,
  useDeleteSquadMutation,
  type SquadWithMembers,
} from './useSquadsQuery'

// Sessions
export {
  useSquadSessionsQuery,
  useUpcomingSessionsQuery,
  useSessionQuery,
  useCreateSessionMutation,
  useRsvpMutation,
  useCheckinMutation,
  useConfirmSessionMutation,
  useCancelSessionMutation,
  type SessionWithDetails,
} from './useSessionsQuery'

// Re-export query client and keys
export { queryClient, queryKeys } from '../../lib/queryClient'
