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
  Badge: ({ children, variant, ...props }: any) => createElement('span', { 'data-testid': 'badge', 'data-variant': variant, ...props }, children),
  SessionCardSkeleton: () => createElement('div', { 'data-testid': 'skeleton-session' }),
  ContentTransition: ({ children, isLoading, skeleton }: any) => isLoading ? skeleton : children,
}))
vi.mock('../../EmptyStateIllustration', () => ({
  EmptyStateIllustration: ({ type }: any) => createElement('div', { 'data-testid': 'empty-illustration', 'data-type': type }),
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

  it('renders section heading and aria-label', () => {
    render(createElement(HomeSessionsSection, defaultProps))
    expect(screen.getByText('Prochaine session')).toBeDefined()
    expect(screen.getByLabelText('Prochaine session')).toBeDefined()
  })

  it('shows skeleton when loading', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, sessionsLoading: true }))
    expect(screen.getByTestId('skeleton-session')).toBeDefined()
  })

  it('shows empty state with create button when no sessions and onCreateSession provided', () => {
    render(createElement(HomeSessionsSection, defaultProps))
    expect(screen.getByText('Planifier une session')).toBeDefined()
    expect(screen.getByTestId('empty-illustration')).toBeDefined()
    expect(screen.getByText("Ta prochaine session t'attend")).toBeDefined()
    expect(screen.getByText('Propose un créneau et ta squad reçoit une notif instantanément !')).toBeDefined()
    expect(screen.getByText('Ta squad recevra une notification instantanément')).toBeDefined()
  })

  it('calls onCreateSession when empty state CTA is clicked', () => {
    render(createElement(HomeSessionsSection, defaultProps))
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(defaultProps.onCreateSession).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when no sessions and no onCreateSession', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, onCreateSession: undefined }))
    expect(screen.queryByText('Planifier une session')).toBeNull()
    expect(screen.queryByTestId('empty-illustration')).toBeNull()
  })

  it('displays session title, falls back to game, then to "Session"', () => {
    // title present
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.getByText('Ranked Valorant')).toBeDefined()
  })

  it('falls back to game name when title is null', () => {
    const s = { ...mockSession, title: null, game: 'League of Legends' }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('League of Legends')).toBeDefined()
  })

  it('falls back to "Session" when both title and game are null', () => {
    const s = { ...mockSession, title: null, game: null }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('Session')).toBeDefined()
  })

  it('displays squad name and RSVP count', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.getByText('Les Gamers')).toBeDefined()
    expect(screen.getByText('3/5')).toBeDefined()
  })

  it('links to the correct squad page', () => {
    const s = { ...mockSession, squad_id: 'squad-42' }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    const links = screen.getAllByRole('link')
    expect(links.some(l => l.getAttribute('href') === '/squad/squad-42')).toBe(true)
  })

  it('shows "En cours" for past sessions with success badge variant', () => {
    const s = { ...mockSession, scheduled_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('En cours')).toBeDefined()
    expect(screen.getByTestId('badge').getAttribute('data-variant')).toBe('success')
  })

  it('shows "Dans moins d\'1h" for sessions less than 1 hour away', () => {
    const s = { ...mockSession, scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText("Dans moins d'1h")).toBeDefined()
  })

  it('shows "Dans Xh" with warning badge for sessions hours away (< 24h)', () => {
    const s = { ...mockSession, scheduled_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('Dans 5h')).toBeDefined()
    expect(screen.getByTestId('badge').getAttribute('data-variant')).toBe('warning')
  })

  it('shows "Demain" for sessions ~1 day away', () => {
    const s = { ...mockSession, scheduled_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('Demain')).toBeDefined()
  })

  it('shows "Dans X jours" with default badge for sessions multiple days away', () => {
    const s = { ...mockSession, scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('Dans 3 jours')).toBeDefined()
    expect(screen.getByTestId('badge').getAttribute('data-variant')).toBe('default')
  })

  it('renders RSVP buttons and calls onRsvp with correct params', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.getByLabelText('Marquer comme présent')).toBeDefined()
    expect(screen.getByLabelText('Marquer comme peut-être')).toBeDefined()
    expect(screen.getByLabelText('Marquer comme absent')).toBeDefined()

    fireEvent.click(screen.getByLabelText('Marquer comme présent'))
    expect(defaultProps.onRsvp).toHaveBeenCalledWith('session-1', 'present')
  })

  it('calls onRsvp with maybe and absent correctly', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    fireEvent.click(screen.getByLabelText('Marquer comme peut-être'))
    expect(defaultProps.onRsvp).toHaveBeenCalledWith('session-1', 'maybe')
    fireEvent.click(screen.getByLabelText('Marquer comme absent'))
    expect(defaultProps.onRsvp).toHaveBeenCalledWith('session-1', 'absent')
  })

  it('disables RSVP buttons when isRsvpLoading is true', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession], isRsvpLoading: true }))
    expect(screen.getByLabelText('Marquer comme présent').hasAttribute('disabled')).toBe(true)
    expect(screen.getByLabelText('Marquer comme peut-être').hasAttribute('disabled')).toBe(true)
    expect(screen.getByLabelText('Marquer comme absent').hasAttribute('disabled')).toBe(true)
  })

  it('sets aria-pressed on the selected RSVP button', () => {
    const s = { ...mockSession, my_rsvp: 'present' as const }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByLabelText('Marquer comme présent').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByLabelText('Marquer comme peut-être').getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByLabelText('Marquer comme absent').getAttribute('aria-pressed')).toBe('false')
  })

  it('hides RSVP buttons for sessions more than 2h in the past', () => {
    const s = { ...mockSession, scheduled_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.queryByLabelText('Marquer comme présent')).toBeNull()
  })

  it('shows RSVP buttons for sessions within 2h past', () => {
    const s = { ...mockSession, scheduled_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByLabelText('Marquer comme présent')).toBeDefined()
  })

  it('shows confirmation for present response', () => {
    const s = { ...mockSession, my_rsvp: 'present' as const }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText("T'es chaud, on t'attend !")).toBeDefined()
  })

  it('shows confirmation for absent response', () => {
    const s = { ...mockSession, my_rsvp: 'absent' as const }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('Pas dispo cette fois')).toBeDefined()
  })

  it('shows confirmation for maybe response', () => {
    const s = { ...mockSession, my_rsvp: 'maybe' as const }
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [s] }))
    expect(screen.getByText('En mode peut-être...')).toBeDefined()
  })

  it('does not show confirmation when user has not responded', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.queryByText("T'es chaud, on t'attend !")).toBeNull()
    expect(screen.queryByText('Pas dispo cette fois')).toBeNull()
    expect(screen.queryByText('En mode peut-être...')).toBeNull()
  })

  it('shows Voir tout link when multiple sessions with count', () => {
    const sessions = [mockSession, { ...mockSession, id: 'session-2' }]
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: sessions }))
    expect(screen.getByText('Voir tout (2)')).toBeDefined()
    expect(screen.getByText('Voir tout (2)').closest('a')?.getAttribute('href')).toBe('/squads')
  })

  it('does not show Voir tout when only one session or loading', () => {
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: [mockSession] }))
    expect(screen.queryByText(/Voir tout/)).toBeNull()
  })

  it('only renders the first session (next session card)', () => {
    const sessions = [
      { ...mockSession, id: 's1', title: 'First Session' },
      { ...mockSession, id: 's2', title: 'Second Session' },
    ]
    render(createElement(HomeSessionsSection, { ...defaultProps, upcomingSessions: sessions }))
    expect(screen.getByText('First Session')).toBeDefined()
    expect(screen.queryByText('Second Session')).toBeNull()
  })
})
