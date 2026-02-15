/**
 * Tests for src/lib/supabase-realtime.ts
 * Covers: getRealtimeClient (currently disabled — throws error)
 */
import { describe, it, expect } from 'vitest'

import { getRealtimeClient } from '../supabase-realtime'

describe('supabase-realtime', () => {
  it('should export getRealtimeClient', () => {
    expect(getRealtimeClient).toBeDefined()
    expect(typeof getRealtimeClient).toBe('function')
  })

  it('should throw error because realtime is currently disabled', async () => {
    await expect(getRealtimeClient()).rejects.toThrow(
      'Realtime client disabled to reduce bundle size'
    )
  })

  it('should reject with an Error instance', async () => {
    try {
      await getRealtimeClient()
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
    }
  })

  it('should throw the same error on repeated calls', async () => {
    // Both calls should throw the same error (client is never cached since it throws)
    await expect(getRealtimeClient()).rejects.toThrow('Realtime client disabled')
    await expect(getRealtimeClient()).rejects.toThrow('Realtime client disabled')
  })
})
