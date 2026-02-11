import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { useAuthStore } from '../hooks'

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Fetch profile and squads in parallel
  const [profileResult, membershipsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
      .eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const squads = membershipsResult.data?.map((m: any) => m.squads) || []

  // Get member counts for all squads
  let squadsWithCounts = squads
  if (squads.length > 0) {
    const squadIds = squads.map((s: any) => s.id)
    const { data: memberCounts } = await supabase
      .from('squad_members')
      .select('squad_id')
      .in('squad_id', squadIds)

    const countBySquad: Record<string, number> = {}
    memberCounts?.forEach((m: any) => {
      countBySquad[m.squad_id] = (countBySquad[m.squad_id] || 0) + 1
    })

    squadsWithCounts = squads.map((squad: any) => ({
      ...squad,
      member_count: countBySquad[squad.id] || 0,
    }))
  }

  return data(
    {
      user: { id: user.id, email: user.email },
      profile,
      squads: squadsWithCounts,
    },
    { headers }
  )
}

// Prevent layout loader from re-running on every client-side navigation.
// Auth state is managed client-side after initial SSR hydration.
export function shouldRevalidate() {
  return false
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function ProtectedLayout() {
  const loaderData = useLoaderData<typeof loader>()
  const { user: clientUser, isInitialized } = useAuthStore()
  const queryClient = useQueryClient()
  const [onboardingSkipped, setOnboardingSkipped] = useState(false)

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

  // Check localStorage for onboarding skip (client-only)
  useEffect(() => {
    setOnboardingSkipped(localStorage.getItem('sq-onboarding-skipped') === 'true')
  }, [])

  // If we have loader data, the server already authenticated the user.
  // Show content immediately without waiting for client-side auth.
  if (loaderData?.user) {
    // Still check onboarding redirect (requires client-side localStorage)
    if (typeof window !== 'undefined' && loaderData.squads.length === 0 && !onboardingSkipped) {
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
