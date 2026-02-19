import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockNavigate = vi.hoisted(() => vi.fn())
const mockSearchParams = vi.hoisted(() => new URLSearchParams())

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/auth/discord/callback', hash: '', search: '' }),
  useNavigate: () => mockNavigate,
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: () => [mockSearchParams, vi.fn()],
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

vi.mock('../../pages/DiscordCallback', () => ({
  DiscordCallback: () => createElement('div', { 'data-testid': 'discord-callback' }, 'DiscordCallback'),
}))

import DefaultExport, { meta } from '../discord-callback'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/discord-callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    it('returns correct title for the Discord callback page', () => {
      const result = meta()

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Connexion Discord - Squad Planner' })

      // 2 - title mentions Discord
      expect(result[0].title).toContain('Discord')

      // 3 - result is an array
      expect(Array.isArray(result)).toBe(true)

      // 4 - at least one entry
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('meta function is callable and returns consistent results', () => {
      const result1 = meta()
      const result2 = meta()

      // 1 - same title on multiple calls
      expect(result1[0].title).toBe(result2[0].title)

      // 2 - all entries are objects
      result1.forEach((entry: any) => expect(typeof entry).toBe('object'))

      // 3 - title is a string
      expect(typeof result1[0].title).toBe('string')

      // 4 - title includes the brand name
      expect(result1[0].title).toContain('Squad Planner')
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders the DiscordCallback page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - DiscordCallback testid present
      expect(screen.getByTestId('discord-callback')).toBeTruthy()

      // 2 - DiscordCallback text content
      expect(screen.getByTestId('discord-callback').textContent).toBe('DiscordCallback')

      // 3 - container exists
      expect(container).toBeTruthy()

      // 4 - DefaultExport is defined
      expect(DefaultExport).toBeDefined()

      // 5 - DefaultExport is a function
      expect(typeof DefaultExport).toBe('function')

      // 6 - only one discord-callback element
      expect(screen.getAllByTestId('discord-callback')).toHaveLength(1)
    })

    it('delegates rendering entirely to the DiscordCallback page component', () => {
      const { container } = render(createElement(DefaultExport))

      // 1 - testid element exists inside container
      const el = container.querySelector('[data-testid="discord-callback"]')
      expect(el).toBeTruthy()

      // 2 - the element is a div
      expect(el!.tagName).toBe('DIV')

      // 3 - container has exactly one child
      expect(container.children).toHaveLength(1)

      // 4 - no extra wrapper divs
      expect(container.firstElementChild?.getAttribute('data-testid')).toBe('discord-callback')
    })
  })
})
