import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// Hoisted mock variables – accessible inside vi.mock factories
// ---------------------------------------------------------------------------
const mockGetUser = vi.hoisted(() => vi.fn())
const mockRefreshSession = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockCreateMinimalSSRClient = vi.hoisted(() => vi.fn())
const mockRedirect = vi.hoisted(() => vi.fn())
const mockData = vi.hoisted(() => vi.fn((d: any) => d))

// Client-side supabase mock
const mockClientGetUser = vi.hoisted(() => vi.fn())
const mockClientRpc = vi.hoisted(() => vi.fn())
const mockClientFrom = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  redirect: mockRedirect,
  data: mockData,
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: ({ children }: any) => createElement('div', null, children || 'outlet'),
  useMatches: vi.fn().mockReturnValue([]),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('../../lib/supabase-minimal-ssr', () => ({
  createMinimalSSRClient: mockCreateMinimalSSRClient,
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getUser: mockClientGetUser },
    rpc: mockClientRpc,
    from: mockClientFrom,
  },
}))

vi.mock('../../components/ProtectedLayoutClient', () => ({
  ProtectedLayoutClient: ({ loaderData }: any) =>
    createElement('div', { 'data-testid': 'protected-layout' }, JSON.stringify(loaderData)),
}))

import DefaultExport, { loader, clientLoader, shouldRevalidate, headers } from '../_protected'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/home') {
  return new Request(url)
}

function buildChainedFrom(resolvedData: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData }),
  }
  return vi.fn().mockReturnValue(chain)
}

