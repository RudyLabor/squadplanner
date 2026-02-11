import { Suspense } from 'react'
import { redirect, data, Await } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import { DeferredSeed } from '../components/DeferredSeed'
import Home from '../pages/Home'

export function meta() {
  return [
    { title: "Accueil - Squad Planner" },
  ]
}

// Non-critical data fetcher — runs in parallel, streamed to client
async function fetchUpcomingSessions(supabase: any, squadIds: string[], userId: string) {
  if (squadIds.length === 0) return []

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .in('squad_id', squadIds)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(20)

  if (!sessions?.length) return []

  const sessionIds = sessions.map((s: any) => s.id)
  const { data: allRsvps } = await supabase
    .from('session_rsvps')
    .select('*')
    .in('session_id', sessionIds)

  return sessions.map((session: any) => {
    const sessionRsvps = allRsvps?.filter((r: any) => r.session_id === session.id) || []
    return {
      ...session,
      my_rsvp: sessionRsvps.find((r: any) => r.user_id === userId)?.response || null,
      rsvp_counts: {
        present: sessionRsvps.filter((r: any) => r.response === 'present').length,
        absent: sessionRsvps.filter((r: any) => r.response === 'absent').length,
        maybe: sessionRsvps.filter((r: any) => r.response === 'maybe').length,
      },
    }
  })
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Critical data — awaited (page shell renders immediately)
  const [profileResult, membershipsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, total_members, created_at)')
      .eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const squads = membershipsResult.data?.map((m: any) => m.squads) || []
  const squadIds = squads.map((s: any) => s.id)

  // Use total_members from the squads table directly (maintained by DB trigger)
  const squadsWithCounts = squads.map((squad: any) => ({
    ...squad,
    member_count: squad.total_members ?? 1,
  }))

  // Non-critical — NOT awaited → streamed via HTTP streaming (Phase 3.5)
  const upcomingSessions = fetchUpcomingSessions(supabase, squadIds, user.id)

  return data(
    { profile, squads: squadsWithCounts, upcomingSessions },
    { headers }
  )
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

// Streams sessions via Suspense — page shell (profile + squads) renders immediately
export default function Component({ loaderData }: { loaderData: any }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.squads.list(), data: loaderData?.squads },
    ]}>
      <Suspense fallback={
        <Home loaderData={{ ...loaderData, upcomingSessions: [] }} />
      }>
        <Await resolve={loaderData.upcomingSessions}>
          {(sessions: any) => (
            <DeferredSeed queryKey={queryKeys.sessions.upcoming()} data={sessions}>
              <Home loaderData={{ ...loaderData, upcomingSessions: sessions }} />
            </DeferredSeed>
          )}
        </Await>
      </Suspense>
    </ClientRouteWrapper>
  )
}
