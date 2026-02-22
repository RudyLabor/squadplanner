import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockGetUser = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockCreateMinimalSSRClient = vi.hoisted(() => vi.fn())
const mockData = vi.hoisted(() => vi.fn((d: any) => d))

const mockClientGetSession = vi.hoisted(() => vi.fn())
const mockClientFrom = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/party', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  redirect: vi.fn(),
  data: mockData,
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
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock('../../lib/supabase-minimal-ssr', () => ({
  createMinimalSSRClient: mockCreateMinimalSSRClient,
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: mockClientGetSession },
    from: mockClientFrom,
  },
}))

vi.mock('../../lib/queryClient', () => ({
  queryClient: { getQueryData: vi.fn().mockReturnValue(undefined) },
  queryKeys: {
    squads: { list: () => ['squads', 'list'] },
  },
}))

vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children, seeds }: any) =>
    createElement(
      'div',
      { 'data-testid': 'route-wrapper', 'data-seeds': JSON.stringify(seeds) },
      children
    ),
}))

vi.mock('../../pages/Party', () => ({
  Party: () => createElement('div', { 'data-testid': 'party-page' }, 'Party'),
}))

import DefaultExport, { loader, clientLoader, meta, headers } from '../party'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/party') {
  return new Request(url)
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setupSSRMocks(overrides: { user?: any; error?: any; membershipsData?: any }) {
  const supabaseHeaders = new Headers()
  const fromFn = vi.fn()

  mockCreateMinimalSSRClient.mockReturnValue({
    supabase: {
      auth: { getUser: vi.fn() },
      from: fromFn,
    },
    headers: supabaseHeaders,
    getUser: mockGetUser.mockResolvedValue({
      data: { user: overrides.user ?? null },
      error: overrides.error ?? null,
    }),
  })

  fromFn.mockImplementation((table: string) => {
    if (table === 'squad_members') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: overrides.membershipsData ?? null }),
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
describe('routes/party', () => {
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
      expect(result[0]).toEqual({ title: 'Party - Squad Planner' })
    })

    it('returns description meta tag', () => {
      const result = meta()
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()
      expect(desc!.content).toContain('chat vocal')
    })

    it('returns canonical link', () => {
      const result = meta()
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://squadplanner.fr/party',
      })
    })

    it('returns og:url', () => {
      const result = meta()
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/party' })
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    it('returns loaderHeaders as-is', () => {
      const loaderHeaders = new Headers({ 'X-Test': 'val' })
      const result = headers({ loaderHeaders })
      expect(result).toBe(loaderHeaders)
    })
  })

  // =========================================================================
  // loader
  // =========================================================================
  describe('loader', () => {
    it('returns empty squads when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ squads: [] })
    })

    it('returns empty squads when user is null', async () => {
      setupSSRMocks({ user: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ squads: [] })
    })

    it('maps memberships to squads with member_count from total_members', async () => {
      const memberships = [
        {
          squad_id: 's1',
          squads: { id: 's1', name: 'Alpha', game: 'Valorant', total_members: 5 },
        },
        {
          squad_id: 's2',
          squads: { id: 's2', name: 'Beta', game: 'LoL', total_members: 3 },
        },
      ]
      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toHaveLength(2)
      expect(result.squads[0].member_count).toBe(5)
      expect(result.squads[0].name).toBe('Alpha')
      expect(result.squads[1].member_count).toBe(3)
    })

    it('defaults member_count to 1 when total_members is null', async () => {
      const memberships = [
        {
          squad_id: 's1',
          squads: { id: 's1', name: 'S', game: 'G', total_members: null },
        },
      ]
      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads[0].member_count).toBe(1)
    })

    it('defaults member_count to 1 when total_members is undefined', async () => {
      const memberships = [
        {
          squad_id: 's1',
          squads: { id: 's1', name: 'S', game: 'G' },
        },
      ]
      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads[0].member_count).toBe(1)
    })

    it('returns empty squads when memberships is null', async () => {
      setupSSRMocks({ user: { id: 'u1' }, membershipsData: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toEqual([])
    })

    it('returns empty squads when memberships is empty', async () => {
      setupSSRMocks({ user: { id: 'u1' }, membershipsData: [] })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toEqual([])
    })

    it('passes headers to data() response', async () => {
      setupSSRMocks({ user: null })
      mockData.mockImplementation((d: any, opts: any) => ({ __data: d, __opts: opts }))
      await loader({ request: makeRequest(), params: {}, context: {} } as any)
      const lastCall = mockData.mock.calls[mockData.mock.calls.length - 1]
      expect(lastCall[1]).toHaveProperty('headers')
    })
  })

  // =========================================================================
  // clientLoader
  // =========================================================================
  describe('clientLoader', () => {
    it('returns empty squads when user is null', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: null } })
      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result).toEqual({ squads: [] })
    })

    it('maps memberships to squads on client', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: { user: { id: 'c1' } } } })
      mockClientFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { squad_id: 's1', squads: { id: 's1', name: 'CS', game: 'G', total_members: 4 } },
            ],
          }),
        }),
      }))

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.squads).toHaveLength(1)
      expect(result.squads[0].member_count).toBe(4)
    })

    it('defaults member_count to 1 on client when total_members is null', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: { user: { id: 'c1' } } } })
      mockClientFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { squad_id: 's1', squads: { id: 's1', name: 'S', game: 'G', total_members: null } },
            ],
          }),
        }),
      }))

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.squads[0].member_count).toBe(1)
    })

    it('has hydrate set to true', () => {
      expect(clientLoader.hydrate).toBe(true)
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders inside ClientRouteWrapper (lazy component)', () => {
      const qc = makeQC()
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData: { squads: [] } } as any)
        )
      )
      expect(screen.getByTestId('route-wrapper')).toBeTruthy()
    })

    it('wraps content with correct squads list seed', () => {
      const qc = makeQC()
      const squads = [{ id: 's1', name: 'Squad1', member_count: 3 }]
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData: { squads } } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds).toHaveLength(1)
      expect(seeds[0].key).toEqual(['squads', 'list'])
      expect(seeds[0].data).toEqual(squads)
    })

    it('renders without crashing with empty squads', () => {
      const qc = makeQC()
      const { container } = render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData: { squads: [] } } as any)
        )
      )
      expect(container).toBeTruthy()
    })
  })
})
