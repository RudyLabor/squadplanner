import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

// Lazy singleton — @supabase/supabase-js is loaded via dynamic import
// to keep the 166KB bundle out of the initial landing page load
let _client: SupabaseClient | null = null
let _initPromise: Promise<SupabaseClient> | null = null

/**
 * Initialize the Supabase client (loads @supabase/supabase-js dynamically).
 * Must be awaited before the `supabase` proxy is used.
 */
export function initSupabase(): Promise<SupabaseClient> {
  if (!_initPromise) {
    _initPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      _client = createClient(supabaseUrl!, supabaseAnonKey!)
      return _client
    })
  }
  return _initPromise
}

// Synchronous proxy — all 40+ import sites continue to work unchanged.
// Safe because initSupabase() is awaited in auth initialization before any usage.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    if (!_client) {
      throw new Error('[Supabase] Not initialized. Ensure initSupabase() is awaited first.')
    }
    const value = (_client as any)[prop]
    return typeof value === 'function' ? value.bind(_client) : value
  }
})
