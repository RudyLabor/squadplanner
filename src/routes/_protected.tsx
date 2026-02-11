import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { ProtectedLayoutClient } from '../components/ProtectedLayoutClient'
import type { Profile } from '../types/database'

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

interface ProtectedLoaderData {
  user: { id: string; email: string | undefined }
  profile: Profile | null
  squads: SquadWithCount[]
}

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

  const profile = profileResult.data as Profile | null
  const squads = (membershipsResult.data?.map((m: { squads: SquadSummary }) => m.squads) || []) as SquadSummary[]

  // Get member counts for all squads
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
  // Private cache for authenticated pages — short TTL for browser, no CDN caching
  const h = new Headers(loaderHeaders)
  if (!h.has('Cache-Control')) {
    h.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
  }
  return h
}

export default function Component({ loaderData }: { loaderData: ProtectedLoaderData }) {
  return <ProtectedLayoutClient loaderData={loaderData} />
}
