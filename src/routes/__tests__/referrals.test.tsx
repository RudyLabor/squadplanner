import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/referrals', hash: '', search: '' }),
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

vi.mock('../../pages/Referrals', () => ({
  Referrals: () => createElement('div', { 'data-testid': 'referrals' }, 'Referrals'),
}))

import DefaultExport, { meta } from '../referrals'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/referrals', () => {
  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    it('returns correct title for the referrals page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Parrainage - Squad Planner' })

      // 2 - title contains "Parrainage"
      expect(result[0].title).toContain('Parrainage')

      // 3 - all entries are objects
      result.forEach((entry: any) => expect(typeof entry).toBe('object'))

      // 4 - at least title and description
      expect(result.length).toBeGreaterThanOrEqual(2)
    })

    it('returns a description meta tag about referrals', () => {
      const result = meta()
      const desc = result.find((m: any) => m.name === 'description')

      // 1 - description exists
      expect(desc).toBeDefined()

      // 2 - description content is not empty
      expect(desc!.content.length).toBeGreaterThan(0)

      // 3 - description mentions inviting friends or rewards
      expect(desc!.content).toMatch(/invite|potes|premium|récompense/i)

      // 4 - description is a string
      expect(typeof desc!.content).toBe('string')
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders the Referrals page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - Referrals testid present
      expect(screen.getByTestId('referrals')).toBeTruthy()

      // 2 - Referrals text content
      expect(screen.getByTestId('referrals').textContent).toBe('Referrals')

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 5 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 6 - only one referrals element
      expect(screen.getAllByTestId('referrals')).toHaveLength(1)
    })

    it('delegates rendering entirely to the Referrals page component', () => {
      const { container } = render(createElement(DefaultExport))

      // The route component is a thin wrapper — verify the page component is the sole child
      // 1 - testid element exists inside container
      const el = container.querySelector('[data-testid="referrals"]')
      expect(el).toBeTruthy()

      // 2 - the element is a div
      expect(el!.tagName).toBe('DIV')

      // 3 - container has exactly one child
      expect(container.children).toHaveLength(1)

      // 4 - no extra wrapper divs
      expect(container.firstElementChild?.getAttribute('data-testid')).toBe('referrals')
    })
  })
})
