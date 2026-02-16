import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from './SkeletonBase'

// =============================================================================
// PAGE-SPECIFIC SKELETON COMPONENTS
// =============================================================================

/**
 * Session card skeleton for Home page
 */
export function SkeletonSessionCard() {
  return (
    <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle" aria-hidden="true">
      {/* Header with game icon and info */}
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10" rounded="lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" rounded="sm" />
          <Skeleton className="h-3 w-24" rounded="sm" />
        </div>
        <Skeleton className="h-6 w-16" rounded="full" />
      </div>

      {/* Participants avatars */}
      <div className="flex gap-2 mb-3">
        <SkeletonAvatar size="sm" />
        <SkeletonAvatar size="sm" />
        <SkeletonAvatar size="sm" />
        <Skeleton className="w-8 h-8 flex items-center justify-center" rounded="full" />
      </div>

      {/* RSVP buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" rounded="lg" />
        <Skeleton className="h-9 w-9" rounded="lg" />
        <Skeleton className="h-9 w-9" rounded="lg" />
      </div>
    </div>
  )
}

// Alias for backwards compatibility
export const SessionCardSkeleton = SkeletonSessionCard

/**
 * Squad card skeleton
 */
export function SkeletonSquadCard() {
  return (
    <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle" aria-hidden="true">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12" rounded="xl" />
        <div className="flex-1">
          <Skeleton className="h-5 w-28 mb-2" rounded="sm" />
          <Skeleton className="h-3 w-20" rounded="sm" />
        </div>
        <Skeleton className="w-6 h-6" rounded="md" />
      </div>

      {/* Member avatars */}
      <div className="flex -space-x-2 mb-3">
        <SkeletonAvatar size="sm" />
        <SkeletonAvatar size="sm" />
        <SkeletonAvatar size="sm" />
        <SkeletonAvatar size="sm" />
      </div>

      <SkeletonText lines={1} lineWidth="full" />
    </div>
  )
}

// Alias for backwards compatibility
export const SquadCardSkeleton = SkeletonSquadCard

/**
 * Message bubble skeleton for chat
 */
export function SkeletonMessageBubble({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`} aria-hidden="true">
      {!isOwn && <SkeletonAvatar size="sm" />}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && <Skeleton className="h-3 w-20 mb-1" rounded="sm" />}
        <Skeleton className={`h-16 w-48 ${isOwn ? 'bg-primary/20' : ''}`} rounded="xl" />
        <Skeleton className="h-2 w-12 mt-1" rounded="sm" />
      </div>
    </div>
  )
}

/**
 * Profile page skeleton
 */
export function SkeletonProfile() {
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      {/* Avatar */}
      <SkeletonAvatar size="xl" className="w-24 h-24 mb-4" />

      {/* Name and bio */}
      <Skeleton className="h-6 w-32 mb-2" rounded="md" />
      <Skeleton className="h-4 w-48 mb-2" rounded="sm" />
      <Skeleton className="h-4 w-24 mb-6" rounded="sm" />

      {/* Tier progress bar */}
      <Skeleton className="h-2 w-full max-w-xs mb-6" rounded="full" />

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-6">
        <div className="text-center p-3 rounded-xl bg-bg-elevated border border-border-subtle">
          <Skeleton className="h-6 w-10 mx-auto mb-1" rounded="sm" />
          <Skeleton className="h-3 w-12 mx-auto" rounded="sm" />
        </div>
        <div className="text-center p-3 rounded-xl bg-bg-elevated border border-border-subtle">
          <Skeleton className="h-6 w-10 mx-auto mb-1" rounded="sm" />
          <Skeleton className="h-3 w-12 mx-auto" rounded="sm" />
        </div>
        <div className="text-center p-3 rounded-xl bg-bg-elevated border border-border-subtle">
          <Skeleton className="h-6 w-10 mx-auto mb-1" rounded="sm" />
          <Skeleton className="h-3 w-12 mx-auto" rounded="sm" />
        </div>
      </div>

      {/* Achievements section */}
      <div className="w-full max-w-xs">
        <Skeleton className="h-5 w-28 mb-3" rounded="sm" />
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="w-12 h-12" rounded="xl" />
          <Skeleton className="w-12 h-12" rounded="xl" />
          <Skeleton className="w-12 h-12" rounded="xl" />
          <Skeleton className="w-12 h-12" rounded="xl" />
        </div>
      </div>
    </div>
  )
}

// Alias for backwards compatibility
export const ProfileSkeleton = SkeletonProfile

/**
 * Squad detail page skeleton
 */
export function SkeletonSquadDetail() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16" rounded="xl" />
        <div className="flex-1">
          <Skeleton className="h-6 w-40 mb-2" rounded="md" />
          <Skeleton className="h-4 w-24" rounded="sm" />
        </div>
        <SkeletonButton size="sm" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20" rounded="xl" />
        <Skeleton className="h-20" rounded="xl" />
        <Skeleton className="h-20" rounded="xl" />
      </div>

      {/* Members section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" rounded="sm" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated">
              <SkeletonAvatar size="md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" rounded="sm" />
                <Skeleton className="h-3 w-16" rounded="sm" />
              </div>
              <Skeleton className="h-6 w-16" rounded="full" />
            </div>
          ))}
        </div>
      </div>

      {/* Sessions section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" rounded="sm" />
        <SkeletonSessionCard />
        <SkeletonSessionCard />
      </div>
    </div>
  )
}

// Alias for backwards compatibility
export const SquadDetailSkeleton = SkeletonSquadDetail

/**
 * Home page skeleton with full layout
 */
export function SkeletonHomePage() {
  return (
    <div className="space-y-6 p-4" aria-hidden="true">
      {/* Welcome header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" rounded="md" />
        <Skeleton className="h-4 w-64" rounded="sm" />
      </div>

      {/* Next session section */}
      <div>
        <Skeleton className="h-5 w-28 mb-3" rounded="sm" />
        <SkeletonSessionCard />
      </div>

      {/* Squads section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-24" rounded="sm" />
          <Skeleton className="h-4 w-16" rounded="sm" />
        </div>
        <div className="space-y-3">
          <SkeletonSquadCard />
          <SkeletonSquadCard />
        </div>
      </div>
    </div>
  )
}

/**
 * Chat/Messages page skeleton
 */
export function SkeletonChatPage() {
  return (
    <div className="flex flex-col h-full" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
        <SkeletonAvatar size="md" />
        <div className="flex-1">
          <Skeleton className="h-4 w-28 mb-1" rounded="sm" />
          <Skeleton className="h-3 w-20" rounded="sm" />
        </div>
        <Skeleton className="w-8 h-8" rounded="lg" />
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <SkeletonMessageBubble />
        <SkeletonMessageBubble isOwn />
        <SkeletonMessageBubble />
        <SkeletonMessageBubble />
        <SkeletonMessageBubble isOwn />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" rounded="xl" />
          <Skeleton className="w-10 h-10" rounded="xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * Settings page skeleton
 */
export function SkeletonSettingsPage() {
  return (
    <div className="space-y-6 p-4" aria-hidden="true">
      <Skeleton className="h-7 w-24" rounded="md" />

      {/* Settings sections */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-4 w-20" rounded="sm" />
          <div className="rounded-xl bg-bg-elevated border border-border-subtle divide-y divide-border-subtle">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5" rounded="md" />
                  <Skeleton className="h-4 w-32" rounded="sm" />
                </div>
                <Skeleton className="w-10 h-6" rounded="full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Session detail page skeleton
 */
export function SkeletonSessionDetail() {
  return (
    <div className="space-y-6 p-4" aria-hidden="true">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9" rounded="lg" />
        <Skeleton className="h-6 w-48" rounded="md" />
      </div>

      {/* Session info card */}
      <div className="p-5 rounded-2xl bg-bg-elevated border border-border-subtle space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12" rounded="xl" />
          <div className="flex-1">
            <Skeleton className="h-5 w-36 mb-2" rounded="sm" />
            <Skeleton className="h-4 w-28" rounded="sm" />
          </div>
          <Skeleton className="h-7 w-20" rounded="full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" rounded="sm" />
          <Skeleton className="h-4 w-20" rounded="sm" />
          <Skeleton className="h-4 w-16" rounded="sm" />
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" rounded="sm" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated">
            <SkeletonAvatar size="md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" rounded="sm" />
              <Skeleton className="h-3 w-16" rounded="sm" />
            </div>
            <Skeleton className="h-6 w-16" rounded="full" />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <SkeletonButton className="flex-1" />
        <SkeletonButton className="flex-1" />
      </div>
    </div>
  )
}

/**
 * Party page skeleton
 */
export function SkeletonPartyPage() {
  return (
    <div className="space-y-6 p-4" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" rounded="md" />
        <Skeleton className="w-9 h-9" rounded="lg" />
      </div>

      {/* Active party card */}
      <div className="p-5 rounded-2xl bg-bg-elevated border border-border-subtle space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10" rounded="full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-28 mb-1" rounded="sm" />
            <Skeleton className="h-3 w-20" rounded="sm" />
          </div>
        </div>

        {/* Participant grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3">
              <SkeletonAvatar size="lg" className="w-14 h-14" />
              <Skeleton className="h-3 w-16" rounded="sm" />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Skeleton className="w-12 h-12" rounded="full" />
          <Skeleton className="w-12 h-12" rounded="full" />
          <Skeleton className="w-12 h-12" rounded="full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Call history page skeleton
 */
export function SkeletonCallHistory() {
  return (
    <div className="space-y-4 p-4" aria-hidden="true">
      {/* Header + filter */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" rounded="md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" rounded="lg" />
          <Skeleton className="h-9 w-20" rounded="lg" />
        </div>
      </div>

      {/* Call entries */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-bg-elevated border border-border-subtle">
          <SkeletonAvatar size="md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-28 mb-1" rounded="sm" />
            <Skeleton className="h-3 w-36" rounded="sm" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-12 mb-1" rounded="sm" />
            <Skeleton className="h-3 w-16" rounded="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Discover page skeleton
 */
export function SkeletonDiscoverPage() {
  return (
    <div className="space-y-6 p-4" aria-hidden="true">
      {/* Search bar */}
      <Skeleton className="h-11 w-full" rounded="xl" />

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" rounded="full" />
        <Skeleton className="h-9 w-24" rounded="full" />
        <Skeleton className="h-9 w-24" rounded="full" />
      </div>

      {/* Leaderboard podium */}
      <div className="flex items-end justify-center gap-4 py-6">
        <div className="flex flex-col items-center gap-2">
          <SkeletonAvatar size="lg" className="w-14 h-14" />
          <Skeleton className="h-3 w-16" rounded="sm" />
          <Skeleton className="h-16 w-20" rounded="lg" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <SkeletonAvatar size="lg" className="w-16 h-16" />
          <Skeleton className="h-3 w-16" rounded="sm" />
          <Skeleton className="h-24 w-20" rounded="lg" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <SkeletonAvatar size="lg" className="w-14 h-14" />
          <Skeleton className="h-3 w-16" rounded="sm" />
          <Skeleton className="h-12 w-20" rounded="lg" />
        </div>
      </div>

      {/* List items */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated">
          <Skeleton className="w-8 h-8 flex-shrink-0" rounded="md" />
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" rounded="sm" />
            <Skeleton className="h-3 w-16" rounded="sm" />
          </div>
          <Skeleton className="h-5 w-12" rounded="sm" />
        </div>
      ))}
    </div>
  )
}
