import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockUseAuthStore = vi.hoisted(() =>
  Object.assign(vi.fn().mockReturnValue({ user: null, isInitialized: true }), {
    getState: vi.fn().mockReturnValue({ user: null }),
  })
)
const mockUseSearchParams = vi.hoisted(() =>
  vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()])
)

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: mockUseSearchParams,
  useLoaderData: vi.fn().mockReturnValue({}),
  Navigate: ({ to }: any) => createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
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

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: mockUseAuthStore,
}))
vi.mock('../../hooks', () => ({
  useAuthStore: mockUseAuthStore,
}))
vi.mock('../../lib/i18n', () => ({ useT: () => (k: string) => k, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../components/landing/FaqSection', () => ({ faqs: [{ q: 'Question?', a: 'Answer.' }] }))
vi.mock('../../pages/Landing', () => ({ default: () => createElement('div', { 'data-testid': 'landing' }, 'Landing') }))

import DefaultExport, { headers, meta } from '../_index'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/_index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({ user: null, isInitialized: true })
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()])
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, description, canonical, og:url, and ld+json FAQ schema
    it('returns complete SEO metadata with FAQ schema', () => {
      const result = meta()

      // 1 - title tag
      expect(result[0]).toEqual({ title: 'Squad Planner - Le Calendly du gaming' })

      // 2 - description meta tag
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()
      expect(desc!.content).toContain('squad')

      // 3 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/' })

      // 4 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/' })

      // 5 - ld+json FAQPage
      const ldJson = result.find((m: any) => m['script:ld+json'])
      expect(ldJson).toBeDefined()
      expect(ldJson!['script:ld+json']['@type']).toBe('FAQPage')

      // 6 - FAQPage has mainEntity array
      expect(Array.isArray(ldJson!['script:ld+json'].mainEntity)).toBe(true)
      expect(ldJson!['script:ld+json'].mainEntity.length).toBeGreaterThan(0)

      // 7 - meta returns exactly 5 entries
      expect(result).toHaveLength(5)
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    // STRICT: verifies Cache-Control header is set with correct caching directives
    it('returns Cache-Control with public caching and stale-while-revalidate', () => {
      const result = headers({} as any)

      // 1 - has Cache-Control
      expect(result).toHaveProperty('Cache-Control')

      // 2 - contains public directive
      expect(result['Cache-Control']).toContain('public')

      // 3 - contains s-maxage
      expect(result['Cache-Control']).toContain('s-maxage=3600')

      // 4 - contains stale-while-revalidate
      expect(result['Cache-Control']).toContain('stale-while-revalidate=86400')

      // 5 - is a plain object
      expect(typeof result).toBe('object')

      // 6 - only one key
      expect(Object.keys(result)).toHaveLength(1)
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    // STRICT: verifies unauthenticated user sees Landing page, not a redirect
    it('renders Landing page when user is not authenticated', () => {
      mockUseAuthStore.mockReturnValue({ user: null, isInitialized: true })

      const { container } = render(createElement(DefaultExport))

      // 1 - Landing page testid present
      expect(screen.getByTestId('landing')).toBeTruthy()

      // 2 - no Navigate redirect rendered
      expect(screen.queryByTestId('navigate')).toBeNull()

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - Landing text content
      expect(screen.getByTestId('landing').textContent).toBe('Landing')

      // 5 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 6 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')
    })

    // STRICT: verifies authenticated user is redirected to /home
    it('renders Navigate to /home when user is authenticated', () => {
      mockUseAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })

      render(createElement(DefaultExport))

      // 1 - Navigate element present
      const nav = screen.getByTestId('navigate')
      expect(nav).toBeTruthy()

      // 2 - Navigate goes to /home
      expect(nav.getAttribute('data-to')).toBe('/home')

      // 3 - no Landing page rendered
      expect(screen.queryByTestId('landing')).toBeNull()

      // 4 - Navigate element is a div
      expect(nav.tagName).toBe('DIV')

      // 5 - auth state was checked
      expect(mockUseAuthStore).toHaveBeenCalled()

      // 6 - only one navigate element
      expect(screen.getAllByTestId('navigate')).toHaveLength(1)
    })

    // STRICT: verifies ?public=true bypasses redirect even when authenticated
    it('renders Landing when ?public=true even if authenticated', () => {
      mockUseAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
      mockUseSearchParams.mockReturnValue([new URLSearchParams('public=true'), vi.fn()])

      render(createElement(DefaultExport))

      // 1 - Landing page rendered
      expect(screen.getByTestId('landing')).toBeTruthy()

      // 2 - no redirect
      expect(screen.queryByTestId('navigate')).toBeNull()

      // 3 - Landing content visible
      expect(screen.getByTestId('landing').textContent).toBe('Landing')

      // 4 - auth store was still called
      expect(mockUseAuthStore).toHaveBeenCalled()

      // 5 - search params were accessed
      expect(mockUseSearchParams).toHaveBeenCalled()

      // 6 - component renders without errors
      expect(screen.getByTestId('landing')).toBeInstanceOf(HTMLElement)
    })
  })
})
