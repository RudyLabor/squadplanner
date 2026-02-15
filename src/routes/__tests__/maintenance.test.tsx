import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/maintenance', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
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

vi.mock('../../pages/Maintenance', () => ({ default: () => createElement('div', { 'data-testid': 'maintenance' }, 'Maintenance') }))

import DefaultExport, { headers, meta } from '../maintenance'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/maintenance', () => {
  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title for maintenance page (minimal SEO - only title)
    it('returns minimal SEO metadata with only title', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Maintenance - Squad Planner' })

      // 2 - title contains "Maintenance"
      expect(result[0].title).toContain('Maintenance')

      // 3 - title contains "Squad Planner"
      expect(result[0].title).toContain('Squad Planner')

      // 4 - only 1 entry (no description, no canonical for maintenance)
      expect(result).toHaveLength(1)

      // 5 - no description tag (maintenance page should not be indexed)
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeUndefined()

      // 6 - no canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toBeUndefined()
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    // STRICT: verifies Cache-Control header with long-lived public caching
    it('returns long-lived Cache-Control for maintenance page', () => {
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
    // STRICT: verifies the component renders the Maintenance page component
    it('renders the Maintenance page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - Maintenance testid present
      expect(screen.getByTestId('maintenance')).toBeTruthy()

      // 2 - Maintenance text content
      expect(screen.getByTestId('maintenance').textContent).toBe('Maintenance')

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 5 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 6 - only one maintenance element
      expect(screen.getAllByTestId('maintenance')).toHaveLength(1)
    })
  })
})
