import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockGetUser = vi.hoisted(() => vi.fn())
const mockCreateMinimalSSRClient = vi.hoisted(() => vi.fn())
const mockData = vi.hoisted(() => vi.fn((d: any) => d))
const mockRedirect = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/onboarding', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  redirect: mockRedirect,
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
vi.mock('../../pages/Onboarding', () => ({ Onboarding: () => createElement('div', { 'data-testid': 'onboarding' }, 'Onboarding') }))

import DefaultExport, { loader, meta, headers } from '../onboarding'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/onboarding') {
  return new Request(url)
}

function setupSSRMocks(overrides: { user?: any; error?: any; squadCount?: number }) {
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
      eq: vi.fn().mockResolvedValue({ count: overrides.squadCount ?? 0 }),
    }),
  }))

  return { supabaseHeaders, fromFn }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockImplementation((d: any) => d)
    mockRedirect.mockImplementation((url: string) => {
      throw new Response(null, { status: 302, headers: { Location: url } })
    })
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, canonical, and og:url for onboarding
    it('returns complete SEO metadata for onboarding page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Bienvenue - Squad Planner' })

      // 2 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/onboarding' })

      // 3 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/onboarding' })

      // 4 - exactly 3 entries
      expect(result).toHaveLength(3)

      // 5 - title contains "Bienvenue"
      expect(result[0].title).toContain('Bienvenue')

      // 6 - all entries are objects
      result.forEach((entry: any) => expect(typeof entry).toBe('object'))
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    // STRICT: verifies headers returns loaderHeaders as-is
    it('returns loaderHeaders as-is', () => {
      const loaderHeaders = new Headers({ 'X-Test': 'val' })
      const result = headers({ loaderHeaders })

      // 1 - returns the same reference
      expect(result).toBe(loaderHeaders)

      // 2 - preserves X-Test
      expect(result.get('X-Test')).toBe('val')

      // 3 - is a Headers instance
      expect(result).toBeInstanceOf(Headers)

      // 4 - headers function is defined
      expect(typeof headers).toBe('function')

      // 5 - same instance identity
      expect(result === loaderHeaders).toBe(true)

      // 6 - not empty
      expect(result.get('X-Test')).not.toBeNull()
    })
  })

  // =========================================================================
  // loader
  // =========================================================================
  describe('loader', () => {
    // STRICT: verifies loader returns userId: null when getUser has error
    it('returns userId: null when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - userId is null
      expect(result).toEqual({ userId: null })

      // 2 - data mock called
      expect(mockData).toHaveBeenCalled()

      // 3 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 4 - has userId key
      expect(result).toHaveProperty('userId')

      // 5 - result.userId is exactly null
      expect(result.userId).toBeNull()

      // 6 - redirect was NOT called (user has error, no redirect)
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    // STRICT: verifies loader returns userId when user has no squads
    it('returns userId when user has no squads', async () => {
      setupSSRMocks({ user: { id: 'user-new' }, squadCount: 0 })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - userId matches
      expect(result).toEqual({ userId: 'user-new' })

      // 2 - userId is a string
      expect(typeof result.userId).toBe('string')

      // 3 - data mock called with userId
      expect(mockData).toHaveBeenCalledWith({ userId: 'user-new' }, expect.any(Object))

      // 4 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 5 - redirect was NOT called (no squads, stays on onboarding)
      expect(mockRedirect).not.toHaveBeenCalled()

      // 6 - SSR client was created
      expect(mockCreateMinimalSSRClient).toHaveBeenCalled()
    })

    // STRICT: verifies loader throws redirect to /home when user already has squads
    it('throws redirect to /home when user already has squads', async () => {
      setupSSRMocks({ user: { id: 'user-existing' }, squadCount: 3 })

      // Should throw because redirect is implemented as throwing a Response
      await expect(
        loader({ request: makeRequest(), params: {}, context: {} } as any)
      ).rejects.toThrow()

      // 1 - redirect was called
      expect(mockRedirect).toHaveBeenCalled()

      // 2 - redirect was called with /home
      expect(mockRedirect).toHaveBeenCalledWith('/home', expect.any(Object))

      // 3 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 4 - SSR client was created
      expect(mockCreateMinimalSSRClient).toHaveBeenCalled()

      // 5 - redirect was called exactly once
      expect(mockRedirect).toHaveBeenCalledTimes(1)

      // 6 - redirect headers were passed
      expect(mockRedirect).toHaveBeenCalledWith('/home', expect.objectContaining({ headers: expect.any(Headers) }))
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    // STRICT: verifies the component renders the Onboarding page component
    it('renders the Onboarding page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - Onboarding testid present
      expect(screen.getByTestId('onboarding')).toBeTruthy()

      // 2 - Onboarding text content
      expect(screen.getByTestId('onboarding').textContent).toBe('Onboarding')

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 5 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 6 - only one onboarding element
      expect(screen.getAllByTestId('onboarding')).toHaveLength(1)
    })
  })
})
