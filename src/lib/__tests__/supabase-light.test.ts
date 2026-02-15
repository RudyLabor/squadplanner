import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The source uses import.meta.env.VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// which are resolved at transform time by Vite. We can't easily mock them.
// Instead, we test against the actual env values from .env.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Mock fetch globally
const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

// Derive the localStorage key from SUPABASE_URL
function getStorageKey() {
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token`
}

describe('supabase-light', () => {
  let query: typeof import('../supabase-light').query

  beforeEach(async () => {
    vi.resetModules()
    mockFetch.mockReset()
    localStorage.clear()
    const mod = await import('../supabase-light')
    query = mod.query
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('query - basic requests', () => {
    it('makes GET request to correct URL with table name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: '1', name: 'test' }]),
      })

      await query('profiles')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain(`${SUPABASE_URL}/rest/v1/profiles`)
    })

    it('includes apikey header with anon key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.apikey).toBe(SUPABASE_KEY)
    })

    it('includes Authorization header with Bearer token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toMatch(/^Bearer /)
    })

    it('includes Content-Type application/json', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers['Content-Type']).toBe('application/json')
    })

    it('returns data on successful response', async () => {
      const mockData = [{ id: '1', name: 'Squad A' }]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const result = await query('squads')

      expect(result.data).toEqual(mockData)
      expect(result.error).toBeNull()
    })
  })

  describe('query - options', () => {
    it('adds select parameter to URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('profiles', { select: 'id,username,avatar_url' })

      const [url] = mockFetch.mock.calls[0]
      // URLSearchParams encodes commas
      expect(url).toContain('select=')
      expect(decodeURIComponent(url)).toContain('select=id,username,avatar_url')
    })

    it('adds limit parameter to URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('squads', { limit: 10 })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('limit=10')
    })

    it('adds ascending order parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('sessions', { order: { column: 'created_at', ascending: true } })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('order=created_at.asc')
    })

    it('adds descending order parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('sessions', { order: { column: 'created_at', ascending: false } })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('order=created_at.desc')
    })

    it('defaults to ascending when ascending is not specified', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('sessions', { order: { column: 'name' } })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('order=name.asc')
    })

    it('adds filter parameters to URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('profiles', {
        filter: { id: 'eq.abc123', role: 'in.(admin,mod)' },
      })

      const [url] = mockFetch.mock.calls[0]
      const decoded = decodeURIComponent(url)
      expect(decoded).toContain('id=eq.abc123')
      expect(decoded).toContain('role=in.(admin,mod)')
    })

    it('sets Accept header for single mode', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      })

      await query('profiles', { single: true })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Accept).toBe('application/vnd.pgrst.object+json')
    })

    it('does not set Accept header when single is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('profiles', { single: false })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Accept).toBeUndefined()
    })

    it('does not set Accept header when single is not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Accept).toBeUndefined()
    })

    it('combines multiple options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('squads', {
        select: 'id,name',
        limit: 5,
        order: { column: 'name', ascending: true },
        filter: { status: 'eq.active' },
      })

      const [url] = mockFetch.mock.calls[0]
      const decoded = decodeURIComponent(url)
      expect(decoded).toContain('select=')
      expect(decoded).toContain('limit=5')
      expect(decoded).toContain('order=name.asc')
      expect(decoded).toContain('status=eq.active')
    })

    it('does not add limit param when limit is 0', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await query('squads', { limit: 0 })

      const [url] = mockFetch.mock.calls[0]
      expect(url).not.toContain('limit=')
    })
  })

  describe('query - error handling', () => {
    it('returns error for non-ok HTTP response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const result = await query('nonexistent')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Not Found', status: 404 })
    })

    it('returns error for 500 server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const result = await query('squads')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Internal Server Error', status: 500 })
    })

    it('returns error with status 0 for network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'))

      const result = await query('squads')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Failed to fetch', status: 0 })
    })

    it('returns generic Network error for non-Error throws', async () => {
      mockFetch.mockRejectedValue('something went wrong')

      const result = await query('squads')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Network error', status: 0 })
    })

    it('returns error for 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const result = await query('profiles')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Unauthorized', status: 401 })
    })

    it('returns error for 406 when single returns multiple rows', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 406,
        statusText: 'Not Acceptable',
      })

      const result = await query('profiles', { single: true })

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Not Acceptable', status: 406 })
    })
  })

  describe('query - access token from localStorage', () => {
    const storageKey = getStorageKey()

    it('uses access_token from localStorage when available', async () => {
      localStorage.setItem(storageKey, JSON.stringify({ access_token: 'user-jwt-token-xyz' }))

      vi.resetModules()
      const mod = await import('../supabase-light')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await mod.query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toBe('Bearer user-jwt-token-xyz')
    })

    it('falls back to anon key when localStorage has invalid JSON', async () => {
      localStorage.setItem(storageKey, 'not-json')

      vi.resetModules()
      const mod = await import('../supabase-light')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await mod.query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toBe(`Bearer ${SUPABASE_KEY}`)
    })

    it('falls back to anon key when no token in localStorage', async () => {
      vi.resetModules()
      const mod = await import('../supabase-light')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await mod.query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toBe(`Bearer ${SUPABASE_KEY}`)
    })

    it('falls back to anon key when token object has no access_token', async () => {
      localStorage.setItem(storageKey, JSON.stringify({ refresh_token: 'abc' }))

      vi.resetModules()
      const mod = await import('../supabase-light')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await mod.query('profiles')

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toBe(`Bearer ${SUPABASE_KEY}`)
    })
  })

  describe('query - empty options', () => {
    it('works with no options provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const result = await query('squads')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('works with empty options object', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const result = await query('squads', {})

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('query - typed results', () => {
    it('returns typed data with generic parameter', async () => {
      interface Profile {
        id: string
        username: string
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: '1', username: 'test' }]),
      })

      const result = await query<Profile[]>('profiles')

      expect(result.data).toBeTruthy()
      expect(result.data![0].id).toBe('1')
      expect(result.data![0].username).toBe('test')
    })

    it('returns single object with generic type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'test-squad' }),
      })

      const result = await query<{ id: string; name: string }>('squads', { single: true })

      expect(result.data).toEqual({ id: '1', name: 'test-squad' })
    })
  })
})
