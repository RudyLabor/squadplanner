/**
 * Full Supabase client, lazy-loaded only for features that need realtime.
 *
 * Import this ONLY in modules that require realtime subscriptions
 * (e.g. Messages, Party, live presence). For simple read queries,
 * prefer `supabase-light.ts` instead.
 *
 * This wrapper exists so that call sites explicitly opt-in to
 * pulling the full 176 KB SDK, keeping the cost visible.
 *
 * Usage:
 *   import { getRealtimeClient } from '@/lib/supabase-realtime'
 *   const client = await getRealtimeClient()
 *   client.channel('room').on('broadcast', ...).subscribe()
 */

import type { SupabaseClient } from '@supabase/supabase-js'

let _realtimeClient: SupabaseClient | null = null

/**
 * Returns the full Supabase client, lazily initialising it on first call.
 * Subsequent calls return the same cached instance.
 */
export async function getRealtimeClient(): Promise<SupabaseClient> {
  if (_realtimeClient) return _realtimeClient

  const { initSupabase } = await import('./supabase')
  _realtimeClient = await initSupabase()
  return _realtimeClient!
}
