import { Suspense } from 'react'
import { redirect, data, Await } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import { DeferredSeed } from '../components/DeferredSeed'
import Home from '../pages/Home'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, Session, SessionRsvp, RsvpResponse } from '../types/database'

interface SquadSummary {
  id: string
  name: string
  game: string
  invite_code: string
  owner_id: string
  total_members: number
  created_at: string
}

interface SquadWithCount extends SquadSummary {
  member_count: number
}

interface SessionWithRsvp extends Session {
  my_rsvp: RsvpResponse | null
  rsvp_counts: { present: number; absent: number; maybe: number }
}

interface HomeLoaderData {
  profile: Profile | null
  squads: SquadWithCount[]
  upcomingSessions: SessionWithRsvp[] | Promise<SessionWithRsvp[]>
}

export function meta() {
  return [
    { title: "Accueil - Squad Planner" },
    { name: "description", content: "Tableau de bord Squad Planner : tes squads, sessions à venir et activité récente en un coup d'oeil." },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/home" },
    { property: "og:url", content: "https://squadplanner.fr/home" },
  ]
}

// Non-critical data fetcher — runs in parallel, streamed to client
async function fetchUpcomingSessions(supabase: SupabaseClient, squadIds: string[], userId: string): Promise<SessionWithRsvp[]> {
  if (squadIds.length === 0) return []

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .in('squad_id', squadIds)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(20)

  if (!sessions?.length) return []

  const sessionIds = sessions.map((s: Session) => s.id)
  const { data: allRsvps } = await supabase
    .from('session_rsvps')
    .select('*')
    .in('session_id', sessionIds)

  return sessions.map((session: Session) => {
    const sessionRsvps = (allRsvps as SessionRsvp[] | null)?.filter((r) => r.session_id === session.id) || []
    return {
      ...session,
      my_rsvp: sessionRsvps.find((r) => r.user_id === userId)?.response || null,
      rsvp_counts: {
        present: sessionRsvps.filter((r) => r.response === 'present').length,
        absent: sessionRsvps.filter((r) => r.response === 'absent').length,
        maybe: sessionRsvps.filter((r) => r.response === 'maybe').length,
      },
    }
  })
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createSupabaseServerClient(request)
  const { data: { user }, error } = await getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Single RPC: profile + squads (same as parent layout, but needed for SSR seed)
  const { data: rpcResult } = await supabase.rpc('get_layout_data', { p_user_id: user.id })

  const profile = (rpcResult?.profile as Profile | null) ?? null
  const squads: SquadWithCount[] = ((rpcResult?.squads as SquadWithCount[]) ?? [])
  const squadIds = squads.map((s) => s.id)

  // Non-critical — NOT awaited → streamed via HTTP streaming
  const upcomingSessions = fetchUpcomingSessions(supabase, squadIds, user.id)

  return data(
    { profile, squads, upcomingSessions },
    { headers }
  )
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

// Streams sessions via Suspense — page shell (profile + squads) renders immediately
export default function Component({ loaderData }: { loaderData: HomeLoaderData }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.squads.list(), data: loaderData?.squads },
    ]}>
      <Suspense fallback={
        <Home loaderData={{ ...loaderData, upcomingSessions: [] }} />
      }>
        <Await resolve={loaderData.upcomingSessions} errorElement={<Home loaderData={{ ...loaderData, upcomingSessions: [] }} />}>
          {(sessions: SessionWithRsvp[]) => (
            <DeferredSeed queryKey={queryKeys.sessions.upcoming()} data={sessions}>
              <Home loaderData={{ ...loaderData, upcomingSessions: sessions }} />
            </DeferredSeed>
          )}
        </Await>
      </Suspense>
    </ClientRouteWrapper>
  )
}
