import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../hooks'
import { queryKeys } from '../lib/queryClient'
import type { Profile, Squad } from '../types/database'

const AnnualPushBanner = lazy(() =>
  import('./AnnualPushBanner').then((m) => ({ default: m.AnnualPushBanner }))
)

interface ProtectedLayoutData {
  user: { id: string; email: string | undefined }
  profile: Profile | null
  squads: Squad[]
}

/**
 * Client-side wrapper for the protected layout.
 * Handles: auth state, localStorage onboarding check, React Query seeding.
 * The server already verified authentication via the loader.
 */
export function ProtectedLayoutClient({ loaderData }: { loaderData: ProtectedLayoutData }) {
  const { user: clientUser, isInitialized } = useAuthStore()
  const queryClient = useQueryClient()
  // null = not yet checked, false = not skipped, true = skipped
  const [onboardingSkipped, setOnboardingSkipped] = useState<boolean | null>(null)

  const seeded = useRef(false)
  if (!seeded.current && loaderData) {
    // Only seed squads if the loader returned actual data.
    // Seeding with [] from a failed RPC would poison the cache and prevent
    // child routes (home, squads) from fetching fresh data.
    if (loaderData.squads?.length) {
      queryClient.setQueryData(queryKeys.squads.list(), loaderData.squads)
    }
    if (loaderData.profile) {
      queryClient.setQueryData(queryKeys.profile.current(), loaderData.profile)
    }
    seeded.current = true
  }

  // Check localStorage for onboarding skip (client-only, runs after first render)
  useEffect(() => {
    const skipped = localStorage.getItem('sq-onboarding-skipped') === 'true'
    setOnboardingSkipped(skipped)
    // If user has squads, persist the flag so future loads (even from a new
    // browser or after cache clear) won't redirect to onboarding.
    if (!skipped && loaderData?.squads?.length > 0) {
      localStorage.setItem('sq-onboarding-skipped', 'true')
      setOnboardingSkipped(true)
    }
  }, [loaderData?.squads?.length])

  // If we have loader data, the server already authenticated the user.
  // Show content immediately without waiting for client-side auth.
  if (loaderData?.user) {
    // Wait for localStorage check before deciding (null = not yet checked)
    if (onboardingSkipped === null) {
      return (
        <div className="min-h-screen bg-bg-base flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    // Only redirect to onboarding if user explicitly hasn't skipped AND has no squads.
    // Safety: if the profile has a username, the user already completed onboarding
    // previously — don't redirect even if squads fetch failed (returned []).
    const hasProfile = loaderData.profile?.username && loaderData.profile.username.length > 0
    if (onboardingSkipped === false && loaderData.squads.length === 0 && !hasProfile) {
      return <Navigate to="/onboarding" replace />
    }
    return <ProtectedContent />
  }

  // Fallback for client-side navigation without loader data
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!clientUser) return <Navigate to="/auth" replace />

  return <ProtectedContent />
}

/** Wraps Outlet with promotional banners (lazy-loaded, date-gated) */
function ProtectedContent() {
  return (
    <>
      <Suspense fallback={null}>
        <AnnualPushBanner />
      </Suspense>
      <Outlet />
    </>
  )
}
