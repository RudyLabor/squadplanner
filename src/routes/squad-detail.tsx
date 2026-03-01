import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import type { Squad, SquadMember, Session, SessionRsvp, RsvpResponse } from '../types/database'

const SquadDetail = lazy(() => import('../pages/SquadDetail'))

interface MemberWithProfile extends SquadMember {
  profiles: { username: string; avatar_url: string | null; reliability_score: number } | null
}

interface SquadWithMembers extends Squad {
  members: MemberWithProfile[]
  member_count: number
}

interface SessionWithRsvp extends Session {
  my_rsvp: RsvpResponse | null
  rsvp_counts: { present: number; absent: number; maybe: number }
}

interface SquadDetailLoaderData {
  squad: SquadWithMembers | null
  sessions: SessionWithRsvp[]
}

export function meta() {
  return [
    { title: 'Détail Squad — Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Consulte les détails de ta squad : membres, sessions planifiées, classement et code d\'invitation.',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Détail Squad — Squad Planner' },
    {
      property: 'og:description',
      content:
        'Consulte les détails de ta squad : membres, sessions planifiées, classement et code d\'invitation.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Détail Squad — Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Consulte les détails de ta squad : membres, sessions planifiées, classement et code d\'invitation.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    return data({ squad: null, members: [], sessions: [] }, { headers })
  }

  const squadId = params.id!

  // Fetch squad + members + sessions in parallel
  const [squadResult, membersResult, sessionsResult] = await Promise.all([
    supabase
      .from('squads')
      .select('*')
      .eq('id', squadId as string)
      .single(),
    supabase
      .from('squad_members')
      .select('*, profiles(username, avatar_url, reliability_score)')
      .eq('squad_id', squadId as string),
    supabase
      .from('sessions')
      .select('*')
      .eq('squad_id', squadId as string)
      .order('scheduled_at', { ascending: true }),
  ])

  const squad: SquadWithMembers | null = squadResult.data
    ? {
        ...(squadResult.data as unknown as Squad),
        members: (membersResult.data || []) as unknown as MemberWithProfile[],
        member_count: membersResult.data?.length || 0,
      }
    : null

  // Get RSVPs for sessions
  let sessions: SessionWithRsvp[] = []
  if (sessionsResult.data?.length) {
    const sessionIds = (sessionsResult.data as unknown as Session[]).map((s: Session) => s.id)
    const { data: allRsvps } = await supabase
      .from('session_rsvps')
      .select('*')
      .in('session_id', sessionIds)

    sessions = (sessionsResult.data as unknown as Session[]).map((session: Session) => {
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

  return data({ squad, sessions }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: SquadDetailLoaderData }) {
  return (
    <ClientRouteWrapper
      seeds={[
        { key: [...queryKeys.squads.detail(loaderData?.squad?.id ?? '')], data: loaderData?.squad },
        {
          key: [...queryKeys.sessions.list(loaderData?.squad?.id ?? '')],
          data: loaderData?.sessions,
        },
      ]}
    >
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SquadDetail />
      </Suspense>
    </ClientRouteWrapper>
  )
}
