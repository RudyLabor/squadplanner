import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { ProtectedLayoutClient } from '../components/ProtectedLayoutClient'

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Fetch profile and squads in parallel
  const [profileResult, membershipsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
      .eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const squads = membershipsResult.data?.map((m: any) => m.squads) || []

  // Get member counts for all squads
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

  return data(
    {
      user: { id: user.id, email: user.email },
      profile,
      squads: squadsWithCounts,
    },
    { headers }
  )
}

// Prevent layout loader from re-running on every client-side navigation.
// Auth state is managed client-side after initial SSR hydration.
export function shouldRevalidate() {
  return false
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: any }) {
  return <ProtectedLayoutClient loaderData={loaderData} />
}
