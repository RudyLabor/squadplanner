/**
 * Lightweight Supabase REST client for simple read queries.
 *
 * Uses fetch directly against the PostgREST API (~5 KB vs 176 KB for the full SDK).
 * Only for READ operations that don't need auth mutations, realtime, or storage.
 *
 * RLS is respected because we forward the user's access_token (read from
 * localStorage where @supabase/ssr stores it).
 *
 * Usage:
 *   import { query } from '@/lib/supabase-light'
 *   const { data, error } = await query<Profile[]>('profiles', {
 *     select: 'id,username,avatar_url',
 *     filter: { id: `eq.${userId}` },
 *     single: true,
 *   })
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * Retrieve the current access token from the cookie/localStorage session that
 * @supabase/ssr persists. Falls back to the anon key when no session exists
 * (pre-login or SSR).
 */
function getAccessToken(): string {
  if (typeof window === 'undefined') return SUPABASE_KEY
  try {
    const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
    const storageKey = `sb-${projectRef}-auth-token`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.access_token) return parsed.access_token
    }
  } catch {
    // Silently fall back to anon key
  }
  return SUPABASE_KEY
}

export interface QueryOptions {
  /** PostgREST select expression, e.g. 'id,username,avatar_url' */
  select?: string
  /** PostgREST filter key-value pairs, e.g. { id: 'eq.abc', role: 'in.(admin,mod)' } */
  filter?: Record<string, string>
  /** Maximum number of rows to return */
  limit?: number
  /** Sort order */
  order?: { column: string; ascending?: boolean }
  /** When true, returns a single object instead of an array (406 if not exactly 1 row) */
  single?: boolean
}

export interface QueryResult<T> {
  data: T | null
  error: { message: string; status: number } | null
}

/**
 * Execute a read-only query against the Supabase REST API.
 *
 * @example
 * const { data } = await query<Squad[]>('squads', {
 *   select: 'id,name,logo_url',
 *   limit: 10,
 *   order: { column: 'created_at', ascending: false },
 * })
 */
export async function query<T>(
  table: string,
  options: QueryOptions = {},
): Promise<QueryResult<T>> {
  const params = new URLSearchParams()

  if (options.select) params.set('select', options.select)
  if (options.limit) params.set('limit', String(options.limit))
  if (options.order) {
    params.set(
      'order',
      `${options.order.column}.${options.order.ascending !== false ? 'asc' : 'desc'}`,
    )
  }
  if (options.filter) {
    for (const [key, value] of Object.entries(options.filter)) {
      params.set(key, value)
    }
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
  }
  if (options.single) {
    headers['Accept'] = 'application/vnd.pgrst.object+json'
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${params}`,
      { headers },
    )
    if (!res.ok) {
      return { data: null, error: { message: res.statusText, status: res.status } }
    }
    const data = await res.json() as T
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'Network error', status: 0 },
    }
  }
}
