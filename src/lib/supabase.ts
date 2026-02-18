import { createBrowserClient } from '@supabase/ssr'

// Strict Database typing disabled — run `npx supabase gen types typescript` to re-enable.
// import type { Database } from '../types/database'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  )
}

// Synchronous singleton — created immediately on module load (client-side only).
// @supabase/ssr is imported statically so the client is ready before any hook runs.
// This eliminates the race condition where hooks accessed the proxy before init.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): any {
  if (!_client) {
    _client = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Prevent navigator.locks deadlock: limit both lock acquisition AND
        // the work inside the lock. On mobile, the browser can suspend fetch
        // requests while the app is backgrounded, holding the lock forever.
        lock: (typeof navigator !== 'undefined' && navigator.locks
          ? (name: string, acquireTimeout: number, fn: () => Promise<unknown>) => {
              const timeout = acquireTimeout > 0 ? acquireTimeout : 5000
              return navigator.locks.request(
                name,
                { signal: AbortSignal.timeout(timeout) },
                () => Promise.race([
                  fn(),
                  new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Lock work timeout after ${timeout}ms`)), timeout)
                  ),
                ])
              )
            }
          : undefined) as any,
      },
    } as any)
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
export function initSupabase(): Promise<any> {
  return Promise.resolve(getClient())
}

/** Check if the Supabase client has been initialized */
export function isSupabaseReady(): boolean {
  return _client !== null
}

/** Wait for Supabase to be ready — now resolves immediately */
export function waitForSupabase(): Promise<any> {
  return Promise.resolve(getClient())
}

// Direct export — all 40+ import sites continue to work unchanged.
// The proxy delegates to the real client which is always available client-side.
// On the server side (SSR), falls back to a safe no-op proxy until hydration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    if (!_client) {
      // SSR: return safe no-ops so server rendering doesn't crash
      if (prop === 'auth') {
        return new Proxy(
          {},
          {
            get(__, authProp) {
              if (authProp === 'getSession')
                return () => Promise.resolve({ data: { session: null }, error: null })
              if (authProp === 'onAuthStateChange')
                return () => ({ data: { subscription: { unsubscribe: () => {} } } })
              return () => Promise.resolve({ data: null, error: null })
            },
          }
        )
      }
      if (prop === 'from' || prop === 'rpc' || prop === 'functions') {
        return () => {
          interface NoopBuilder {
            select: () => NoopBuilder
            insert: () => NoopBuilder
            update: () => NoopBuilder
            delete: () => NoopBuilder
            eq: () => NoopBuilder
            neq: () => NoopBuilder
            in: () => NoopBuilder
            is: () => NoopBuilder
            not: () => NoopBuilder
            or: () => NoopBuilder
            order: () => NoopBuilder
            limit: () => NoopBuilder
            single: () => NoopBuilder
            invoke: () => Promise<{ data: null; error: null }>
            then: (resolve: (value: { data: null; error: null }) => void) => void
            catch: () => Promise<{ data: null; error: null }>
          }
          const builder: NoopBuilder = {
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
            then: (resolve) => resolve({ data: null, error: null }),
            catch: () => Promise.resolve({ data: null, error: null }),
          }
          return builder
        }
      }
      if (prop === 'channel')
        return () => ({
          on: () => ({
            on: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }),
            subscribe: () => {},
          }),
          subscribe: () => {},
        })
      if (prop === 'removeChannel') return () => {}
      return undefined
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (_client as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(_client) : value
  },
})
