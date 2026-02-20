import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
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

/** Shape returned by the get_layout_data RPC function */
interface LayoutRpcResult {
  profile: Profile | null
  squads: SquadWithCount[]
}

/** Raw squad data from the squad_members join query (before transforming total_members -> member_count) */
interface RawSquadFromMembership {
  id: string
  name: string
  game: string
  invite_code: string
  owner_id: string
  total_members: number
  created_at: string
}

/** Row shape from the squad_members select with squads!inner join */
interface MembershipWithSquad {
  squad_id: string
  squads: RawSquadFromMembership
}

interface ProtectedLoaderData {
  user: { id: string; email: string | undefined }
  profile: Profile | null
  squads: SquadWithCount[]
}

// CLIENT LOADER — handles client-side navigations using localStorage auth.
// The minimal SSR client doesn't use @supabase/ssr cookies, so the server
// loader can't authenticate. This clientLoader uses the browser Supabase
// client (which reads from localStorage) for all client-side route transitions.
export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const { withTimeout } = await import('../lib/withTimeout')

  // Safety: clear stuck lockAcquired flag before auth calls.
  // If the custom lock's Promise.race timed out while backgrounded, lockAcquired
  // stays true and all subsequent _acquireLock calls bypass the real lock.
  const auth = (supabase as any).auth
  if (auth && auth.lockAcquired) {
    auth.lockAcquired = false
  }

  // Try getUser with retry — on tab resume the first attempt may fail while
  // the auth token is still refreshing. A single retry after a short delay
  // is enough to let the refresh complete.
  let user: { id: string; email?: string } | null = null
  let error: Error | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await withTimeout(supabase.auth.getUser(), 8000) as any
      user = result.data?.user ?? null
      error = result.error ?? null
      if (user) break
    } catch (e: unknown) {
      error = e as Error
      user = null
    }
    // Wait before retry to let token refresh settle
    if (attempt === 0 && !user) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  if (error || !user) {
    throw redirect('/auth')
  }

  let profile: Profile | null = null
  let squads: SquadWithCount[] = []

  const { data: rpcResult, error: rpcError } = await withTimeout(
    supabase.rpc('get_layout_data', { p_user_id: user.id }),
    5000
  ) as any

  if (!rpcError && rpcResult) {
    const rpc = rpcResult as LayoutRpcResult
    profile = rpc.profile
    squads = rpc.squads || []
  } else {
    const [profileResult, membershipsResult] = await Promise.all([
      withTimeout(supabase.from('profiles').select('*').eq('id', authedUser.id).single(), 5000),
      withTimeout(
        supabase
          .from('squad_members')
          .select(
            'squad_id, squads!inner(id, name, game, invite_code, owner_id, total_members, created_at)'
          )
          .eq('user_id', authedUser.id),
        5000
      ),
    ]) as any[]

    profile = profileResult.data as Profile | null
    const rawSquads =
      (membershipsResult.data as MembershipWithSquad[] | null)?.map((m) => m.squads).filter(Boolean) || []
    squads = rawSquads.map((squad) => ({
      ...squad,
      member_count: squad.total_members ?? 1,
    }))
  }

  return {
    user: { id: user.id, email: user.email },
    profile,
    squads,
  }
}

// Tell React Router to always use clientLoader on the client (don't call server loader)
clientLoader.hydrate = true as const

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  let {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    // Attempt session refresh before redirecting — handles expired-but-refreshable tokens
    const {
      data: { session },
    } = await supabase.auth.refreshSession()
    if (!session?.user) {
      // Don't redirect — clientLoader.hydrate=true ensures the client handles auth.
      // SSR without cookies (localStorage-based auth) must return empty data,
      // otherwise a redirect loop occurs: /home→/auth→/home→...
      return data({ user: null, profile: null, squads: [] }, { headers })
    }
    user = session.user
  }

  // TypeScript can't narrow `let` through reassignment — user is guaranteed non-null here
  const authedUser = user!

  // Single RPC call: profile + squads with member counts in ONE database round-trip.
  // Falls back to parallel queries if RPC is not yet deployed.
  let profile: Profile | null = null
  let squads: SquadWithCount[] = []

  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_layout_data', {
    p_user_id: authedUser.id,
  })

  if (!rpcError && rpcResult) {
    const rpc = rpcResult as LayoutRpcResult
    profile = rpc.profile
    squads = rpc.squads || []
  } else {
    // Fallback: parallel queries (used before RPC is deployed)
    const [profileResult, membershipsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authedUser.id).single(),
      supabase
        .from('squad_members')
        .select(
          'squad_id, squads!inner(id, name, game, invite_code, owner_id, total_members, created_at)'
        )
        .eq('user_id', authedUser.id),
    ])

    profile = profileResult.data as Profile | null
    const rawSquads =
      (membershipsResult.data as MembershipWithSquad[] | null)?.map((m) => m.squads).filter(Boolean) || []
    squads = rawSquads.map((squad) => ({
      ...squad,
      member_count: squad.total_members ?? 1,
    }))
  }

  return data(
    {
      user: { id: authedUser.id, email: authedUser.email },
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
  return <ProtectedLayoutClient loaderData={loaderData as any} />
}
