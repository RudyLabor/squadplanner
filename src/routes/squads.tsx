import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
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
    throw redirect('/', { headers })
  }

  // Single query: use total_members (DB trigger-maintained) instead of separate count query
  const { data: memberships } = await supabase
    .from('squad_members')
    .select(
      'squad_id, squads!inner(id, name, game, invite_code, owner_id, total_members, created_at)'
    )
    .eq('user_id', user.id)

  const squadsWithCounts: SquadWithCount[] =
    (memberships as any[])?.map((m: { squads: SquadSummary & { total_members?: number } }) => ({
      ...m.squads,
      member_count: m.squads.total_members ?? 1,
    })) || []

  return data({ squads: squadsWithCounts }, { headers })
}

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
