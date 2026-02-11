import { Skeleton, SkeletonAvatar } from './SkeletonBase'

// =============================================================================
// CLS-PREVENTION SKELETONS (Fixed dimensions to prevent layout shift)
// =============================================================================

/**
 * AI Coach section skeleton - Fixed height 72px
 */
export function SkeletonAICoach() {
  return (
    <div
      className="p-3 rounded-xl bg-bg-hover border border-border-subtle min-h-[72px] flex items-center gap-3"
      aria-hidden="true"
    >
      <Skeleton className="w-8 h-8 flex-shrink-0" rounded="lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" rounded="sm" />
        <Skeleton className="h-3 w-1/2" rounded="sm" />
      </div>
    </div>
  )
}

/**
 * Reliability badge skeleton - Fixed height 40px
 */
export function SkeletonReliabilityBadge() {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-overlay-faint min-h-[40px]"
      aria-hidden="true"
    >
      <Skeleton className="w-4 h-4" rounded="full" />
      <Skeleton className="h-4 w-16" rounded="sm" />
    </div>
  )
}

/**
 * Friends playing section skeleton - Fixed min-height 180px
 */
export function SkeletonFriendsPlaying() {
  return (
    <div className="min-h-[180px]" aria-hidden="true">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-4 h-4" rounded="md" />
        <Skeleton className="h-5 w-48" rounded="sm" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[200px] p-4 rounded-xl bg-bg-hover border border-border-subtle">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-12 h-12" rounded="full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-1" rounded="sm" />
                <Skeleton className="h-3 w-16" rounded="sm" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Stats row skeleton - Fixed height 68px
 */
export function SkeletonStatsRow() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 min-h-[68px]" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[60px] sm:h-[68px] px-2 sm:px-4 flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-border-subtle bg-overlay-faint"
        >
          <Skeleton className="w-8 h-8" rounded="lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-8 mb-1" rounded="sm" />
            <Skeleton className="h-3 w-12" rounded="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Streak counter skeleton - Fixed min-height 200px
 */
export function SkeletonStreakCounter() {
  return (
    <div className="min-h-[200px] p-4 rounded-xl bg-bg-hover border border-border-subtle" aria-hidden="true">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5" rounded="md" />
          <Skeleton className="h-5 w-24" rounded="sm" />
        </div>
        <Skeleton className="h-6 w-16" rounded="full" />
      </div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="w-8 h-8" rounded="lg" />
        ))}
      </div>
      <Skeleton className="h-2 w-full mb-2" rounded="full" />
      <Skeleton className="h-4 w-32" rounded="sm" />
    </div>
  )
}
