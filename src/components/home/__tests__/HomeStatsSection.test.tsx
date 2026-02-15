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

// Mock icons with data-testid including the icon name for trend detection
vi.mock('../../icons', () => new Proxy({}, { get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', { 'data-testid': `icon-${p}`, ...props }) : undefined }))

// Mock ui but expose the props so we can verify what AnimatedCounter receives
vi.mock('../../ui', () => ({
  AnimatedCounter: ({ end, suffix, duration }: any) =>
    createElement('span', { 'data-testid': 'counter', 'data-end': end, 'data-suffix': suffix || '', 'data-duration': duration }, `${end}${suffix || ''}`),
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

  // === SECTION STRUCTURE ===

  it('renders section heading as h2', () => {
    render(createElement(HomeStatsSection, defaultProps))
    const heading = screen.getByText('Ton tableau de bord')
    expect(heading.tagName).toBe('H2')
  })

  it('has correct section aria-label', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByLabelText('Tableau de bord')).toBeDefined()
  })

  // === LOADING STATES ===

  it('shows skeleton when squadsLoading is true', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, squadsLoading: true }))
    expect(screen.getByTestId('skeleton-stats')).toBeDefined()
    expect(screen.queryAllByTestId('counter').length).toBe(0)
  })

  it('shows skeleton when sessionsLoading is true', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, sessionsLoading: true }))
    expect(screen.getByTestId('skeleton-stats')).toBeDefined()
  })

  it('shows skeleton when both are loading', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, squadsLoading: true, sessionsLoading: true }))
    expect(screen.getByTestId('skeleton-stats')).toBeDefined()
  })

  it('shows stats when not loading', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.queryByTestId('skeleton-stats')).toBeNull()
    expect(screen.getAllByTestId('counter').length).toBe(2)
  })

  // === STAT VALUES ===

  it('displays squadsCount and sessionsThisWeek via AnimatedCounter', () => {
    render(createElement(HomeStatsSection, defaultProps))
    const counters = screen.getAllByTestId('counter')
    expect(counters[0].getAttribute('data-end')).toBe('3')
    expect(counters[1].getAttribute('data-end')).toBe('5')
  })

  it('renders with zero values', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, squadsCount: 0, sessionsThisWeek: 0 }))
    const counters = screen.getAllByTestId('counter')
    expect(counters[0].textContent).toBe('0')
    expect(counters[1].textContent).toBe('0')
  })

  it('renders with large values', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, squadsCount: 99, sessionsThisWeek: 50 }))
    const counters = screen.getAllByTestId('counter')
    expect(counters[0].textContent).toBe('99')
    expect(counters[1].textContent).toBe('50')
  })

  // === STAT LABELS ===

  it('renders "Squads" label', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByText('Squads')).toBeDefined()
  })

  it('renders "Cette semaine" label', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByText('Cette semaine')).toBeDefined()
  })

  it('renders mobile labels', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByText('Semaine')).toBeDefined()
  })

  // === LINKS ===

  it('links squads stat to /squads', () => {
    render(createElement(HomeStatsSection, defaultProps))
    const links = screen.getAllByRole('link')
    expect(links.some(l => l.getAttribute('href') === '/squads')).toBe(true)
  })

  it('links sessions stat to /sessions', () => {
    render(createElement(HomeStatsSection, defaultProps))
    const links = screen.getAllByRole('link')
    expect(links.some(l => l.getAttribute('href') === '/sessions')).toBe(true)
  })

  // === TREND ICON (getSessionsTrend) ===

  it('shows ArrowUp icon when sessionsThisWeek >= 3', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, sessionsThisWeek: 3 }))
    expect(screen.getByTestId('icon-ArrowUp')).toBeDefined()
  })

  it('shows ArrowUp icon when sessionsThisWeek >= 5', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, sessionsThisWeek: 5 }))
    expect(screen.getByTestId('icon-ArrowUp')).toBeDefined()
  })

  it('does not show ArrowUp icon when sessionsThisWeek is 1 (no trend icon)', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, sessionsThisWeek: 1 }))
    expect(screen.queryByTestId('icon-ArrowUp')).toBeNull()
  })

  it('does not show ArrowUp icon when sessionsThisWeek is 0 (no trend icon)', () => {
    render(createElement(HomeStatsSection, { ...defaultProps, sessionsThisWeek: 0 }))
    expect(screen.queryByTestId('icon-ArrowUp')).toBeNull()
  })

  // === ICONS ===

  it('renders Users icon for squads stat', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByTestId('icon-Users')).toBeDefined()
  })

  it('renders Calendar icon for sessions stat', () => {
    render(createElement(HomeStatsSection, defaultProps))
    expect(screen.getByTestId('icon-Calendar')).toBeDefined()
  })

  // === AnimatedCounter DURATION PROP ===

  it('passes duration=1.2 to AnimatedCounter', () => {
    render(createElement(HomeStatsSection, defaultProps))
    const counters = screen.getAllByTestId('counter')
    expect(counters[0].getAttribute('data-duration')).toBe('1.2')
  })
})
