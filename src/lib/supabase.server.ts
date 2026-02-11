import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Create an authenticated Supabase client for server-side use (loaders/actions).
 * Reads auth tokens from request cookies and returns response headers
 * for any cookie updates (e.g. token refresh).
 */
export function createSupabaseServerClient(request: Request) {
  const headers = new Headers()

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '')
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
        )
      },
    },
  })

  return { supabase, headers }
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
