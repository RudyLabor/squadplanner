import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockGetUser = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockCreateMinimalSSRClient = vi.hoisted(() => vi.fn())
const mockData = vi.hoisted(() => vi.fn((d: any) => d))

const mockClientGetSession = vi.hoisted(() => vi.fn())
const mockClientRpc = vi.hoisted(() => vi.fn())
const mockClientFrom = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  redirect: vi.fn(),
  data: mockData,
  Await: ({ children, resolve }: any) => {
    // Resolve promises synchronously for testing; handle arrays and resolved values
    if (typeof children === 'function') return children(Array.isArray(resolve) ? resolve : resolve ?? [])
    return children
  },
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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
    auth: { getSession: mockClientGetSession },
    rpc: mockClientRpc,
    from: mockClientFrom,
  },
}))

vi.mock('../../lib/queryClient', () => ({
  queryClient: { getQueryData: vi.fn().mockReturnValue(undefined) },
  queryKeys: {
    squads: { list: () => ['squads', 'list'] },
    sessions: { upcoming: () => ['sessions', 'upcoming'] },
    profile: { current: () => ['profile', 'current'] },
  },
}))

vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children, seeds }: any) =>
    createElement('div', { 'data-testid': 'route-wrapper', 'data-seeds': JSON.stringify(seeds) }, children),
}))

vi.mock('../../components/DeferredSeed', () => ({
  DeferredSeed: ({ children, queryKey, data }: any) =>
    createElement('div', { 'data-testid': 'deferred-seed', 'data-query-key': JSON.stringify(queryKey) }, children),
}))

vi.mock('../../pages/Home', () => ({
  default: ({ loaderData }: any) =>
    createElement('div', { 'data-testid': 'home-page' }, JSON.stringify(loaderData)),
}))

