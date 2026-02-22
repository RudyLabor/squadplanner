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
const mockClientGetSession = vi.hoisted(() => vi.fn())
const mockClientFrom = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/settings', hash: '', search: '' }),
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
  queryKeys: { profile: { current: () => ['profile', 'current'] } },
}))
vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children, seeds }: any) =>
    createElement(
      'div',
      { 'data-testid': 'route-wrapper', 'data-seeds': JSON.stringify(seeds) },
      children
    ),
}))
vi.mock('../../pages/Settings', () => ({
  Settings: () => createElement('div', { 'data-testid': 'settings' }, 'Settings'),
}))

import DefaultExport, { loader, clientLoader, meta, headers } from '../settings'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/settings') {
  return new Request(url)
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setupSSRMocks(overrides: { user?: any; error?: any; profile?: any }) {
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
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: overrides.profile ?? null }),
      }),
    }),
  }))

  return { supabaseHeaders, fromFn }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockImplementation((d: any) => d)
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, description, canonical, and og:url
    it('returns complete SEO metadata for the settings page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Paramètres - Squad Planner' })

      // 2 - description meta tag
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()
      expect(desc!.content).toContain('compte Squad Planner')

      // 3 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://squadplanner.fr/settings',
      })

      // 4 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/settings' })

      // 5 - exactly 4 entries
      expect(result).toHaveLength(4)

      // 6 - description mentions notifications/theme
      expect(desc!.content).toContain('notifications')
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

      // 5 - same instance identity
      expect(result === loaderHeaders).toBe(true)

      // 6 - not empty
      expect(result.get('X-Custom')).not.toBeNull()
    })
  })

  // =========================================================================
  // loader
  // =========================================================================
  describe('loader', () => {
    // STRICT: verifies loader returns profile: null when getUser returns error
    it('returns profile: null when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - profile is null
      expect(result).toEqual({ profile: null })

      // 2 - data mock called
      expect(mockData).toHaveBeenCalled()

      // 3 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 4 - has profile key
      expect(result).toHaveProperty('profile')

      // 5 - result.profile is exactly null
      expect(result.profile).toBeNull()

      // 6 - SSR client was created
      expect(mockCreateMinimalSSRClient).toHaveBeenCalled()
    })

    // STRICT: verifies loader returns profile data when user is authenticated
    it('returns profile when user is authenticated', async () => {
      const profileData = { id: 'u1', username: 'gamer42', theme: 'dark', notifications: true }
      setupSSRMocks({ user: { id: 'u1' }, profile: profileData })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - profile matches
      expect(result.profile).toEqual(profileData)

      // 2 - profile has username
      expect(result.profile.username).toBe('gamer42')

      // 3 - profile has theme
      expect(result.profile.theme).toBe('dark')

      // 4 - data mock called with profile
      expect(mockData).toHaveBeenCalledWith({ profile: profileData }, expect.any(Object))

      // 5 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 6 - SSR client was created
      expect(mockCreateMinimalSSRClient).toHaveBeenCalled()
    })

    // STRICT: verifies loader returns null profile when user is null
    it('returns profile: null when user is null', async () => {
      setupSSRMocks({ user: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - profile is null
      expect(result.profile).toBeNull()

      // 2 - shape matches
      expect(result).toEqual({ profile: null })

      // 3 - data called once
      expect(mockData).toHaveBeenCalledTimes(1)

      // 4 - getUser called once
      expect(mockGetUser).toHaveBeenCalledTimes(1)

      // 5 - passes headers to data()
      expect(mockData).toHaveBeenCalledWith(
        { profile: null },
        expect.objectContaining({ headers: expect.any(Headers) })
      )

      // 6 - SSR client created once
      expect(mockCreateMinimalSSRClient).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // clientLoader
  // =========================================================================
  describe('clientLoader', () => {
    // STRICT: verifies clientLoader returns null profile when user is null
    it('returns profile: null when user is null', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: null } })
      const result = await clientLoader({ serverLoader: vi.fn() } as any)

      // 1 - has profile
      expect(result).toHaveProperty('profile')

      // 2 - profile is null
      expect(result.profile).toBeNull()

      // 3 - clientGetUser was called
      expect(mockClientGetSession).toHaveBeenCalled()

      // 4 - shape matches
      expect(result).toEqual({ profile: null })

      // 5 - hydrate is true
      expect(clientLoader.hydrate).toBe(true)

      // 6 - clientFrom was NOT called (no user)
      // clientFrom was NOT called (no user)
      expect(mockClientFrom).not.toHaveBeenCalled()
    })

    // STRICT: verifies clientLoader fetches profile when user exists
    it('fetches profile on client when user exists', async () => {
      const profileData = { id: 'c1', username: 'clientplayer', theme: 'light' }
      mockClientGetSession.mockResolvedValue({ data: { session: { user: { id: 'c1' } } } })
      mockClientFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: profileData }),
          }),
        }),
      }))

      const result = await clientLoader({ serverLoader: vi.fn() } as any)

      // 1 - has profile
      expect(result).toHaveProperty('profile')

      // 2 - profile matches
      expect(result.profile).toEqual(profileData)

      // 3 - profile username
      expect(result.profile.username).toBe('clientplayer')

      // 4 - clientFrom was called with 'profiles'
      expect(mockClientFrom).toHaveBeenCalledWith('profiles')

      // 5 - clientGetUser was called
      expect(mockClientGetSession).toHaveBeenCalled()

      // 6 - profile id matches user id
      expect(result.profile.id).toBe('c1')
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    // STRICT: verifies component renders inside ClientRouteWrapper with correct seeds
    it('renders inside ClientRouteWrapper with correct seeds', () => {
      const qc = makeQC()
      const profile = { id: 'u1', username: 'tester', theme: 'dark' }
      const { container } = render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData: { profile } } as any)
        )
      )

      // 1 - route-wrapper present
      expect(screen.getByTestId('route-wrapper')).toBeTruthy()

      // 2 - seeds contain correct key
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds[0].key).toEqual(['profile', 'current'])

      // 3 - seeds data matches
      expect(seeds[0].data).toEqual(profile)

      // 4 - Suspense fallback renders spinner (lazy component not resolved in test)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()

      // 5 - seeds have exactly one entry
      expect(seeds).toHaveLength(1)

      // 6 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()
    })

    // STRICT: verifies component renders without crashing with null profile
    it('renders without crashing with null profile', () => {
      const qc = makeQC()
      const { container } = render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData: { profile: null } } as any)
        )
      )

      // 1 - container exists
      expect(container).toBeTruthy()

      // 2 - route-wrapper present
      expect(screen.getByTestId('route-wrapper')).toBeTruthy()

      // 3 - seeds have null data
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds[0].data).toBeNull()

      // 4 - Suspense fallback renders spinner
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()

      // 5 - only one route-wrapper
      expect(screen.getAllByTestId('route-wrapper')).toHaveLength(1)

      // 6 - seeds key is correct
      expect(seeds[0].key).toEqual(['profile', 'current'])
    })
  })
})
