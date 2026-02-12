import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { ProtectedLayoutClient } from '../components/ProtectedLayoutClient'
import type { Profile } from '../types/database'

// NOTE: Edge Runtime removed — it caused the client-side route manifest to exclude
// all protected routes (home, squads, sessions…), resulting in 404 on every
// authenticated page after hydration. Vercel CDN + Cache-Control headers already
// provide excellent TTFB (~25-97ms) without edge runtime.

interface SquadWithCount {
  id: string
  name: string
  game: string
  invite_code: string
  owner_id: string
  created_at: string
  member_count: number
}

interface ProtectedLoaderData {
  user: { id: string; email: string | undefined }
  profile: Profile | null
  squads: SquadWithCount[]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createSupabaseServerClient(request)
  let { data: { user }, error } = await getUser()

  if (error || !user) {
    // Attempt session refresh before redirecting — handles expired-but-refreshable tokens
    const { data: { session } } = await supabase.auth.refreshSession()
    if (!session?.user) {
      throw redirect('/', { headers })
    }
    user = session.user
  }

  // Single RPC call: profile + squads with member counts in ONE database round-trip.
  // Falls back to parallel queries if RPC is not yet deployed.
  let profile: Profile | null = null
  let squads: SquadWithCount[] = []

  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_layout_data', {
    p_user_id: user.id,
  })

  if (!rpcError && rpcResult) {
    profile = rpcResult.profile as Profile | null
    squads = (rpcResult.squads as SquadWithCount[]) || []
  } else {
    // Fallback: parallel queries (used before RPC is deployed)
    const [profileResult, membershipsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('squad_members')
        .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, total_members, created_at)')
        .eq('user_id', user.id),
    ])

    profile = profileResult.data as Profile | null
    const rawSquads = (membershipsResult.data?.map((m: { squads: any }) => m.squads).filter(Boolean) || [])
    squads = rawSquads.map((squad: any) => ({
      ...squad,
      member_count: squad.total_members ?? 1,
    }))
  }

  return data(
    {
      user: { id: user.id, email: user.email },
      profile,
      squads,
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
