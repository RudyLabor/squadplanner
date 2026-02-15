import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/help', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
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

vi.mock('../../pages/Help', () => ({ Help: () => createElement('div', { 'data-testid': 'help' }, 'Help') }))

import DefaultExport, { headers, meta } from '../help'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/help', () => {
  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, description, canonical, and og:url for the help page
    it('returns complete SEO metadata for the help page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Aide - Squad Planner' })

      // 2 - description meta tag exists
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()

      // 3 - description mentions aide/help
      expect(desc!.content).toContain("Centre d'aide")

      // 4 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/help' })

      // 5 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/help' })

      // 6 - exactly 4 entries
      expect(result).toHaveLength(4)

      // 7 - description mentions squads
      expect(desc!.content).toContain('squads')
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    // STRICT: verifies Cache-Control header with long-lived public caching for static help page
    it('returns long-lived Cache-Control for static help page', () => {
      const result = headers({} as any)

      // 1 - has Cache-Control
      expect(result).toHaveProperty('Cache-Control')

      // 2 - is public
      expect(result['Cache-Control']).toContain('public')

      // 3 - s-maxage is 3600 (1 hour)
      expect(result['Cache-Control']).toContain('s-maxage=3600')

      // 4 - has stale-while-revalidate of 86400 (24 hours)
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
    // STRICT: verifies the component renders the Help page component
    it('renders the Help page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - Help testid present
      expect(screen.getByTestId('help')).toBeTruthy()

      // 2 - Help text content
      expect(screen.getByTestId('help').textContent).toBe('Help')

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 5 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 6 - only one help element
      expect(screen.getAllByTestId('help')).toHaveLength(1)
    })
  })
})
