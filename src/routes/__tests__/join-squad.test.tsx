import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// vi.mock declarations (keep existing)
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/join', hash: '', search: '' }),
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

vi.mock('../../pages/JoinSquad', () => ({ JoinSquad: () => createElement('div', { 'data-testid': 'join-squad' }, 'JoinSquad') }))

import DefaultExport, { headers, meta } from '../join-squad'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/join-squad', () => {
  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    // STRICT: verifies meta returns correct title, canonical, and og:url for the join page
    it('returns complete SEO metadata for the join-squad page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Rejoindre une squad - Squad Planner' })

      // 2 - canonical link
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/join' })

      // 3 - og:url
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/join' })

      // 4 - exactly 3 entries
      expect(result).toHaveLength(3)

      // 5 - title contains Squad Planner
      expect(result[0].title).toContain('Squad Planner')

      // 6 - title contains "Rejoindre"
      expect(result[0].title).toContain('Rejoindre')

      // 7 - all entries are objects
      result.forEach((entry: any) => expect(typeof entry).toBe('object'))
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    // STRICT: verifies Cache-Control header with multi-level caching for join page
    it('returns multi-level Cache-Control for join page', () => {
      const result = headers({} as any)

      // 1 - has Cache-Control
      expect(result).toHaveProperty('Cache-Control')

      // 2 - is public
      expect(result['Cache-Control']).toContain('public')

      // 3 - has max-age for browser cache
      expect(result['Cache-Control']).toContain('max-age=300')

      // 4 - has s-maxage for CDN
      expect(result['Cache-Control']).toContain('s-maxage=3600')

      // 5 - has stale-while-revalidate
      expect(result['Cache-Control']).toContain('stale-while-revalidate=86400')

      // 6 - only one key
      expect(Object.keys(result)).toHaveLength(1)
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    // STRICT: verifies the component renders the JoinSquad page component
    it('renders the JoinSquad page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - JoinSquad testid present
      expect(screen.getByTestId('join-squad')).toBeTruthy()

      // 2 - JoinSquad text content
      expect(screen.getByTestId('join-squad').textContent).toBe('JoinSquad')

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 5 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 6 - only one join-squad element
      expect(screen.getAllByTestId('join-squad')).toHaveLength(1)
    })
  })
})
