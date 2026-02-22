import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/premium', hash: '', search: '' }),
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

vi.mock('../../pages/Premium', () => ({
  Premium: () => createElement('div', { 'data-testid': 'premium' }, 'Premium'),
}))

import DefaultExport, { headers, meta } from '../premium'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/premium', () => {
  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, description, canonical, and og:url for the premium page
    it('returns complete SEO metadata for the premium page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Premium - Squad Planner' })

      // 2 - description meta tag exists
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()

      // 3 - description mentions Premium features
      expect(desc!.content).toContain('Premium')

      // 4 - description mentions free trial
      expect(desc!.content).toContain('gratuit')

      // 5 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://squadplanner.fr/premium',
      })

      // 6 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/premium' })

      // 7 - exactly 4 entries
      expect(result).toHaveLength(4)

      // 8 - description mentions squads illimitees
      expect(desc!.content).toContain('squads illimitées')
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    // STRICT: verifies Cache-Control header with long-lived public caching for premium page
    it('returns long-lived Cache-Control for premium page', () => {
      const result = headers({} as any)

      // 1 - has Cache-Control
      expect(result).toHaveProperty('Cache-Control')

      // 2 - is public
      expect(result['Cache-Control']).toContain('public')

      // 3 - s-maxage is 3600
      expect(result['Cache-Control']).toContain('s-maxage=3600')

      // 4 - has stale-while-revalidate of 86400
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
    // STRICT: verifies the component renders the Premium page component
    it('renders the Premium page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - Premium testid present
      expect(screen.getByTestId('premium')).toBeTruthy()

      // 2 - Premium text content
      expect(screen.getByTestId('premium').textContent).toBe('Premium')

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 5 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 6 - only one premium element
      expect(screen.getAllByTestId('premium')).toHaveLength(1)
    })
  })
})
