// Re-export all skeleton components from split files
// Original 607-line file split into SkeletonBase, SkeletonPages, SkeletonCLS

// Base primitives
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonWrapper,
} from './skeleton/SkeletonBase'

export { default } from './skeleton/SkeletonBase'

// Page-specific skeletons
export {
  SkeletonSessionCard,
  SessionCardSkeleton,
  SkeletonSquadCard,
  SquadCardSkeleton,
  SkeletonMessageBubble,
  SkeletonProfile,
  ProfileSkeleton,
  SkeletonSquadDetail,
  SquadDetailSkeleton,
  SkeletonHomePage,
  SkeletonChatPage,
  SkeletonSettingsPage,
  SkeletonSessionDetail,
  SkeletonPartyPage,
  SkeletonCallHistory,
  SkeletonDiscoverPage,
} from './skeleton/SkeletonPages'

// CLS-prevention skeletons (fixed dimensions)
export {
  SkeletonAICoach,
  SkeletonReliabilityBadge,
  SkeletonFriendsPlaying,
  SkeletonStatsRow,
  SkeletonStreakCounter,
} from './skeleton/SkeletonCLS'
