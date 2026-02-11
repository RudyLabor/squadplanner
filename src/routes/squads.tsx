import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
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
    { title: "Mes Squads - Squad Planner" },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/squads" },
    { property: "og:url", content: "https://squadplanner.fr/squads" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
    .eq('user_id', user.id)

  const squads = (memberships?.map((m: { squads: SquadSummary }) => m.squads) || []) as SquadSummary[]

  let squadsWithCounts: SquadWithCount[] = squads.map((s) => ({ ...s, member_count: 0 }))
  if (squads.length > 0) {
    const squadIds = squads.map((s) => s.id)
    const { data: memberCounts } = await supabase
      .from('squad_members')
      .select('squad_id')
      .in('squad_id', squadIds)

    const countBySquad: Record<string, number> = {}
    memberCounts?.forEach((m: { squad_id: string }) => {
      countBySquad[m.squad_id] = (countBySquad[m.squad_id] || 0) + 1
    })

    squadsWithCounts = squads.map((squad) => ({
      ...squad,
      member_count: countBySquad[squad.id] || 0,
    }))
  }

  return data({ squads: squadsWithCounts }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: SquadsLoaderData }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.squads.list(), data: loaderData?.squads },
    ]}>
      <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Squads loaderData={loaderData} />
      </Suspense>
    </ClientRouteWrapper>
  )
}
