import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockGetUser = vi.hoisted(() => vi.fn())
const mockCreateMinimalSSRClient = vi.hoisted(() => vi.fn())
const mockData = vi.hoisted(() => vi.fn((d: any) => d))
const mockClientGetUser = vi.hoisted(() => vi.fn())
const mockClientFrom = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/discover', hash: '', search: '' }),
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
    from: mockClientFrom,
  },
}))

vi.mock('../../lib/queryClient', () => ({ queryKeys: { discover: { publicSquads: () => ['discover', 'publicSquads'] } } }))
vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children, seeds }: any) =>
    createElement('div', { 'data-testid': 'route-wrapper', 'data-seeds': JSON.stringify(seeds) }, children),
}))
vi.mock('../../pages/Discover', () => ({ default: () => createElement('div', { 'data-testid': 'discover' }, 'Discover') }))

import DefaultExport, { loader, clientLoader, meta, headers } from '../discover'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/discover') {
  return new Request(url)
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setupSSRMocks(overrides: { user?: any; error?: any; publicSquads?: any }) {
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

  fromFn.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: overrides.publicSquads ?? [] }),
      }),
    }),
  }))

  return { supabaseHeaders, fromFn }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockImplementation((d: any) => d)
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, description, canonical, and og:url
    it('returns complete SEO metadata for discover page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Découvrir - Squad Planner' })

      // 2 - description meta tag
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()
      expect(desc!.content).toContain('squads')

      // 3 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/discover' })

      // 4 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/discover' })

      // 5 - exactly 4 entries
      expect(result).toHaveLength(4)

      // 6 - description mentions discovering
      expect(desc!.content).toContain('Découvre')
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    // STRICT: verifies headers returns loaderHeaders as-is
    it('returns loaderHeaders as-is', () => {
      const loaderHeaders = new Headers({ 'X-Custom': 'test' })
      const result = headers({ loaderHeaders })

      // 1 - returns the same reference
      expect(result).toBe(loaderHeaders)

      // 2 - preserves custom header
      expect(result.get('X-Custom')).toBe('test')

      // 3 - is a Headers instance
      expect(result).toBeInstanceOf(Headers)

      // 4 - headers function is defined
      expect(typeof headers).toBe('function')

      // 5 - not a new empty headers
      expect(result).not.toEqual(new Headers())

      // 6 - same instance identity
      expect(result === loaderHeaders).toBe(true)
    })
  })

  // =========================================================================
  // loader
  // =========================================================================
  describe('loader', () => {
    // STRICT: verifies loader returns empty squads when user has error
    it('returns empty squads when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - squads is empty array
      expect(result).toEqual({ squads: [] })

      // 2 - data mock called
      expect(mockData).toHaveBeenCalled()

      // 3 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 4 - has squads key
      expect(result).toHaveProperty('squads')

      // 5 - squads is an array
      expect(Array.isArray(result.squads)).toBe(true)

      // 6 - squads length is 0
      expect(result.squads).toHaveLength(0)
    })

    // STRICT: verifies loader fetches public squads for authenticated users
    it('returns publicSquads when user is authenticated', async () => {
      const squads = [
        { id: 's1', name: 'Alpha', game: 'Valorant', created_at: '2026-01-01' },
        { id: 's2', name: 'Beta', game: 'LoL', created_at: '2026-01-02' },
      ]
      setupSSRMocks({ user: { id: 'u1' }, publicSquads: squads })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - has publicSquads
      expect(result).toHaveProperty('publicSquads')

      // 2 - correct number of squads
      expect(result.publicSquads).toHaveLength(2)

      // 3 - first squad name
      expect(result.publicSquads[0].name).toBe('Alpha')

      // 4 - second squad game
      expect(result.publicSquads[1].game).toBe('LoL')

      // 5 - data mock called
      expect(mockData).toHaveBeenCalled()

      // 6 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()
    })

    // STRICT: verifies loader returns empty publicSquads when supabase returns null
    it('defaults to empty array when supabase returns null squads', async () => {
      setupSSRMocks({ user: { id: 'u1' }, publicSquads: null })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - has publicSquads
      expect(result).toHaveProperty('publicSquads')

      // 2 - publicSquads is empty array (fallback)
      expect(result.publicSquads).toEqual([])

      // 3 - data was called
      expect(mockData).toHaveBeenCalled()

      // 4 - is an array
      expect(Array.isArray(result.publicSquads)).toBe(true)

      // 5 - length is 0
      expect(result.publicSquads).toHaveLength(0)

      // 6 - createMinimalSSRClient was called
      expect(mockCreateMinimalSSRClient).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // clientLoader
  // =========================================================================
  describe('clientLoader', () => {
    // STRICT: verifies clientLoader returns empty publicSquads when user is null
    it('returns empty publicSquads when user is null', async () => {
      mockClientGetUser.mockResolvedValue({ data: { user: null } })
      const result = await clientLoader({ serverLoader: vi.fn() } as any)

      // 1 - has publicSquads
      expect(result).toHaveProperty('publicSquads')

      // 2 - publicSquads is empty
      expect(result.publicSquads).toEqual([])

      // 3 - is an array
      expect(Array.isArray(result.publicSquads)).toBe(true)

      // 4 - clientGetUser was called
      expect(mockClientGetUser).toHaveBeenCalled()

      // 5 - length is 0
      expect(result.publicSquads).toHaveLength(0)

      // 6 - hydrate is true
      expect(clientLoader.hydrate).toBe(true)
    })

    // STRICT: verifies clientLoader fetches squads when user exists
    it('fetches public squads on client when user exists', async () => {
      mockClientGetUser.mockResolvedValue({ data: { user: { id: 'c1' } } })
      mockClientFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 's1', name: 'ClientSquad', game: 'CS', created_at: '2026-01-01' }],
            }),
          }),
        }),
      }))

      const result = await clientLoader({ serverLoader: vi.fn() } as any)

      // 1 - has publicSquads
      expect(result).toHaveProperty('publicSquads')

      // 2 - one squad returned
      expect(result.publicSquads).toHaveLength(1)

      // 3 - squad name
      expect(result.publicSquads[0].name).toBe('ClientSquad')

      // 4 - squad id
      expect(result.publicSquads[0].id).toBe('s1')

      // 5 - clientFrom was called
      expect(mockClientFrom).toHaveBeenCalledWith('squads')

      // 6 - clientGetUser was called
      expect(mockClientGetUser).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    // STRICT: verifies component renders inside ClientRouteWrapper with correct seeds
    it('renders inside ClientRouteWrapper with correct seeds', () => {
      const qc = makeQC()
      const squads = [{ id: 's1', name: 'TestSquad', game: 'Val', created_at: '2026-01-01' }]
      const { container } = render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData: { publicSquads: squads } } as any)
        )
      )

      // 1 - route-wrapper present
      expect(screen.getByTestId('route-wrapper')).toBeTruthy()

      // 2 - seeds contain correct key
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds[0].key).toEqual(['discover', 'publicSquads'])

      // 3 - seeds data matches
      expect(seeds[0].data).toEqual(squads)

      // 4 - Suspense fallback renders spinner (lazy component not resolved in test)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()

      // 5 - seeds have exactly one entry
      expect(seeds).toHaveLength(1)

      // 6 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()
    })

    // STRICT: verifies component renders without crashing with empty publicSquads
    it('renders without crashing with empty publicSquads', () => {
      const qc = makeQC()
      const { container } = render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData: { publicSquads: [] } } as any)
        )
      )

      // 1 - container exists
      expect(container).toBeTruthy()

      // 2 - route-wrapper present
      expect(screen.getByTestId('route-wrapper')).toBeTruthy()

      // 3 - seeds have empty data
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds[0].data).toEqual([])

      // 4 - Suspense fallback renders spinner
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()

      // 5 - only one route-wrapper
      expect(screen.getAllByTestId('route-wrapper')).toHaveLength(1)

      // 6 - seeds key is correct
      expect(seeds[0].key).toEqual(['discover', 'publicSquads'])
    })
  })
})
