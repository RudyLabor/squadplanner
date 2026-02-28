import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryClient, queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Party = lazy(() => import('../pages/Party').then((m) => ({ default: m.Party })))

interface PartySquad {
  id: string
  name: string
  game: string
  total_members: number
  member_count: number
}

/** Raw squad data from the squad_members join before transformation */
interface RawPartySquadData {
  id: string
  name: string
  game: string
  total_members: number
}

/** Row shape from the squad_members select with squads!inner join */
interface PartyMembershipRow {
  squad_id: string
  squads: RawPartySquadData
}

interface PartyLoaderData {
  squads: PartySquad[]
}

export function meta() {
  return [
    { title: 'Party - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Rejoins le chat vocal de ta squad. Lance une party pour jouer ensemble en temps réel.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/party' },
    { property: 'og:url', content: 'https://squadplanner.fr/party' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Party' },
    {
      property: 'og:description',
      content:
        'Rejoins le chat vocal de ta squad. Lance une party pour jouer ensemble en temps réel.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Party' },
    {
      name: 'twitter:description',
      content:
        'Rejoins le chat vocal de ta squad. Lance une party pour jouer ensemble en temps réel.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    return data({ squads: [] }, { headers })
  }

  // Fetch squads for party room selection
  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game, total_members)')
    .eq('user_id', user.id)

  const rawSquads = (
    (memberships as PartyMembershipRow[] | null)?.map((m) => m.squads) || []
  )

  // Count real members per squad (total_members column may be stale)
  const memberCounts = new Map<string, number>()
  if (rawSquads.length) {
    const squadIds = rawSquads.map((s) => s.id)
    const { data: allMembers } = await supabase
      .from('squad_members')
      .select('squad_id')
      .in('squad_id', squadIds)
    allMembers?.forEach((m: { squad_id: string }) => {
      memberCounts.set(m.squad_id, (memberCounts.get(m.squad_id) || 0) + 1)
    })
  }

  const squads: PartySquad[] = rawSquads.map((squad) => ({
    ...squad,
    member_count: memberCounts.get(squad.id) || squad.total_members || 1,
  }))

  return data({ squads }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  // Fast auth — getSession reads local cache, no network call.
  // Parent _protected loader already validated with getUser().
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return { squads: [] }

  // Don't reuse squads cache — it lacks accurate member_count.
  // Always fetch fresh member counts for the Party page.

  // Fallback: fetch from Supabase (cold cache / first load)
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: memberships } = (await withTimeout(
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game, total_members)')
      .eq('user_id', session.user.id),
    5000
  )) as any

  const rawSquads = (
    (memberships as PartyMembershipRow[] | null)?.map((m) => m.squads) || []
  )

  // Count real members per squad (total_members column may be stale)
  const memberCounts = new Map<string, number>()
  if (rawSquads.length) {
    const squadIds = rawSquads.map((s: RawPartySquadData) => s.id)
    const { data: allMembers } = (await withTimeout(
      supabase
        .from('squad_members')
        .select('squad_id')
        .in('squad_id', squadIds),
      5000
    )) as any
    ;(allMembers as { squad_id: string }[] | null)?.forEach((m) => {
      memberCounts.set(m.squad_id, (memberCounts.get(m.squad_id) || 0) + 1)
    })
  }

  const squads: PartySquad[] = rawSquads.map((squad: RawPartySquadData) => ({
    ...squad,
    member_count: memberCounts.get(squad.id) || squad.total_members || 1,
  }))

  return { squads }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: PartyLoaderData }) {
  return (
    <ClientRouteWrapper seeds={[{ key: [...queryKeys.squads.list()], data: loaderData?.squads }]}>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Party />
      </Suspense>
    </ClientRouteWrapper>
  )
}
