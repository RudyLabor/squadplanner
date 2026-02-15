import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockGetUser = vi.hoisted(() => vi.fn())
const mockCreateMinimalSSRClient = vi.hoisted(() => vi.fn())
const mockData = vi.hoisted(() => vi.fn((d: any) => d))

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/call-history', hash: '', search: '' }),
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
vi.mock('../../pages/CallHistory', () => ({ CallHistory: () => createElement('div', { 'data-testid': 'call-history' }, 'CallHistory') }))

import DefaultExport, { loader, meta, headers } from '../call-history'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/call-history') {
  return new Request(url)
}

function setupSSRMocks(overrides: { user?: any; error?: any }) {
  const supabaseHeaders = new Headers()
  mockCreateMinimalSSRClient.mockReturnValue({
    supabase: { auth: { getUser: vi.fn() } },
    headers: supabaseHeaders,
    getUser: mockGetUser.mockResolvedValue({
      data: { user: overrides.user ?? null },
      error: overrides.error ?? null,
    }),
  })
  return { supabaseHeaders }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/call-history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockImplementation((d: any) => d)
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, canonical, and og:url
    it('returns complete SEO metadata for call-history', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: "Historique d'appels - Squad Planner" })

      // 2 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/call-history' })

      // 3 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/call-history' })

      // 4 - exactly 3 entries
      expect(result).toHaveLength(3)

      // 5 - title contains Squad Planner
      expect(result[0].title).toContain('Squad Planner')

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
      const loaderHeaders = new Headers({ 'X-Test': 'val', 'Content-Type': 'text/html' })
      const result = headers({ loaderHeaders })

      // 1 - returns the same reference
      expect(result).toBe(loaderHeaders)

      // 2 - X-Test header preserved
      expect(result.get('X-Test')).toBe('val')

      // 3 - Content-Type preserved
      expect(result.get('Content-Type')).toBe('text/html')

      // 4 - is a Headers instance
      expect(result).toBeInstanceOf(Headers)

      // 5 - headers function is defined
      expect(typeof headers).toBe('function')

      // 6 - not a new object
      expect(result).not.toEqual(new Headers())
    })
  })

  // =========================================================================
  // loader
  // =========================================================================
  describe('loader', () => {
    // STRICT: verifies loader returns userId: null when getUser returns error
    it('returns userId: null when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - userId is null
      expect(result).toEqual({ userId: null })

      // 2 - data mock called
      expect(mockData).toHaveBeenCalled()

      // 3 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 4 - createMinimalSSRClient was called
      expect(mockCreateMinimalSSRClient).toHaveBeenCalled()

      // 5 - result has userId key
      expect(result).toHaveProperty('userId')

      // 6 - result.userId is exactly null
      expect(result.userId).toBeNull()
    })

    // STRICT: verifies loader returns userId when user is authenticated
    it('returns userId when user is authenticated', async () => {
      setupSSRMocks({ user: { id: 'user-123' } })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - userId matches
      expect(result).toEqual({ userId: 'user-123' })

      // 2 - userId is a string
      expect(typeof result.userId).toBe('string')

      // 3 - data mock was called with correct shape
      expect(mockData).toHaveBeenCalledWith({ userId: 'user-123' }, expect.any(Object))

      // 4 - getUser was called
      expect(mockGetUser).toHaveBeenCalled()

      // 5 - createMinimalSSRClient received request
      expect(mockCreateMinimalSSRClient).toHaveBeenCalled()

      // 6 - result has no extra keys
      expect(Object.keys(result)).toEqual(['userId'])
    })

    // STRICT: verifies loader returns userId: null when user is null (no error)
    it('returns userId: null when user is null', async () => {
      setupSSRMocks({ user: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)

      // 1 - userId is null
      expect(result.userId).toBeNull()

      // 2 - passes headers to data()
      expect(mockData).toHaveBeenCalledWith({ userId: null }, expect.objectContaining({ headers: expect.any(Headers) }))

      // 3 - shape matches
      expect(result).toEqual({ userId: null })

      // 4 - data called once
      expect(mockData).toHaveBeenCalledTimes(1)

      // 5 - getUser called once
      expect(mockGetUser).toHaveBeenCalledTimes(1)

      // 6 - SSR client created once
      expect(mockCreateMinimalSSRClient).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    // STRICT: verifies component renders with Suspense fallback (lazy component shows spinner in test)
    it('renders Suspense fallback with loading spinner', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - container exists
      expect(container).toBeTruthy()

      // 2 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 3 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 4 - Suspense fallback renders a spinner div with animate-spin class
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()

      // 5 - fallback wrapper has min-height class for centering
      const wrapper = container.querySelector('.min-h-\\[50vh\\]')
      expect(wrapper).toBeTruthy()

      // 6 - spinner has border classes for visual indicator
      expect(spinner!.className).toContain('border-2')
    })
  })
})
