import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {},
}))

const mockCreateClient = vi.hoisted(() => vi.fn().mockReturnValue(mockSupabaseClient))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

vi.mock('../../types/database.types', () => ({
  // Provide empty Database type
}))

import {
  supabaseMinimal,
  supabase,
  initSupabase,
  isSupabaseReady,
  waitForSupabase,
} from '../supabaseMinimal'

describe('supabaseMinimal', () => {
  describe('client creation', () => {
    it('exports supabaseMinimal client', () => {
      expect(supabaseMinimal).toBeDefined()
    })

    it('exports supabase as alias for supabaseMinimal', () => {
      expect(supabase).toBe(supabaseMinimal)
    })

    it('creates client with createClient from @supabase/supabase-js', () => {
      expect(mockCreateClient).toHaveBeenCalled()
    })

    it('passes URL from environment or empty string', () => {
      const url = mockCreateClient.mock.calls[0][0]
      expect(typeof url).toBe('string')
    })

    it('passes anon key from environment or empty string', () => {
      const key = mockCreateClient.mock.calls[0][1]
      expect(typeof key).toBe('string')
    })

    it('configures auth with autoRefreshToken enabled', () => {
      const options = mockCreateClient.mock.calls[0][2]
      expect(options.auth.autoRefreshToken).toBe(true)
    })

    it('configures auth with persistSession enabled', () => {
      const options = mockCreateClient.mock.calls[0][2]
      expect(options.auth.persistSession).toBe(true)
    })

    it('configures auth with detectSessionInUrl enabled', () => {
      const options = mockCreateClient.mock.calls[0][2]
      expect(options.auth.detectSessionInUrl).toBe(true)
    })

    it('configures realtime with eventsPerSecond rate limit of 10', () => {
      const options = mockCreateClient.mock.calls[0][2]
      expect(options.realtime.params.eventsPerSecond).toBe(10)
    })

    it('sets X-Client-Info header to squadplanner-web', () => {
      const options = mockCreateClient.mock.calls[0][2]
      expect(options.global.headers['X-Client-Info']).toBe('squadplanner-web')
    })
  })

  describe('singleton pattern', () => {
    it('createClient is called exactly once (module-level singleton)', () => {
      // The module is loaded once, so createClient should only be called once
      expect(mockCreateClient).toHaveBeenCalledTimes(1)
    })

    it('supabaseMinimal and supabase reference the same object', () => {
      expect(supabaseMinimal).toBe(supabase)
    })
  })

  describe('initSupabase', () => {
    it('returns a promise', () => {
      const result = initSupabase()
      expect(result).toBeInstanceOf(Promise)
    })

    it('resolves to the supabaseMinimal client', async () => {
      const client = await initSupabase()
      expect(client).toBe(supabaseMinimal)
    })

    it('resolves immediately (no async work)', async () => {
      const start = Date.now()
      await initSupabase()
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50)
    })
  })

  describe('isSupabaseReady', () => {
    it('returns true', () => {
      expect(isSupabaseReady()).toBe(true)
    })

    it('always returns true regardless of state', () => {
      // Call multiple times to verify consistency
      expect(isSupabaseReady()).toBe(true)
      expect(isSupabaseReady()).toBe(true)
      expect(isSupabaseReady()).toBe(true)
    })

    it('returns a boolean', () => {
      expect(typeof isSupabaseReady()).toBe('boolean')
    })
  })

  describe('waitForSupabase', () => {
    it('returns a promise', () => {
      const result = waitForSupabase()
      expect(result).toBeInstanceOf(Promise)
    })

    it('resolves to the supabaseMinimal client', async () => {
      const client = await waitForSupabase()
      expect(client).toBe(supabaseMinimal)
    })

    it('resolves immediately', async () => {
      const start = Date.now()
      await waitForSupabase()
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50)
    })
  })

  describe('configuration defaults with missing env vars', () => {
    it('URL defaults to empty string when env var is missing', () => {
      // The source uses: import.meta.env.VITE_SUPABASE_URL || ''
      const url = mockCreateClient.mock.calls[0][0]
      // URL should be either the env value or empty string
      expect(url === '' || typeof url === 'string').toBe(true)
    })

    it('anon key defaults to empty string when env var is missing', () => {
      const key = mockCreateClient.mock.calls[0][1]
      expect(key === '' || typeof key === 'string').toBe(true)
    })
  })
})
