import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
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
  const { supabase, headers, getUser } = createSupabaseServerClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
    .eq('user_id', user.id)

  const squads = ((memberships as any[])?.map((m: { squads: SquadSummary }) => m.squads) ||
    []) as SquadSummary[]
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
