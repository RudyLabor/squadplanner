// Supabase minimal - Import uniquement ce qui est utilisé
// Évite d'importer toute la suite Supabase (Storage, Edge Functions, etc.)

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Import sélectif pour réduire bundle size
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Client optimisé avec uniquement les features utilisées
export const supabaseMinimal = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auth features utilisées
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Prevent navigator.locks deadlock: limit both lock acquisition AND
    // the work inside the lock. On mobile, the browser can suspend fetch
    // requests while the app is backgrounded, holding the lock forever.
    lock: typeof navigator !== 'undefined' && navigator.locks
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
      : undefined,
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