import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
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

vi.mock(
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, p) =>
          typeof p === 'string'
            ? (props: any) => createElement('span', { 'data-testid': `icon-${p}`, ...props })
            : undefined,
      }
    )
)
vi.mock('../../ui', () => ({
  Card: ({ children, ...props }: any) =>
    createElement('div', { 'data-testid': 'card', ...props }, children),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

import { ProfileCoachCard } from '../ProfileCoachCard'

describe('ProfileCoachCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 0,
        reliabilityScore: 80,
      })
    )
    expect(screen.getByText('Coach IA')).toBeDefined()
  })

  it('displays real AI coach tip when provided', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 5,
        reliabilityScore: 85,
        aiCoachTip: { tip: 'Continue comme ca!', tone: 'celebration' },
      })
    )
    expect(screen.getByText('Continue comme ca!')).toBeDefined()
  })

  it('shows action buttons when no real tip', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 3,
        reliabilityScore: 75,
      })
    )
    expect(screen.getByText('Planifier une session')).toBeDefined()
    expect(screen.getByText('Voir mes stats')).toBeDefined()
  })

  it('hides action buttons when real tip is provided', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 5,
        reliabilityScore: 85,
        aiCoachTip: { tip: 'Some tip', tone: 'neutral' },
      })
    )
    expect(screen.queryByText('Planifier une session')).toBeNull()
    expect(screen.queryByText('Voir mes stats')).toBeNull()
  })

  it('renders with warning tone', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 0,
        reliabilityScore: 50,
        aiCoachTip: { tip: 'Attention!', tone: 'warning' },
      })
    )
    expect(screen.getByText('Attention!')).toBeDefined()
  })

  it('renders with celebration tone', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 10,
        reliabilityScore: 95,
        aiCoachTip: { tip: 'Bravo!', tone: 'celebration' },
      })
    )
    expect(screen.getByText('Bravo!')).toBeDefined()
  })

  it('shows dynamic tips when no AI tip', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 5,
        reliabilityScore: 80,
      })
    )
    // Should show a tip from the dynamic pool and dot indicators
    const dots = screen.getAllByLabelText(/Conseil \d+/)
    expect(dots.length).toBeGreaterThan(0)
  })

  it('renders Coach IA heading', () => {
    render(
      createElement(ProfileCoachCard, {
        streakDays: 0,
        reliabilityScore: 0,
      })
    )
    expect(screen.getByText('Coach IA')).toBeDefined()
  })
})
