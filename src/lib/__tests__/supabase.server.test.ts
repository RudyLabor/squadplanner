/**
 * Tests for src/lib/supabase.server.ts
 * Covers: createSupabaseServerClient, mergeHeaders
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock @supabase/ssr
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-1' } },
  error: null,
})

const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
  parseCookieHeader: vi.fn((cookie: string) => {
    if (!cookie) return []
    return cookie.split('; ').map((c) => {
      const [name, value] = c.split('=')
      return { name, value }
    })
  }),
  serializeCookieHeader: vi.fn(
    (name: string, value: string, _options?: unknown) => `${name}=${value}; Path=/`
  ),
}))

import { createSupabaseServerClient, mergeHeaders } from '../supabase.server'

describe('supabase.server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // createSupabaseServerClient
  // =========================================================================
  describe('createSupabaseServerClient', () => {
    it('should return supabase client, headers, and getUser function', () => {
      const request = new Request('http://localhost/', {
        headers: { Cookie: 'sb-token=abc123' },
      })

      const result = createSupabaseServerClient(request)

      expect(result).toHaveProperty('supabase')
      expect(result).toHaveProperty('headers')
      expect(result).toHaveProperty('getUser')
      expect(typeof result.getUser).toBe('function')
    })

    it('should return a Headers instance', () => {
      const request = new Request('http://localhost/')
      const { headers } = createSupabaseServerClient(request)
      expect(headers).toBeInstanceOf(Headers)
    })

    it('getUser should return user data', async () => {
      const request = new Request('http://localhost/')
      const { getUser } = createSupabaseServerClient(request)

      const result = await getUser()
      expect(result.data.user).toEqual({ id: 'user-1' })
    })

    it('getUser should cache results for the same request (deduplication)', async () => {
      const request = new Request('http://localhost/')
      const { getUser } = createSupabaseServerClient(request)

      const result1 = getUser()
      const result2 = getUser()

      // Same promise instance
      expect(result1).toBe(result2)

      await result1
      // auth.getUser called only once
      expect(mockGetUser).toHaveBeenCalledTimes(1)
    })

    it('different requests should get separate user caches', async () => {
      const request1 = new Request('http://localhost/page1')
      const request2 = new Request('http://localhost/page2')

      const client1 = createSupabaseServerClient(request1)
      const client2 = createSupabaseServerClient(request2)

      await client1.getUser()
      await client2.getUser()

      // Each request triggers its own auth.getUser
      expect(mockGetUser).toHaveBeenCalledTimes(2)
    })
  })

  // =========================================================================
  // mergeHeaders
  // =========================================================================
  describe('mergeHeaders', () => {
    it('should merge Set-Cookie headers from multiple sources', () => {
      const headers1 = new Headers()
      headers1.append('Set-Cookie', 'a=1; Path=/')
      const headers2 = new Headers()
      headers2.append('Set-Cookie', 'b=2; Path=/')

      const merged = mergeHeaders(headers1, headers2)
      const cookies = merged.getSetCookie()

      expect(cookies).toHaveLength(2)
      expect(cookies).toContain('a=1; Path=/')
      expect(cookies).toContain('b=2; Path=/')
    })

    it('should return empty headers when no sources have Set-Cookie', () => {
      const headers1 = new Headers({ 'Content-Type': 'text/html' })
      const merged = mergeHeaders(headers1)
      const cookies = merged.getSetCookie()

      expect(cookies).toHaveLength(0)
    })

    it('should handle empty sources array', () => {
      const merged = mergeHeaders()
      expect(merged).toBeInstanceOf(Headers)
      expect(merged.getSetCookie()).toHaveLength(0)
    })

    it('should handle sources with multiple Set-Cookie headers', () => {
      const headers1 = new Headers()
      headers1.append('Set-Cookie', 'a=1; Path=/')
      headers1.append('Set-Cookie', 'b=2; Path=/')

      const merged = mergeHeaders(headers1)
      const cookies = merged.getSetCookie()

      expect(cookies).toHaveLength(2)
    })
  })
})
