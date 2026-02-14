import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  Card: ({ children, ...props }: any) => createElement('div', { 'data-testid': 'card', ...props }, children),
  Badge: ({ children, ...props }: any) => createElement('span', { 'data-testid': 'badge', ...props }, children),
  SessionCardSkeleton: () => createElement('div', { 'data-testid': 'skeleton-session' }),
  ContentTransition: ({ children, isLoading, skeleton }: any) => isLoading ? skeleton : children,
}))
vi.mock('../../EmptyStateIllustration', () => ({
  EmptyStateIllustration: () => createElement('div', { 'data-testid': 'empty-illustration' }),
}))

import { HomeSessionsSection } from '../HomeSessionsSection'

describe('HomeSessionsSection', () => {
  const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

  const mockSession = {
    id: 'session-1',
    title: 'Ranked Valorant',
    game: 'Valorant',
    scheduled_at: futureDate,
    status: 'planned',
    squad_id: 'squad-1',
    squad_name: 'Les Gamers',
    rsvp_counts: { present: 3, absent: 1, maybe: 2 },
    my_rsvp: null as 'present' | 'absent' | 'maybe' | null,
    total_members: 5,
  }

  const defaultProps = {
    upcomingSessions: [] as typeof mockSession[],
    sessionsLoading: false,
    onRsvp: vi.fn(),
    isRsvpLoading: false,
    onCreateSession: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash with no sessions', () => {
    render(createElement(HomeSessionsSection, defaultProps))
    expect(screen.getByText('Prochaine session')).toBeDefined()
  })

  it('shows skeleton when loading', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, sessionsLoading: true }))
    expect(screen.getByTestId('skeleton-session')).toBeDefined()
  })

  it('shows empty state with create button', () => {
    render(createElement(HomeSessionsSection, defaultProps))
    expect(screen.getByText('Planifier une session')).toBeDefined()
  })

  it('renders nothing when no sessions and no onCreateSession', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, onCreateSession: undefined }))
    expect(screen.queryByText('Planifier une session')).toBeNull()
  })

  it('renders next session card when sessions exist', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.getByText('Ranked Valorant')).toBeDefined()
    expect(screen.getByText('Les Gamers')).toBeDefined()
  })

  it('renders RSVP buttons for upcoming session', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.getByLabelText('Marquer comme présent')).toBeDefined()
    expect(screen.getByLabelText('Marquer comme peut-être')).toBeDefined()
    expect(screen.getByLabelText('Marquer comme absent')).toBeDefined()
  })

  it('calls onRsvp with correct parameters', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    fireEvent.click(screen.getByLabelText('Marquer comme présent'))
    expect(defaultProps.onRsvp).toHaveBeenCalledWith('session-1', 'present')
  })

  it('shows Voir tout link when multiple sessions exist', () => {
    render(createElement(HomeSessionsSection, {
      ...defaultProps,
      upcomingSessions: [mockSession, { ...mockSession, id: 'session-2' }],
    }))
    expect(screen.getByText('Voir tout (2)')).toBeDefined()
  })

  it('does not show Voir tout link when only one session', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.queryByText(/Voir tout/)).toBeNull()
  })

  it('has correct section aria-label', () => {
    render(createElement(HomeSessionsSection, defaultProps))
    expect(screen.getByLabelText('Prochaine session')).toBeDefined()
  })

  it('shows confirmation when user responded present', () => {
    const respondedSession = { ...mockSession, my_rsvp: 'present' as const }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [respondedSession] }))
    expect(screen.getByText("T'es chaud, on t'attend !")).toBeDefined()
  })

  it('shows confirmation when user responded absent', () => {
    const respondedSession = { ...mockSession, my_rsvp: 'absent' as const }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [respondedSession] }))
    expect(screen.getByText('Pas dispo cette fois')).toBeDefined()
  })

  it('shows confirmation when user responded maybe', () => {
    const respondedSession = { ...mockSession, my_rsvp: 'maybe' as const }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [respondedSession] }))
    expect(screen.getByText('En mode peut-être...')).toBeDefined()
  })

  it('calls onCreateSession when empty state CTA is clicked', () => {
    render(createElement(HomeSessionsSection, defaultProps))
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(defaultProps.onCreateSession).toHaveBeenCalled()
  })
})
