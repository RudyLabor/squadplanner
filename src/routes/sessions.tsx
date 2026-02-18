import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import type { Session, SessionRsvp, RsvpResponse } from '../types/database'

const Sessions = lazy(() => import('../pages/Sessions').then((m) => ({ default: m.Sessions })))

interface SquadSummary {
  id: string
  name: string
  game: string
  invite_code: string
  owner_id: string
  created_at: string
}

/** Row shape from the squad_members select with squads!inner join */
interface SessionMembershipRow {
  squad_id: string
  squads: SquadSummary
}

interface SessionWithRsvp extends Session {
  my_rsvp: RsvpResponse | null
  rsvp_counts: { present: number; absent: number; maybe: number }
}

interface SessionsLoaderData {
  squads: SquadSummary[]
  sessions: SessionWithRsvp[]
}

export function meta() {
  return [
    { title: 'Sessions - Squad Planner' },
    {
      name: 'description',
      content:
        'Consulte et gère tes sessions de jeu planifiées. Confirme ta présence avec le système RSVP.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/sessions' },
    { property: 'og:url', content: 'https://squadplanner.fr/sessions' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    return data({ squads: [], sessions: [] }, { headers })
  }

  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
    .eq('user_id', user.id)

  const squads: SquadSummary[] =
    (memberships as SessionMembershipRow[] | null)?.map((m) => m.squads) || []
  const squadIds = squads.map((s) => s.id)

  let sessions: SessionWithRsvp[] = []
  if (squadIds.length > 0) {
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .in('squad_id', squadIds)
      .order('scheduled_at', { ascending: true })

    if (sessionsData?.length) {
      const sessionIds = (sessionsData as unknown as Session[]).map((s: Session) => s.id)
      const { data: allRsvps } = await supabase
        .from('session_rsvps')
        .select('*')
        .in('session_id', sessionIds)

      sessions = (sessionsData as unknown as Session[]).map((session: Session) => {
        const sessionRsvps =
          (allRsvps as SessionRsvp[] | null)?.filter((r) => r.session_id === session.id) || []
        return {
          ...session,
          my_rsvp: sessionRsvps.find((r) => r.user_id === user.id)?.response || null,
          rsvp_counts: {
            present: sessionRsvps.filter((r) => r.response === 'present').length,
            absent: sessionRsvps.filter((r) => r.response === 'absent').length,
            maybe: sessionRsvps.filter((r) => r.response === 'maybe').length,
          },
        }
      })
    }
  }

  return data({ squads, sessions }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: { user } } = await withTimeout(supabase.auth.getUser(), 5000)
    .catch(() => ({ data: { user: null as null } }))
  if (!user) return { squads: [], sessions: [] }

  const { data: memberships } = await withTimeout(
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
      .eq('user_id', user.id),
    5000
  )

  const squads: SquadSummary[] =
    (memberships as SessionMembershipRow[] | null)?.map((m) => m.squads) || []
  const squadIds = squads.map((s) => s.id)

  let sessions: SessionWithRsvp[] = []
  if (squadIds.length > 0) {
    const { data: sessionsData } = await withTimeout(
      supabase
        .from('sessions').select('*').in('squad_id', squadIds)
        .order('scheduled_at', { ascending: true }),
      5000
    )

    if (sessionsData?.length) {
      const sessionIds = (sessionsData as unknown as Session[]).map((s: Session) => s.id)
      const { data: allRsvps } = await withTimeout(
        supabase.from('session_rsvps').select('*').in('session_id', sessionIds),
        5000
      )

      sessions = (sessionsData as unknown as Session[]).map((session: Session) => {
        const sessionRsvps = (allRsvps as SessionRsvp[] | null)?.filter((r) => r.session_id === session.id) || []
        return {
          ...session,
          my_rsvp: sessionRsvps.find((r) => r.user_id === user.id)?.response || null,
          rsvp_counts: {
            present: sessionRsvps.filter((r) => r.response === 'present').length,
            absent: sessionRsvps.filter((r) => r.response === 'absent').length,
            maybe: sessionRsvps.filter((r) => r.response === 'maybe').length,
          },
        }
      })
    }
  }

  return { squads, sessions }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: SessionsLoaderData }) {
  return (
    <ClientRouteWrapper
      seeds={[
        { key: [...queryKeys.squads.list()], data: loaderData?.squads },
        { key: [...queryKeys.sessions.upcoming()], data: loaderData?.sessions },
      ]}
    >
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Sessions loaderData={loaderData} />
      </Suspense>
    </ClientRouteWrapper>
  )
}