import DefaultExport, { loader, clientLoader, meta, headers } from '../home'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/home') {
  return new Request(url)
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setupSSRMocks(overrides: {
  user?: any
  error?: any
  rpcResult?: any
  sessionsData?: any
  rsvpsData?: any
}) {
  const supabaseHeaders = new Headers()
  const fromFn = vi.fn()

  mockCreateMinimalSSRClient.mockReturnValue({
    supabase: {
      auth: { getUser: vi.fn() },
      rpc: mockRpc.mockResolvedValue({
        data: overrides.rpcResult ?? null,
        error: null,
      }),
      from: fromFn,
    },
    headers: supabaseHeaders,
    getUser: mockGetUser.mockResolvedValue({
      data: { user: overrides.user ?? null },
      error: overrides.error ?? null,
    }),
  })

  // Build chained query mocks per table
  fromFn.mockImplementation((table: string) => {
    if (table === 'sessions') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: overrides.sessionsData ?? null }),
              }),
            }),
          }),
        }),
      }
    }
    if (table === 'session_rsvps') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: overrides.rsvpsData ?? null }),
        }),
      }
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
  })

  return { supabaseHeaders, fromFn }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockImplementation((d: any) => d)
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    it('returns correct title', () => {
      const result = meta()
      expect(result[0]).toEqual({ title: 'Accueil - Squad Planner' })
    })

    it('returns description meta tag', () => {
      const result = meta()
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()
      expect(desc!.content).toContain('Squad Planner')
    })

    it('returns canonical link', () => {
      const result = meta()
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/home' })
    })

    it('returns og:url', () => {
      const result = meta()
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/home' })
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    it('returns loaderHeaders as-is (passthrough)', () => {
      const loaderHeaders = new Headers({ 'X-Custom': 'value' })
      const result = headers({ loaderHeaders })
      expect(result).toBe(loaderHeaders)
    })
  })

  // =========================================================================
  // loader
  // =========================================================================
  describe('loader', () => {
    it('returns empty data when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ profile: null, squads: [], upcomingSessions: [] })
    })

    it('returns empty data when user is null', async () => {
      setupSSRMocks({ user: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ profile: null, squads: [], upcomingSessions: [] })
    })

    it('passes headers to data() response when no user', async () => {
      setupSSRMocks({ user: null })
      mockData.mockImplementation((d: any, opts: any) => ({ __data: d, __opts: opts }))
      await loader({ request: makeRequest(), params: {}, context: {} } as any)
      const lastCall = mockData.mock.calls[mockData.mock.calls.length - 1]
      expect(lastCall[1]).toHaveProperty('headers')
    })

    it('uses RPC data for profile and squads', async () => {
      const user = { id: 'u1', email: 'u@test.com' }
      const profile = { id: 'u1', username: 'tester' }
      const squads = [{ id: 's1', name: 'Squad', game: 'V', invite_code: 'a', owner_id: 'u1', total_members: 3, created_at: '2026-01-01', member_count: 3 }]

      setupSSRMocks({
        user,
        rpcResult: { profile, squads },
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.profile).toEqual(profile)
      expect(result.squads).toEqual(squads)
    })

    it('defaults profile to null when RPC returns null profile', async () => {
      setupSSRMocks({
        user: { id: 'u1', email: 'u@t.com' },
        rpcResult: { profile: null, squads: [] },
      })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.profile).toBeNull()
    })

    it('defaults squads to [] when RPC returns null squads', async () => {
      setupSSRMocks({
        user: { id: 'u1', email: 'u@t.com' },
        rpcResult: { profile: null, squads: null },
      })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toEqual([])
    })

    it('defaults profile and squads to null/[] when RPC returns null', async () => {
      setupSSRMocks({
        user: { id: 'u1', email: 'u@t.com' },
        rpcResult: null,
      })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.profile).toBeNull()
      expect(result.squads).toEqual([])
    })

    it('returns upcomingSessions as a promise (deferred for streaming)', async () => {
      const squads = [{ id: 's1', name: 'S', game: 'G', invite_code: 'x', owner_id: 'u1', total_members: 1, created_at: '2026-01-01', member_count: 1 }]
      const sessions = [{ id: 'sess1', squad_id: 's1', title: 'Game', scheduled_at: '2026-02-20T18:00:00Z' }]
      const rsvps = [{ session_id: 'sess1', user_id: 'u1', response: 'present' }]

      setupSSRMocks({
        user: { id: 'u1' },
        rpcResult: { profile: null, squads },
        sessionsData: sessions,
        rsvpsData: rsvps,
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      // upcomingSessions is a promise (not awaited in loader) for streaming
      expect(result.upcomingSessions).toBeDefined()
      // Resolve the promise to verify data
      const resolved = await result.upcomingSessions
      expect(resolved).toHaveLength(1)
      expect(resolved[0].my_rsvp).toBe('present')
      expect(resolved[0].rsvp_counts).toEqual({ present: 1, absent: 0, maybe: 0 })
    })

    it('returns empty upcomingSessions promise when no squad IDs', async () => {
      setupSSRMocks({
        user: { id: 'u1' },
        rpcResult: { profile: null, squads: [] },
      })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      const resolved = await result.upcomingSessions
      expect(resolved).toEqual([])
    })

    it('handles null sessionsData in fetchUpcomingSessions', async () => {
      const squads = [{ id: 's1', name: 'S', game: 'G', invite_code: 'x', owner_id: 'u1', total_members: 1, created_at: '2026-01-01', member_count: 1 }]
      setupSSRMocks({
        user: { id: 'u1' },
        rpcResult: { profile: null, squads },
        sessionsData: null,
      })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      const resolved = await result.upcomingSessions
      expect(resolved).toEqual([])
    })

    it('handles empty sessionsData in fetchUpcomingSessions', async () => {
      const squads = [{ id: 's1', name: 'S', game: 'G', invite_code: 'x', owner_id: 'u1', total_members: 1, created_at: '2026-01-01', member_count: 1 }]
      setupSSRMocks({
        user: { id: 'u1' },
        rpcResult: { profile: null, squads },
        sessionsData: [],
      })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      const resolved = await result.upcomingSessions
      expect(resolved).toEqual([])
    })

    it('computes RSVP counts correctly with multiple sessions', async () => {
      const squads = [{ id: 's1', name: 'S', game: 'G', invite_code: 'x', owner_id: 'u1', total_members: 2, created_at: '2026-01-01', member_count: 2 }]
      const sessions = [
        { id: 'sess1', squad_id: 's1', title: 'S1', scheduled_at: '2026-02-20T18:00:00Z' },
        { id: 'sess2', squad_id: 's1', title: 'S2', scheduled_at: '2026-02-21T18:00:00Z' },
      ]
      const rsvps = [
        { session_id: 'sess1', user_id: 'u1', response: 'present' },
        { session_id: 'sess1', user_id: 'u2', response: 'maybe' },
        { session_id: 'sess2', user_id: 'u2', response: 'absent' },
      ]

      setupSSRMocks({
        user: { id: 'u1' },
        rpcResult: { profile: null, squads },
        sessionsData: sessions,
        rsvpsData: rsvps,
      })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      const resolved = await result.upcomingSessions
      expect(resolved[0].rsvp_counts).toEqual({ present: 1, absent: 0, maybe: 1 })
      expect(resolved[0].my_rsvp).toBe('present')
      expect(resolved[1].rsvp_counts).toEqual({ present: 0, absent: 1, maybe: 0 })
      expect(resolved[1].my_rsvp).toBeNull()
    })
  })

  // =========================================================================
  // clientLoader
  // =========================================================================
  describe('clientLoader', () => {
    it('returns empty data when user is null', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: null } })
      const serverData = { profile: null, squads: [], upcomingSessions: [] }
      const result = await clientLoader({ serverLoader: vi.fn().mockResolvedValue(serverData) } as any)
      expect(result).toEqual({ profile: null, squads: [], upcomingSessions: [] })
    })

    it('uses RPC for profile and squads, then fetches sessions', async () => {
      const user = { id: 'c1', email: 'c@t.com' }
      const profile = { id: 'c1', username: 'cl' }
      const squads = [{ id: 's1', name: 'CS', game: 'G', invite_code: 'a', owner_id: 'c1', total_members: 1, created_at: '2026-01-01', member_count: 1 }]

      mockClientGetSession.mockResolvedValue({ data: { session: { user } } })
      mockClientRpc.mockResolvedValue({ data: { profile, squads } })

      // fetchUpcomingSessions uses from()
      mockClientFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [] }),
                  }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      })

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.profile).toEqual(profile)
      expect(result.squads).toEqual(squads)
      expect(result.upcomingSessions).toEqual([])
    })

    it('defaults profile and squads when RPC returns null', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: { user: { id: 'c1' } } } })
      mockClientRpc.mockResolvedValue({ data: null })

      mockClientFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
        }),
      }))

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.profile).toBeNull()
      expect(result.squads).toEqual([])
    })

    it('has hydrate set to true', () => {
      expect(clientLoader.hydrate).toBe(true)
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders Home component inside ClientRouteWrapper', () => {
      const qc = makeQC()
      const loaderData = { profile: null, squads: [], upcomingSessions: [] }
      render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      // Home is not lazy-loaded, so it renders directly
      expect(screen.getByTestId('home-page')).toBeTruthy()
    })

    it('wraps content in ClientRouteWrapper with squads seed', () => {
      const qc = makeQC()
      const squads = [{ id: 's1', name: 'MySquad' }]
      const loaderData = { profile: null, squads, upcomingSessions: [] }
      render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds).toHaveLength(1)
      expect(seeds[0].key).toEqual(['squads', 'list'])
      expect(seeds[0].data).toEqual(squads)
    })

    it('renders DeferredSeed with sessions query key when Await resolves', () => {
      const qc = makeQC()
      const sessions = [{ id: 'sess1', title: 'Game Night' }]
      const loaderData = { profile: null, squads: [], upcomingSessions: sessions }
      render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const deferred = screen.getByTestId('deferred-seed')
      expect(deferred).toBeTruthy()
      const queryKey = JSON.parse(deferred.getAttribute('data-query-key')!)
      expect(queryKey).toEqual(['sessions', 'upcoming'])
    })

    it('passes resolved sessions to Home component via Await', () => {
      const qc = makeQC()
      const sessions = [{ id: 'sess1', title: 'Session Alpha' }]
      const loaderData = { profile: null, squads: [], upcomingSessions: sessions }
      render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const homePage = screen.getByTestId('home-page')
      expect(homePage.textContent).toContain('Session Alpha')
    })

    it('renders with null profile gracefully', () => {
      const qc = makeQC()
      const loaderData = { profile: null, squads: [], upcomingSessions: [] }
      const { container } = render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      expect(container).toBeTruthy()
    })
  })
})
