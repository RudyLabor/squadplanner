// CLIENT SSR ULTRA-MINIMAL - Remplace @supabase/ssr (168KB → ~20KB)
// Fait UNIQUEMENT : Auth check + queries basiques
// ÉLIMINE : Realtime, Storage, Edge Functions, etc.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

type UserResult = {
  data: { user: { id: string; email?: string } | null }
  error: Error | null
}

// Cache pour éviter les appels redondants
const userCache = new WeakMap<Request, Promise<UserResult>>()

/**
 * CLIENT SSR MINIMAL - Remplace createSupabaseServerClient
 * Gain attendu: 168KB → ~20KB (-148KB)
 */
export function createMinimalSSRClient(request: Request) {
  const headers = new Headers()

  // During prerendering in CI, env vars may not be available.
  // Return a stub that always returns "no user" to let public pages render.
  if (!supabaseUrl || !supabaseAnonKey) {
    const stubUser = () => Promise.resolve({ data: { user: null }, error: null } as UserResult)
    return {
      supabase: null as any,
      headers,
      getUser: stubUser,
    }
  }

  // Parse cookies manuellement (sans @supabase/ssr)
  const cookies = parseCookies(request.headers.get('Cookie') || '')
  const accessToken = cookies['sb-access-token'] || cookies['supabase-auth-token']

  // Client minimal avec token pré-configuré
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
    // DÉSACTIVE tout ce qui n'est pas nécessaire
    auth: {
      persistSession: false, // Pas de persistence côté serveur
      autoRefreshToken: false, // Pas de refresh SSR
    },
    realtime: {
      params: {
        // Disable realtime pour le SSR
      },
    },
  })

  // Auth check simplifié avec cache
  const getUser = (): Promise<UserResult> => {
    let cached = userCache.get(request)
    if (!cached) {
      cached = supabase.auth.getUser().then((result) => ({
        data: { user: result.data.user },
        error: result.error,
      }))
      userCache.set(request, cached)
    }
    return cached
  }

  return {
    supabase,
    headers,
    getUser,
  }
}

/**
 * Parse cookies manuellement pour éviter @supabase/ssr
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length) {
      cookies[name] = rest.join('=')
    }
  })

  return cookies
}

/**
 * Headers merge simplifié
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