// Sets up the SSR mock with configurable return values
function setupSSRMocks(overrides: {
  user?: any
  error?: any
  refreshSession?: any
  rpcResult?: any
  rpcError?: any
  profileData?: any
  membershipsData?: any
}) {
  const supabaseHeaders = new Headers()

  const fromChain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: overrides.profileData ?? null }),
  }
  const fromFn = vi.fn().mockReturnValue(fromChain)

  mockCreateMinimalSSRClient.mockReturnValue({
    supabase: {
      auth: {
        getUser: vi.fn(),
        refreshSession: mockRefreshSession.mockResolvedValue({
          data: { session: overrides.refreshSession ?? null },
        }),
      },
      rpc: mockRpc.mockResolvedValue({
        data: overrides.rpcResult ?? null,
        error: overrides.rpcError ?? null,
      }),
      from: fromFn,
    },
    headers: supabaseHeaders,
    getUser: mockGetUser.mockResolvedValue({
      data: { user: overrides.user ?? null },
      error: overrides.error ?? null,
    }),
  })

  // Set up from() to handle both tables in parallel queries
  if (overrides.membershipsData !== undefined) {
    // We need from to return different chains for different tables
    fromFn.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: overrides.profileData ?? null }),
            }),
          }),
        }
      }
      if (table === 'squad_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: overrides.membershipsData }),
          }),
        }
      }
      return fromChain
    })
  }

  return { supabaseHeaders, fromFn }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/_protected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockImplementation((d: any) => d)
  })

  // =========================================================================
  // shouldRevalidate
  // =========================================================================
  describe('shouldRevalidate', () => {
    it('always returns false to prevent re-running layout loader on client navigation', () => {
      expect(shouldRevalidate()).toBe(false)
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    it('passes through loaderHeaders if Cache-Control is already set', () => {
      const loaderHeaders = new Headers()
      loaderHeaders.set('Cache-Control', 'public, max-age=3600')
      const result = headers({ loaderHeaders })
      expect(result.get('Cache-Control')).toBe('public, max-age=3600')
    })

    it('sets default private Cache-Control when loaderHeaders lacks one', () => {
      const loaderHeaders = new Headers()
      const result = headers({ loaderHeaders })
      expect(result.get('Cache-Control')).toBe(
        'private, max-age=60, stale-while-revalidate=300'
      )
    })

    it('preserves other headers from loaderHeaders', () => {
      const loaderHeaders = new Headers()
      loaderHeaders.set('X-Custom', 'test-value')
      const result = headers({ loaderHeaders })
      expect(result.get('X-Custom')).toBe('test-value')
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders ProtectedLayoutClient with loaderData', () => {
      const loaderData = {
        user: { id: 'u1', email: 'test@example.com' },
        profile: { id: 'u1', username: 'tester' },
        squads: [{ id: 's1', name: 'Squad A' }],
      }
      render(createElement(DefaultExport, { loaderData } as any))
      expect(screen.getByTestId('protected-layout')).toBeTruthy()
      expect(screen.getByTestId('protected-layout').textContent).toContain('u1')
      expect(screen.getByTestId('protected-layout').textContent).toContain('tester')
    })

    it('renders with null user and empty data', () => {
      const loaderData = { user: null, profile: null, squads: [] }
      render(createElement(DefaultExport, { loaderData } as any))
      expect(screen.getByTestId('protected-layout')).toBeTruthy()
    })
  })

  // =========================================================================
  // loader — server-side
  // =========================================================================
  describe('loader', () => {
    it('returns empty data with headers when getUser returns error', async () => {
      setupSSRMocks({ user: null, error: new Error('No session') })
      mockRefreshSession.mockResolvedValue({ data: { session: null } })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ user: null, profile: null, squads: [] })
    })

    it('returns empty data when getUser returns no user and refresh fails', async () => {
      setupSSRMocks({ user: null, error: null, refreshSession: null })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ user: null, profile: null, squads: [] })
    })

    it('refreshes session when initial getUser fails, and proceeds with refreshed user', async () => {
      const refreshedUser = { id: 'refreshed-id', email: 'refresh@test.com' }
      setupSSRMocks({
        user: null,
        error: new Error('expired'),
        refreshSession: { user: refreshedUser },
        rpcResult: { profile: { id: 'refreshed-id', username: 'refreshed' }, squads: [{ id: 's1', name: 'Squad' }] },
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({
        user: { id: 'refreshed-id', email: 'refresh@test.com' },
        profile: { id: 'refreshed-id', username: 'refreshed' },
        squads: [{ id: 's1', name: 'Squad' }],
      })
    })

    it('uses RPC data when get_layout_data succeeds', async () => {
      const user = { id: 'u1', email: 'u@test.com' }
      const rpcProfile = { id: 'u1', username: 'rpcUser' }
      const rpcSquads = [{ id: 's1', name: 'RPC Squad', game: 'Valorant', invite_code: 'abc', owner_id: 'u1', created_at: '2026-01-01', member_count: 3 }]

      setupSSRMocks({
        user,
        rpcResult: { profile: rpcProfile, squads: rpcSquads },
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({
        user: { id: 'u1', email: 'u@test.com' },
        profile: rpcProfile,
        squads: rpcSquads,
      })
    })

    it('handles RPC returning null squads gracefully', async () => {
      const user = { id: 'u1', email: 'u@test.com' }
      setupSSRMocks({
        user,
        rpcResult: { profile: { id: 'u1', username: 'test' }, squads: null },
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toEqual([])
    })

    it('falls back to parallel queries when RPC fails', async () => {
      const user = { id: 'u1', email: 'u@test.com' }
      const profileData = { id: 'u1', username: 'fallbackUser' }
      const membershipsData = [
        {
          squad_id: 's1',
          squads: { id: 's1', name: 'Fallback Squad', game: 'LoL', invite_code: 'xyz', owner_id: 'u1', total_members: 5, created_at: '2026-01-01' },
        },
      ]

      setupSSRMocks({
        user,
        rpcResult: null,
        rpcError: { message: 'RPC not deployed' },
        profileData,
        membershipsData,
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.user).toEqual({ id: 'u1', email: 'u@test.com' })
      expect(result.profile).toEqual(profileData)
      expect(result.squads).toEqual([
        {
          id: 's1', name: 'Fallback Squad', game: 'LoL', invite_code: 'xyz',
          owner_id: 'u1', total_members: 5, created_at: '2026-01-01', member_count: 5,
        },
      ])
    })

    it('fallback sets member_count to 1 when total_members is null', async () => {
      const user = { id: 'u1', email: 'u@test.com' }
      setupSSRMocks({
        user,
        rpcResult: null,
        rpcError: { message: 'fail' },
        profileData: null,
        membershipsData: [
          {
            squad_id: 's1',
            squads: { id: 's1', name: 'Squad', game: 'CS', invite_code: 'abc', owner_id: 'u1', total_members: null, created_at: '2026-01-01' },
          },
        ],
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads[0].member_count).toBe(1)
    })

    it('fallback returns empty squads when membershipsData is null', async () => {
      const user = { id: 'u1', email: 'u@test.com' }
      setupSSRMocks({
        user,
        rpcResult: null,
        rpcError: { message: 'fail' },
        profileData: null,
        membershipsData: null,
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toEqual([])
    })

    it('passes data() call with headers', async () => {
      const user = { id: 'u1', email: 'u@test.com' }
      setupSSRMocks({ user, rpcResult: { profile: null, squads: [] } })

      // Track calls to the data() wrapper
      mockData.mockImplementation((d: any, opts: any) => ({ __data: d, __opts: opts }))

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(mockData).toHaveBeenCalled()
      const call = mockData.mock.calls[mockData.mock.calls.length - 1]
      expect(call[1]).toHaveProperty('headers')
    })
  })

  // =========================================================================
  // clientLoader — client-side
  // =========================================================================
  describe('clientLoader', () => {
    it('redirects to /auth when user is not authenticated', async () => {
      mockClientGetUser.mockResolvedValue({ data: { user: null }, error: null })
      mockRedirect.mockImplementation((path: string) => {
        throw new Response(null, { status: 302, headers: { Location: path } })
      })

      await expect(
        clientLoader({ serverLoader: vi.fn() } as any)
      ).rejects.toThrow()
      expect(mockRedirect).toHaveBeenCalledWith('/auth')
    })

    it('redirects to /auth when getUser returns an error', async () => {
      mockClientGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') })
      mockRedirect.mockImplementation((path: string) => {
        throw new Response(null, { status: 302, headers: { Location: path } })
      })

      await expect(
        clientLoader({ serverLoader: vi.fn() } as any)
      ).rejects.toThrow()
      expect(mockRedirect).toHaveBeenCalledWith('/auth')
    })

    it('uses RPC data when get_layout_data succeeds on client', async () => {
      const user = { id: 'c1', email: 'client@test.com' }
      const rpcProfile = { id: 'c1', username: 'clientUser' }
      const rpcSquads = [{ id: 's1', name: 'Client Squad', member_count: 2 }]

      mockClientGetUser.mockResolvedValue({ data: { user }, error: null })
      mockClientRpc.mockResolvedValue({
        data: { profile: rpcProfile, squads: rpcSquads },
        error: null,
      })

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result).toEqual({
        user: { id: 'c1', email: 'client@test.com' },
        profile: rpcProfile,
        squads: rpcSquads,
      })
    })

    it('falls back to parallel queries when client RPC fails', async () => {
      const user = { id: 'c1', email: 'client@test.com' }
      mockClientGetUser.mockResolvedValue({ data: { user }, error: null })
      mockClientRpc.mockResolvedValue({ data: null, error: { message: 'not available' } })

      const profileChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'c1', username: 'fallback' } }),
          }),
        }),
      }
      const membershipsChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                squad_id: 's2',
                squads: { id: 's2', name: 'Fallback', game: 'CS', invite_code: 'def', owner_id: 'c1', total_members: 3, created_at: '2026-01-01' },
              },
            ],
          }),
        }),
      }
      mockClientFrom.mockImplementation((table: string) => {
        if (table === 'profiles') return profileChain
        if (table === 'squad_members') return membershipsChain
        return profileChain
      })

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.user).toEqual({ id: 'c1', email: 'client@test.com' })
      expect(result.profile).toEqual({ id: 'c1', username: 'fallback' })
      expect(result.squads[0].member_count).toBe(3)
    })

    it('client fallback defaults member_count to 1 when total_members is null', async () => {
      const user = { id: 'c1', email: 'c@test.com' }
      mockClientGetUser.mockResolvedValue({ data: { user }, error: null })
      mockClientRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      mockClientFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) }) }) }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ squad_id: 's1', squads: { id: 's1', name: 'S', game: 'G', invite_code: 'x', owner_id: 'c1', total_members: null, created_at: '2026-01-01' } }],
            }),
          }),
        }
      })

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.squads[0].member_count).toBe(1)
    })

    it('has hydrate set to true', () => {
      expect(clientLoader.hydrate).toBe(true)
    })
  })
})
