import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
// TODO: Re-enable strict Database typing after running `npx supabase gen types typescript`
// import type { Database } from '../types/database'
type Database = any

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ---------------------------------------------------------------------------
// Request-scoped auth cache: deduplicates supabase.auth.getUser() across
// parallel loaders (parent layout + child route run simultaneously).
// Saves ~100ms per child route by avoiding redundant Auth API round-trips.
// ---------------------------------------------------------------------------
type UserResult = Awaited<ReturnType<ReturnType<typeof createServerClient>['auth']['getUser']>>
const userPromiseCache = new WeakMap<Request, Promise<UserResult>>()

/**
 * Create an authenticated Supabase client for server-side use (loaders/actions).
 * Reads auth tokens from request cookies and returns response headers
 * for any cookie updates (e.g. token refresh).
 *
 * Also returns a `getUser()` function that deduplicates the auth check
 * across parallel loaders sharing the same Request object.
 */
export function createSupabaseServerClient(request: Request) {
  const headers = new Headers()

  const supabase = createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '') as {
          name: string
          value: string
        }[]
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
        )
      },
    },
  })

  // Cached getUser: parent + child loaders share the same Request instance,
  // so only ONE auth.getUser() HTTP call is made per SSR request.
  const getUser = (): Promise<UserResult> => {
    let cached = userPromiseCache.get(request)
    if (!cached) {
      cached = supabase.auth.getUser()
      userPromiseCache.set(request, cached)
    }
    return cached
  }

  return { supabase, headers, getUser }
}

/**
 * Reusable headers export for route modules.
 * Forwards Set-Cookie headers from loaders to the response.
 */
export function mergeHeaders(...sources: Headers[]): Headers {
  const merged = new Headers()
  for (const source of sources) {
    for (const cookie of source.getSetCookie()) {
      merged.append('Set-Cookie', cookie)
    }
  }
  return merged
}
