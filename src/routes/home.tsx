import { Suspense } from 'react'
import { redirect, data, Await } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryClient, queryKeys } from '../lib/queryClient'
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

interface RpcLayoutData {
  profile: Profile | null
  squads: SquadWithCount[]
}

interface HomeLoaderData {
  profile: Profile | null
  squads: SquadWithCount[]
  upcomingSessions: SessionWithRsvp[] | Promise<SessionWithRsvp[]>
}

export function meta() {
  return [
    { title: 'Accueil — Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        "Tableau de bord Squad Planner : tes squads, sessions à venir et activité récente en un coup d'oeil.",
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/home' },
    { property: 'og:url', content: 'https://squadplanner.fr/home' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Accueil' },
    {
      property: 'og:description',
      content:
        "Tableau de bord Squad Planner : tes squads, sessions à venir et activité récente en un coup d'oeil.",
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Accueil' },
    {
      name: 'twitter:description',
      content:
        "Tableau de bord Squad Planner : tes squads, sessions à venir et activité récente en un coup d'oeil.",
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

// Non-critical data fetcher — runs in parallel, streamed to client
async function fetchUpcomingSessions(
  supabase: SupabaseClient,
  squadIds: string[],
  userId: string
): Promise<SessionWithRsvp[]> {
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
    const sessionRsvps =
      (allRsvps as SessionRsvp[] | null)?.filter((r) => r.session_id === session.id) || []
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
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    // Don't redirect — parent _protected clientLoader handles auth on client
    return data({ profile: null, squads: [], upcomingSessions: [] }, { headers })
  }

  // Single RPC: profile + squads (same as parent layout, but needed for SSR seed)
  const { data: rpcResult } = await supabase.rpc('get_layout_data', { p_user_id: user.id })

  const rpcTyped = rpcResult as RpcLayoutData | null
  const profile = rpcTyped?.profile ?? null
  const squads: SquadWithCount[] = rpcTyped?.squads ?? []
  const squadIds = squads.map((s) => s.id)

  // Non-critical — NOT awaited → streamed via HTTP streaming
  const upcomingSessions = fetchUpcomingSessions(supabase, squadIds, user.id)

  return data({ profile, squads, upcomingSessions }, { headers })
}

// CLIENT LOADER — handles client-side navigations using localStorage auth
// Falls back to SSR data when client auth isn't ready yet (prevents empty dashboard)
export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  // Fast auth — getSession reads local cache, no network call.
  // Parent _protected loader already validated with getUser().
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If client auth isn't ready, fall back to SSR loader data (which uses cookie auth)
  if (!session?.user) {
    const serverData = await serverLoader<HomeLoaderData>()
    return serverData
  }

  const userId = session.user.id

  // Reuse profile + squads from React Query cache (seeded by _protected layout)
  const cachedProfile = queryClient.getQueryData(queryKeys.profile.current()) as Profile | undefined
  const cachedSquads = queryClient.getQueryData(queryKeys.squads.list()) as
    | SquadWithCount[]
    | undefined

  let profile: Profile | null
  let squads: SquadWithCount[]

  if (cachedProfile !== undefined && cachedSquads !== undefined) {
    profile = cachedProfile
    squads = cachedSquads
  } else {
    // Fallback: fetch from Supabase (cold cache / first load)
    const { withTimeout } = await import('../lib/withTimeout')
    const { data: rpcResult } = (await withTimeout(
      supabase.rpc('get_layout_data', { p_user_id: userId }),
      5000
    )) as any
    const rpcTypedClient = rpcResult as RpcLayoutData | null
    profile = rpcTypedClient?.profile ?? null
    squads = rpcTypedClient?.squads ?? []
  }

  const squadIds = squads.map((s) => s.id)
  const upcomingSessions = await fetchUpcomingSessions(supabase, squadIds, userId)

  return { profile, squads, upcomingSessions }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

// Streams sessions via Suspense — page shell (profile + squads) renders immediately
export default function Component({ loaderData }: { loaderData: HomeLoaderData }) {
  return (
    <ClientRouteWrapper seeds={[{ key: [...queryKeys.squads.list()], data: loaderData?.squads }]}>
      <Suspense fallback={<Home loaderData={{ ...loaderData, upcomingSessions: [] } as any} />}>
        <Await
          resolve={loaderData.upcomingSessions}
          errorElement={<Home loaderData={{ ...loaderData, upcomingSessions: [] } as any} />}
        >
          {(sessions: SessionWithRsvp[]) => (
            <DeferredSeed queryKey={[...queryKeys.sessions.upcoming()]} data={sessions}>
              <Home loaderData={{ ...loaderData, upcomingSessions: sessions } as any} />
            </DeferredSeed>
          )}
        </Await>
      </Suspense>
    </ClientRouteWrapper>
  )
}
