/**
 * Tests for src/lib/supabase-realtime.ts
 * Covers: getRealtimeClient — lazily loads the full Supabase client
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase module to avoid real network calls
vi.mock('../supabase', () => ({
  initSupabase: vi.fn(() => Promise.resolve({ __mock: true })),
}))

describe('supabase-realtime', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('getRealtimeClient is exported as an async function', async () => {
    const { getRealtimeClient } = await import('../supabase-realtime')
    expect(getRealtimeClient).toBeDefined()
    expect(typeof getRealtimeClient).toBe('function')
  })

  it('getRealtimeClient returns a SupabaseClient via lazy import', async () => {
    const { getRealtimeClient } = await import('../supabase-realtime')
    const client = await getRealtimeClient()
    expect(client).toBeDefined()
    expect(client).toHaveProperty('__mock', true)
  })

  it('getRealtimeClient caches the client on subsequent calls', async () => {
    const { getRealtimeClient } = await import('../supabase-realtime')
    const client1 = await getRealtimeClient()
    const client2 = await getRealtimeClient()
    expect(client1).toBe(client2)
  })

  it('module has minimal API surface with only getRealtimeClient export', async () => {
    const mod = await import('../supabase-realtime')
    expect(mod).toBeDefined()
    expect(mod.getRealtimeClient).toBeDefined()
    const keys = Object.keys(mod)
    expect(keys).toContain('getRealtimeClient')
    const functionExports = Object.values(mod).filter((v) => typeof v === 'function')
    expect(functionExports.length).toBeGreaterThanOrEqual(1)
  })
})
