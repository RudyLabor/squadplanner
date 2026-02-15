import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock import.meta.env before module loads
const mockCreateClient = vi.hoisted(() => vi.fn())
const mockGetUser = vi.hoisted(() => vi.fn())

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient.mockReturnValue({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

import { createMinimalSSRClient, mergeHeaders } from '../supabase-minimal-ssr'

describe('supabase-minimal-ssr', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    })
  })

  describe('createMinimalSSRClient', () => {
    it('returns an object with supabase, headers, and getUser', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: '' },
      })
      const result = createMinimalSSRClient(request)
      expect(result).toHaveProperty('supabase')
      expect(result).toHaveProperty('headers')
      expect(result).toHaveProperty('getUser')
    })

    it('creates client with env URL and anon key', () => {
      const request = new Request('https://example.com')
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(), // URL from env
        expect.anything(), // Anon key from env
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: false,
            autoRefreshToken: false,
          }),
        })
      )
    })

    it('passes access token in headers when sb-access-token cookie exists', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: 'sb-access-token=my-token-123' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: expect.objectContaining({
            headers: { Authorization: 'Bearer my-token-123' },
          }),
        })
      )
    })

    it('passes access token when supabase-auth-token cookie exists', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: 'supabase-auth-token=auth-token-456' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: expect.objectContaining({
            headers: { Authorization: 'Bearer auth-token-456' },
          }),
        })
      )
    })

    it('prefers sb-access-token over supabase-auth-token', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: 'sb-access-token=primary; supabase-auth-token=fallback' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: expect.objectContaining({
            headers: { Authorization: 'Bearer primary' },
          }),
        })
      )
    })

    it('passes empty headers when no auth cookies present', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: 'other-cookie=value' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: expect.objectContaining({
            headers: {},
          }),
        })
      )
    })

    it('passes empty headers when no Cookie header at all', () => {
      const request = new Request('https://example.com')
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: expect.objectContaining({
            headers: {},
          }),
        })
      )
    })

    it('disables persistSession and autoRefreshToken for SSR', () => {
      const request = new Request('https://example.com')
      createMinimalSSRClient(request)

      const callArgs = mockCreateClient.mock.calls[0][2]
      expect(callArgs.auth.persistSession).toBe(false)
      expect(callArgs.auth.autoRefreshToken).toBe(false)
    })

    it('returns fresh Headers instance', () => {
      const request = new Request('https://example.com')
      const result = createMinimalSSRClient(request)
      expect(result.headers).toBeInstanceOf(Headers)
    })

    describe('getUser', () => {
      it('returns user data from supabase auth', async () => {
        const request = new Request('https://example.com', {
          headers: { Cookie: 'sb-access-token=token' },
        })
        const { getUser } = createMinimalSSRClient(request)
        const result = await getUser()

        expect(result.data.user).toEqual({ id: 'user-1', email: 'test@test.com' })
        expect(result.error).toBeNull()
      })

      it('caches user result for same request', async () => {
        const request = new Request('https://example.com', {
          headers: { Cookie: 'sb-access-token=token' },
        })
        const { getUser } = createMinimalSSRClient(request)

        await getUser()
        await getUser()
        await getUser()

        // supabase.auth.getUser should only be called once due to caching
        expect(mockGetUser).toHaveBeenCalledTimes(1)
      })

      it('returns different cached results for different requests', async () => {
        const request1 = new Request('https://example.com/page1', {
          headers: { Cookie: 'sb-access-token=token1' },
        })
        const request2 = new Request('https://example.com/page2', {
          headers: { Cookie: 'sb-access-token=token2' },
        })

        mockGetUser
          .mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
          .mockResolvedValueOnce({ data: { user: { id: 'user-2' } }, error: null })

        const client1 = createMinimalSSRClient(request1)
        const client2 = createMinimalSSRClient(request2)

        const result1 = await client1.getUser()
        const result2 = await client2.getUser()

        expect(result1.data.user?.id).toBe('user-1')
        expect(result2.data.user?.id).toBe('user-2')
      })

      it('returns error when auth fails', async () => {
        mockGetUser.mockResolvedValueOnce({
          data: { user: null },
          error: new Error('Invalid token'),
        })

        const request = new Request('https://example.com')
        const { getUser } = createMinimalSSRClient(request)
        const result = await getUser()

        expect(result.data.user).toBeNull()
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error?.message).toBe('Invalid token')
      })
    })
  })

  describe('parseCookies (via createMinimalSSRClient)', () => {
    it('parses single cookie', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: 'sb-access-token=abc123' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: { headers: { Authorization: 'Bearer abc123' } },
        })
      )
    })

    it('parses multiple cookies separated by semicolons', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: 'other=x; sb-access-token=abc123; another=y' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: { headers: { Authorization: 'Bearer abc123' } },
        })
      )
    })

    it('handles cookies with = in value', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: 'sb-access-token=base64token==' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: { headers: { Authorization: 'Bearer base64token==' } },
        })
      )
    })

    it('handles empty cookie header', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: '' },
      })
      createMinimalSSRClient(request)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: { headers: {} },
        })
      )
    })

    it('handles cookies with whitespace', () => {
      const request = new Request('https://example.com', {
        headers: { Cookie: '  sb-access-token = token123 ; other = val  ' },
      })
      createMinimalSSRClient(request)

      // The parser trims cookie names/values, name after trim = "sb-access-token "
      // Actually the code does cookie.trim().split('=') so name would be "sb-access-token "
      // with space before =. Let me check - no, it splits on '=' first:
      // "  sb-access-token = token123 " -> trim -> "sb-access-token = token123"
      // split('=') -> ["sb-access-token ", " token123 "]
      // name = "sb-access-token " (with trailing space) which won't match 'sb-access-token'
      // So this will result in empty headers
      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          global: { headers: {} },
        })
      )
    })
  })

  describe('mergeHeaders', () => {
    it('returns a new Headers instance', () => {
      const result = mergeHeaders()
      expect(result).toBeInstanceOf(Headers)
    })

    it('merges Set-Cookie headers from multiple sources', () => {
      const h1 = new Headers()
      const h2 = new Headers()

      // Note: Headers.getSetCookie() returns an array of Set-Cookie values
      // In modern environments, append adds multiple values
      h1.append('Set-Cookie', 'session=abc; Path=/')
      h2.append('Set-Cookie', 'token=xyz; Path=/')

      const merged = mergeHeaders(h1, h2)
      const cookies = merged.getSetCookie()
      expect(cookies).toContain('session=abc; Path=/')
      expect(cookies).toContain('token=xyz; Path=/')
    })

    it('handles empty Headers sources', () => {
      const h1 = new Headers()
      const h2 = new Headers()
      const merged = mergeHeaders(h1, h2)
      expect(merged.getSetCookie()).toHaveLength(0)
    })

    it('handles single source', () => {
      const h1 = new Headers()
      h1.append('Set-Cookie', 'test=123')
      const merged = mergeHeaders(h1)
      const cookies = merged.getSetCookie()
      expect(cookies).toContain('test=123')
    })

    it('handles no sources', () => {
      const merged = mergeHeaders()
      expect(merged.getSetCookie()).toHaveLength(0)
    })

    it('preserves multiple Set-Cookie from same source', () => {
      const h1 = new Headers()
      h1.append('Set-Cookie', 'a=1')
      h1.append('Set-Cookie', 'b=2')
      const merged = mergeHeaders(h1)
      const cookies = merged.getSetCookie()
      expect(cookies.length).toBe(2)
    })
  })
})
