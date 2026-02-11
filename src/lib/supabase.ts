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
 * Initialize the Supabase client (loads @supabase/ssr dynamically).
 * Uses createBrowserClient which stores auth tokens in cookies + localStorage,
 * enabling server-side loaders to read auth state from request cookies.
 * Must be awaited before the `supabase` proxy is used.
 */
export function initSupabase(): Promise<SupabaseClient> {
  if (!_initPromise) {
    _initPromise = import('@supabase/ssr').then(({ createBrowserClient }) => {
      _client = createBrowserClient(supabaseUrl!, supabaseAnonKey!)
      return _client
    })
  }
  return _initPromise
}

/** Check if the Supabase client has been initialized */
export function isSupabaseReady(): boolean {
  return _client !== null
}

/** Wait for Supabase to be ready — triggers init if not started */
export function waitForSupabase(): Promise<SupabaseClient> {
  if (_client) return Promise.resolve(_client)
  return initSupabase()
}

/**
 * Creates a chainable no-op proxy that mimics the Supabase query builder.
 * Every method call returns the same proxy, and when awaited resolves to
 * { data: null, error: { message: '...', code: 'NOT_INITIALIZED' } }.
 * This prevents crashes when hooks access supabase before init completes.
 */
function createPendingProxy(): any {
  const notReady = { data: null, error: { message: '[Supabase] Not initialized yet', code: 'NOT_INITIALIZED' } }
  const resolved = Promise.resolve(notReady)

  const handler: ProxyHandler<any> = {
    get(_, prop) {
      // Make the proxy awaitable (thenable)
      if (prop === 'then') return resolved.then.bind(resolved)
      if (prop === 'catch') return resolved.catch.bind(resolved)
      if (prop === 'finally') return resolved.finally.bind(resolved)
      // onAuthStateChange needs to return a subscription-like object
      if (prop === 'onAuthStateChange') {
        return () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
      // For channel().on().subscribe() pattern
      if (prop === 'unsubscribe' || prop === 'removeChannel') return () => {}
      // Any other property returns the proxy itself (chainable)
      return createPendingProxy()
    },
    apply() {
      // Function calls return another pending proxy (chainable)
      return createPendingProxy()
    },
  }

  return new Proxy(function () {}, handler)
}

// Synchronous proxy — all 40+ import sites continue to work unchanged.
// When _client is null (before init), returns safe no-op proxies instead of throwing.
// Hooks receive { data: null, error } and handle gracefully via existing error paths.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    if (!_client) {
      // Return a safe chainable no-op instead of crashing
      return createPendingProxy()
    }
    const value = (_client as any)[prop]
    return typeof value === 'function' ? value.bind(_client) : value
  }
})
