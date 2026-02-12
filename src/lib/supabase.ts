import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

// Synchronous singleton — created immediately on module load (client-side only).
// @supabase/ssr is imported statically so the client is ready before any hook runs.
// This eliminates the race condition where hooks accessed the proxy before init.
let _client: SupabaseClient<Database> | null = null

function getClient(): SupabaseClient<Database> {
  if (!_client) {
    _client = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return _client
}

// Eagerly initialize on module load (client-side)
if (typeof window !== 'undefined') {
  getClient()
}

/**
 * Initialize the Supabase client.
 * Now synchronous under the hood — kept for backward compatibility with
 * useAuth.initialize() and supabase-realtime.ts which await it.
 */
export function initSupabase(): Promise<SupabaseClient<Database>> {
  return Promise.resolve(getClient())
}

/** Check if the Supabase client has been initialized */
export function isSupabaseReady(): boolean {
  return _client !== null
}

/** Wait for Supabase to be ready — now resolves immediately */
export function waitForSupabase(): Promise<SupabaseClient<Database>> {
  return Promise.resolve(getClient())
}

// Direct export — all 40+ import sites continue to work unchanged.
// The proxy delegates to the real client which is always available client-side.
// On the server side (SSR), falls back to a safe no-op proxy until hydration.
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop: string | symbol) {
    if (!_client) {
      // SSR: return safe no-ops so server rendering doesn't crash
      if (prop === 'auth') {
        return new Proxy({}, {
          get(__, authProp) {
            if (authProp === 'getSession') return () => Promise.resolve({ data: { session: null }, error: null })
            if (authProp === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: () => {} } } })
            return () => Promise.resolve({ data: null, error: null })
          }
        })
      }
      if (prop === 'from' || prop === 'rpc' || prop === 'functions') {
        return () => {
          const builder: any = {
            select: () => builder,
            insert: () => builder,
            update: () => builder,
            delete: () => builder,
            eq: () => builder,
            neq: () => builder,
            in: () => builder,
            is: () => builder,
            not: () => builder,
            or: () => builder,
            order: () => builder,
            limit: () => builder,
            single: () => builder,
            invoke: () => Promise.resolve({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: null, error: null }),
            catch: () => Promise.resolve({ data: null, error: null }),
          }
          return builder
        }
      }
      if (prop === 'channel') return () => ({ on: () => ({ on: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }), subscribe: () => {} }), subscribe: () => {} })
      if (prop === 'removeChannel') return () => {}
      return undefined
    }
    const value = (_client as any)[prop]
    return typeof value === 'function' ? value.bind(_client) : value
  }
})
