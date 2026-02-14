import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { SessionCard } from '../SessionCard'

// Mock react-router
vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

// Mock framer-motion
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

// Mock icons
vi.mock('../../icons', () => ({
  Calendar: (props: any) => createElement('svg', { 'data-testid': 'icon-calendar', ...props }),
  Clock: (props: any) => createElement('svg', { 'data-testid': 'icon-clock', ...props }),
  Users: (props: any) => createElement('svg', { 'data-testid': 'icon-users', ...props }),
  ChevronRight: (props: any) => createElement('svg', { 'data-testid': 'icon-chevron', ...props }),
  CheckCircle2: (props: any) => createElement('svg', { 'data-testid': 'icon-check', ...props }),
  XCircle: (props: any) => createElement('svg', { 'data-testid': 'icon-xcircle', ...props }),
  HelpCircle: (props: any) => createElement('svg', { 'data-testid': 'icon-help', ...props }),
}))

// Mock UI components
vi.mock('../../ui', () => ({
  Card: ({ children, className }: any) => createElement('div', { className, 'data-testid': 'card' }, children),
  Badge: ({ children, variant }: any) => createElement('span', { 'data-testid': 'badge', 'data-variant': variant }, children),
  Tooltip: ({ children }: any) => createElement('div', null, children),
}))

// Helper to create a future date
const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 2 days from now
const todayDate = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // yesterday

const mockSession = {
  id: 'session-1',
  title: 'Ranked Session',
  game: 'Valorant',
  scheduled_at: futureDate,
  status: 'pending',
  rsvp_counts: { present: 3, absent: 1, maybe: 2 },
  my_rsvp: null as 'present' | 'absent' | 'maybe' | null,
}

const mockOnRsvp = vi.fn()

describe('SessionCard', () => {
  it('renders without crashing', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByText('Ranked Session')).toBeInTheDocument()
  })

  it('displays session title', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByText('Ranked Session')).toBeInTheDocument()
  })

  it('shows present count', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByText(/3 presents/)).toBeInTheDocument()
  })

  it('shows RSVP buttons for future sessions', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByLabelText('Marquer comme present')).toBeInTheDocument()
    expect(screen.getByLabelText('Marquer comme peut-etre')).toBeInTheDocument()
    expect(screen.getByLabelText('Marquer comme absent')).toBeInTheDocument()
  })

  it('calls onRsvp with "present" when present button is clicked', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    fireEvent.click(screen.getByLabelText('Marquer comme present'))
    expect(mockOnRsvp).toHaveBeenCalledWith('session-1', 'present')
  })

  it('calls onRsvp with "maybe" when maybe button is clicked', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    fireEvent.click(screen.getByLabelText('Marquer comme peut-etre'))
    expect(mockOnRsvp).toHaveBeenCalledWith('session-1', 'maybe')
  })

  it('calls onRsvp with "absent" when absent button is clicked', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    fireEvent.click(screen.getByLabelText('Marquer comme absent'))
    expect(mockOnRsvp).toHaveBeenCalledWith('session-1', 'absent')
  })

  it('does not show RSVP buttons for cancelled sessions', () => {
    const cancelledSession = { ...mockSession, status: 'cancelled' }
    render(<SessionCard session={cancelledSession} onRsvp={mockOnRsvp} />)
    expect(screen.queryByLabelText('Marquer comme present')).not.toBeInTheDocument()
  })

  it('shows cancelled badge for cancelled sessions', () => {
    const cancelledSession = { ...mockSession, status: 'cancelled' }
    render(<SessionCard session={cancelledSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByText('Annulée')).toBeInTheDocument()
  })

  it('shows confirmed badge for confirmed sessions', () => {
    const confirmedSession = { ...mockSession, status: 'confirmed' }
    render(<SessionCard session={confirmedSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByText('Confirmée')).toBeInTheDocument()
  })

  it('falls back to game name if no title', () => {
    const noTitleSession = { ...mockSession, title: null }
    render(<SessionCard session={noTitleSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByText('Valorant')).toBeInTheDocument()
  })

  it('falls back to "Session" if no title and no game', () => {
    const noInfoSession = { ...mockSession, title: null, game: null }
    render(<SessionCard session={noInfoSession} onRsvp={mockOnRsvp} />)
    expect(screen.getByText('Session')).toBeInTheDocument()
  })

  it('has a link to the session detail page', () => {
    render(<SessionCard session={mockSession} onRsvp={mockOnRsvp} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/session/session-1')
  })

  it('highlights the present button when my_rsvp is present', () => {
    const rsvpSession = { ...mockSession, my_rsvp: 'present' as const }
    render(<SessionCard session={rsvpSession} onRsvp={mockOnRsvp} />)
    const presentBtn = screen.getByLabelText('Marquer comme present')
    expect(presentBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
