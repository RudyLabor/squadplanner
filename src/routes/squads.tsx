import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import Squads from '../pages/Squads'

export function meta() {
  return [
    { title: "Mes Squads - Squad Planner" },
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

  const squads = memberships?.map((m: any) => m.squads) || []

  let squadsWithCounts = squads
  if (squads.length > 0) {
    const squadIds = squads.map((s: any) => s.id)
    const { data: memberCounts } = await supabase
      .from('squad_members')
      .select('squad_id')
      .in('squad_id', squadIds)

    const countBySquad: Record<string, number> = {}
    memberCounts?.forEach((m: any) => {
      countBySquad[m.squad_id] = (countBySquad[m.squad_id] || 0) + 1
    })

    squadsWithCounts = squads.map((squad: any) => ({
      ...squad,
      member_count: countBySquad[squad.id] || 0,
    }))
  }

  return data({ squads: squadsWithCounts }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

// Server Component — data loaded on server, React Query seeded via ClientRouteWrapper
export function ServerComponent({ loaderData }: { loaderData: any }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.squads.list(), data: loaderData?.squads },
    ]}>
      <Squads loaderData={loaderData} />
    </ClientRouteWrapper>
  )
}
