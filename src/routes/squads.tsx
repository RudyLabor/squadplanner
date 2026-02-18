import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Squads = lazy(() => import('../pages/Squads'))

interface SquadSummary {
  id: string
  name: string
  game: string
  invite_code: string
  owner_id: string
  created_at: string
}

interface SquadWithCount extends SquadSummary {
  member_count: number
}

/** Row shape from the squad_members select with squads!inner join */
interface SquadMembershipRow {
  squad_id: string
  squads: SquadSummary & { total_members?: number }
}

interface SquadsLoaderData {
  squads: SquadWithCount[]
}

export function meta() {
  return [
    { title: 'Mes Squads - Squad Planner' },
    {
      name: 'description',
      content:
        'Gère tes squads gaming : crée, rejoins et organise tes équipes pour planifier des sessions ensemble.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/squads' },
    { property: 'og:url', content: 'https://squadplanner.fr/squads' },
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

  // Single query: use total_members (DB trigger-maintained) instead of separate count query
  const { data: memberships } = await supabase
    .from('squad_members')
    .select(
      'squad_id, squads!inner(id, name, game, invite_code, owner_id, total_members, created_at)'
    )
    .eq('user_id', user.id)

  const squadsWithCounts: SquadWithCount[] =
    (memberships as SquadMembershipRow[] | null)?.map((m) => ({
      ...m.squads,
      member_count: m.squads.total_members ?? 1,
    })) || []

  return data({ squads: squadsWithCounts }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: { user } } = await withTimeout(supabase.auth.getUser(), 5000)
  if (!user) return { squads: [] }

  const { data: memberships } = await withTimeout(
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, total_members, created_at)')
      .eq('user_id', user.id),
    5000
  )

  const squads: SquadWithCount[] =
    (memberships as SquadMembershipRow[] | null)?.map((m) => ({
      ...m.squads,
      member_count: m.squads.total_members ?? 1,
    })) || []

  return { squads }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: SquadsLoaderData }) {
  return (
    <ClientRouteWrapper seeds={[{ key: [...queryKeys.squads.list()], data: loaderData?.squads }]}>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Squads loaderData={loaderData} />
      </Suspense>
    </ClientRouteWrapper>
  )
}
