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
}))

import { ProfileActivityCard } from '../ProfileActivityCard'

describe('ProfileActivityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(createElement(ProfileActivityCard, { streakDays: 0 }))
    expect(screen.getByLabelText('Activité')).toBeDefined()
  })

  it('displays streak count', () => {
    render(createElement(ProfileActivityCard, { streakDays: 5 }))
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('jours')).toBeDefined()
  })

  it('shows singular day for streak of 1', () => {
    render(createElement(ProfileActivityCard, { streakDays: 1 }))
    expect(screen.getByText('jour')).toBeDefined()
  })

  it('shows singular day for streak of 0', () => {
    render(createElement(ProfileActivityCard, { streakDays: 0 }))
    expect(screen.getByText('jour')).toBeDefined()
  })

  it('shows next milestone progress', () => {
    render(createElement(ProfileActivityCard, { streakDays: 3 }))
    expect(screen.getByText('Prochain palier')).toBeDefined()
  })

  it('shows Serie en cours label', () => {
    render(createElement(ProfileActivityCard, { streakDays: 5 }))
    expect(screen.getByText('Série en cours')).toBeDefined()
  })

  it('shows Actif badge when streak > 0', () => {
    render(createElement(ProfileActivityCard, { streakDays: 3 }))
    expect(screen.getByText('Actif')).toBeDefined()
  })

  it('does not show Actif badge when streak is 0', () => {
    render(createElement(ProfileActivityCard, { streakDays: 0 }))
    expect(screen.queryByText('Actif')).toBeNull()
  })

  it('shows 7-day calendar', () => {
    render(createElement(ProfileActivityCard, { streakDays: 3 }))
    // Day labels should be present (L, M, M, J, V, S, D)
    expect(screen.getAllByText('L').length).toBeGreaterThan(0)
  })

  it('shows next milestone with XP reward', () => {
    render(createElement(ProfileActivityCard, { streakDays: 3 }))
    // Should show "+100 XP" for first milestone (7 days)
    expect(screen.getByText('+100 XP')).toBeDefined()
    expect(screen.getByText(/1 semaine/)).toBeDefined()
  })

  it('renders section heading', () => {
    render(createElement(ProfileActivityCard, { streakDays: 0 }))
    const heading = screen.getByText('Activité')
    expect(heading.tagName).toBe('H3')
  })

  it('shows remaining days to milestone', () => {
    render(createElement(ProfileActivityCard, { streakDays: 5 }))
    expect(screen.getByText(/Encore 2 jours/)).toBeDefined()
  })
})
