import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import type { Session, SessionRsvp, SessionCheckin, RsvpResponse } from '../types/database'

const SessionDetail = lazy(() => import('../pages/SessionDetail'))

interface RsvpWithProfile extends SessionRsvp {
  profiles?: { id: string; username: string }
}

interface SessionDetailData extends Session {
  rsvps: RsvpWithProfile[]
  checkins: SessionCheckin[]
  my_rsvp: RsvpResponse | null
  rsvp_counts: { present: number; absent: number; maybe: number }
}

interface SessionDetailLoaderData {
  session: SessionDetailData | null
}

export function meta() {
  return [
    { title: 'Détail Session - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Consulte les détails de ta session de jeu : date, heure, participants et statut RSVP.',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Détail Session - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Consulte les détails de ta session de jeu : date, heure, participants et statut RSVP.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Détail Session - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Consulte les détails de ta session de jeu : date, heure, participants et statut RSVP.',
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
    return data({ session: null, rsvps: [], checkins: [] }, { headers })
  }

  const sessionId = params.id!

  // Fetch session + RSVPs + checkins in parallel
  const [sessionResult, rsvpsResult, checkinsResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId as string)
      .single(),
    supabase
      .from('session_rsvps')
      .select('*')
      .eq('session_id', sessionId as string),
    supabase
      .from('session_checkins')
      .select('*')
      .eq('session_id', sessionId as string),
  ])

  const rsvps = (rsvpsResult.data || []) as unknown as RsvpWithProfile[]

  // Fetch usernames separately to avoid PostgREST join errors
  if (rsvps.length) {
    const userIds = [...new Set(rsvps.map((r) => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)
    const profileMap = new Map<string, { id: string; username: string }>(
      (profiles || []).map((p: { id: string; username: string }) => [p.id, p])
    )
    rsvps.forEach((r) => {
      r.profiles = profileMap.get(r.user_id) || { id: r.user_id, username: 'Joueur' }
    })
  }

  const myRsvp = rsvps.find((r) => r.user_id === user.id)?.response || null

  const session: SessionDetailData | null = sessionResult.data
    ? {
        ...(sessionResult.data as unknown as Session),
        rsvps,
        checkins: (checkinsResult.data || []) as unknown as SessionCheckin[],
        my_rsvp: myRsvp,
        rsvp_counts: {
          present: rsvps.filter((r) => r.response === 'present').length,
          absent: rsvps.filter((r) => r.response === 'absent').length,
          maybe: rsvps.filter((r) => r.response === 'maybe').length,
        },
      }
    : null

  return data({ session }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: SessionDetailLoaderData }) {
  return (
    <ClientRouteWrapper
      seeds={[
        {
          key: [...queryKeys.sessions.detail(loaderData?.session?.id ?? '')],
          data: loaderData?.session,
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
        <SessionDetail />
      </Suspense>
    </ClientRouteWrapper>
  )
}
