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
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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

vi.mock('../../icons', () => new Proxy({}, { get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', { 'data-testid': `icon-${p}`, ...props }) : undefined }))
vi.mock('../../ui', () => ({
  AnimatedCounter: ({ end, suffix }: any) => createElement('span', { 'data-testid': 'counter' }, `${end}${suffix || ''}`),
  ContentTransition: ({ children, isLoading, skeleton }: any) => isLoading ? skeleton : children,
  SkeletonStatsRow: () => createElement('div', { 'data-testid': 'skeleton-stats' }),
}))

import { HomeStatsSection } from '../HomeStatsSection'

describe('HomeStatsSection', () => {
  const defaultProps = {
    squadsCount: 3,
    sessionsThisWeek: 5,
    squadsLoading: false,
    sessionsLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByText('Ton tableau de bord')).toBeDefined()
  })

  it('shows skeleton when loading squads', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, squadsLoading: true }))
    expect(screen.getByTestId('skeleton-stats')).toBeDefined()
  })

  it('shows skeleton when loading sessions', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, sessionsLoading: true }))
    expect(screen.getByTestId('skeleton-stats')).toBeDefined()
  })

  it('displays stats values', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
  })

  it('has correct section aria-label', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByLabelText('Tableau de bord')).toBeDefined()
  })

  it('renders with zero values', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, squadsCount: 0, sessionsThisWeek: 0 }))
    const counters = screen.getAllByTestId('counter')
    expect(counters.length).toBe(2)
  })

  it('renders stat labels', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByText('Squads')).toBeDefined()
  })

  it('renders section heading', () => {
    render(createElement(HomeStatsSection, defaultProps))
    const heading = screen.getByText('Ton tableau de bord')
    expect(heading.tagName).toBe('H2')
  })
})
