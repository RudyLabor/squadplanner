'use client'

import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../hooks'
import { queryKeys } from '../lib/queryClient'

interface ProtectedLayoutData {
  user: { id: string; email: string | undefined }
  profile: any
  squads: any[]
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
    if (loaderData.squads) {
      queryClient.setQueryData(queryKeys.squads.list(), loaderData.squads)
    }
    if (loaderData.profile) {
      queryClient.setQueryData(queryKeys.profile.current(), loaderData.profile)
    }
    seeded.current = true
  }

  // Check localStorage for onboarding skip (client-only, runs after first render)
  useEffect(() => {
    setOnboardingSkipped(localStorage.getItem('sq-onboarding-skipped') === 'true')
  }, [])

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
    // Only redirect to onboarding if user explicitly hasn't skipped AND has no squads
    if (onboardingSkipped === false && loaderData.squads.length === 0) {
      return <Navigate to="/onboarding" replace />
    }
    return <Outlet />
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

  if (!clientUser) return <Navigate to="/" replace />

  return <Outlet />
}
