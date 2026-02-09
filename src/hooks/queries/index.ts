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

// Squad Members
export {
  useSquadMembersQuery,
  useUserSquadIdsQuery,
  useMemberCountsQuery,
  type SquadMemberWithProfile,
} from './useSquadMembers'

// User Profile
export {
  useProfileQuery,
  useCurrentProfileQuery,
  useUpdateProfileMutation,
} from './useUserProfile'

// Subscriptions
export {
  useSquadSubscriptionQuery,
  useUserSubscriptionsQuery,
  type Subscription,
} from './useSquadSubscriptions'

// Squad Details
export {
  useSquadDetailsQuery,
  useSquadsPremiumStatusQuery,
  type SquadDetails,
} from './useSquadDetails'

// Auth
export { useAuthUserQuery } from './useAuthQuery'

// AI Coach
export { useAICoachQuery, type AICoachTip } from './useAICoach'

// Friends Playing
export { useFriendsPlayingQuery, type FriendPlaying } from './useFriendsPlaying'

// Unread Count
export { useUnreadCountQuery } from './useUnreadCountQuery'

// Challenges
export {
  useChallengesQuery,
  useClaimChallengeXPMutation,
  type Challenge,
  type UserChallenge,
  type SeasonalBadge,
  type ChallengesData,
} from './useChallenges'

// Squad Leaderboard
export {
  useSquadLeaderboardQuery,
  type LeaderboardEntry,
} from './useSquadLeaderboard'

// Phase 6: Social Discovery
export {
  useBrowseSquadsQuery,
  useGlobalLeaderboardQuery,
  useMatchmakingQuery,
  usePublicProfileQuery,
} from './useDiscoverQueries'

// Re-export query client and keys
export { queryClient, queryKeys } from '../../lib/queryClient'
