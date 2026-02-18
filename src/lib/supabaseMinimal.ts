// Supabase minimal - Import uniquement ce qui est utilisé
// Évite d'importer toute la suite Supabase (Storage, Edge Functions, etc.)

import { createClient } from '@supabase/supabase-js'

// Import sélectif pour réduire bundle size
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Strict Database typing disabled — run `npx supabase gen types typescript` to re-enable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMinimal: any = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auth features utilisées
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Prevent navigator.locks deadlock: limit lock acquisition time.
    // On mobile, the browser suspends fetch requests while the app is
    // backgrounded, but the lock and token refresh resume normally when
    // the user returns. We only use AbortSignal.timeout to prevent
    // infinite waits — no visibilitychange rejection, which was killing
    // legitimate auth refreshes at exactly the wrong moment (tab resume).
    lock: (typeof navigator !== 'undefined' && navigator.locks
      ? (name: string, acquireTimeout: number, fn: () => Promise<unknown>) => {
          const timeout = acquireTimeout > 0 ? acquireTimeout : 10000
          return navigator.locks.request(
            name,
            { signal: AbortSignal.timeout(timeout) },
            () => Promise.race([
              fn(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Lock work timeout after ${timeout}ms`)), timeout)
              ),
            ])
          )
        }
      : undefined) as any,
  },
  
  // Désactive features non utilisées pour réduire bundle
  realtime: {
    // Garde realtime pour messages en temps réel
    params: {
      eventsPerSecond: 10, // Limite rate pour performance
    },
  },
  
  global: {
    headers: {
      'X-Client-Info': 'squadplanner-web'
    }
  }
})

// Expose on window for synchronous access from click handlers (MobileBottomNav).
// Dynamic import() is async and can't fix the deadlock fast enough at click time.
if (typeof window !== 'undefined') {
  ;(window as any).__supabaseMinimal = supabaseMinimal
}

// Reset internal auth lock state on tab resume.
// When our custom lock's Promise.race times out while the app is backgrounded,
// the original callback keeps running → lockAcquired stays true forever,
// and all subsequent auth calls (getSession, getUser, token refresh) queue up
// in pendingInLock, creating a deadlock where nothing ever resolves.
// We must clear BOTH lockAcquired AND pendingInLock to fully recover.
if (typeof window !== 'undefined') {
  const resetAuthLock = () => {
    const auth = (supabaseMinimal as any).auth
    if (!auth) return
    if (auth.lockAcquired) {
      const pendingCount = Array.isArray(auth.pendingInLock) ? auth.pendingInLock.length : 0
      if (pendingCount > 0) {
        console.warn(
          `[supabaseMinimal] Auth lock deadlock: lockAcquired=true, ${pendingCount} pending ops. Releasing.`
        )
      }
      auth.lockAcquired = false
      // Discard zombie operations stuck behind the dead lock.
      // Their promises will never resolve, but new calls from React
      // re-renders will work correctly since the lock is now free.
      if (Array.isArray(auth.pendingInLock)) {
        auth.pendingInLock = []
      }
    }
    // Restart auto-refresh if it was stopped during the deadlock
    if (auth.autoRefreshTicker === false || auth.autoRefreshTicker == null) {
      try { auth.startAutoRefresh?.() } catch { /* ignore */ }
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resetAuthLock()
  })
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) resetAuthLock()
  })
}

// Re-export types couramment utilisés
export type { User, Session } from '@supabase/supabase-js'

// Export aussi comme 'supabase' pour compatibility
export { supabaseMinimal as supabase }

// Compatibility function pour useAuth
export function initSupabase() {
  return Promise.resolve(supabaseMinimal)
}

// Helper functions pour compatibility
export function isSupabaseReady(): boolean {
  return true // Le client minimal est toujours prêt
}

export function waitForSupabase() {
  return Promise.resolve(supabaseMinimal)
}