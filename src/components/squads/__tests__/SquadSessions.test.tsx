import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { SquadSessionsList, PartySection } from '../SquadSessions'

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
  Plus: (props: any) => createElement('svg', { 'data-testid': 'icon-plus', ...props }),
  Loader2: (props: any) => createElement('svg', { 'data-testid': 'icon-loader', ...props }),
  Mic: (props: any) => createElement('svg', { 'data-testid': 'icon-mic', ...props }),
  MicOff: (props: any) => createElement('svg', { 'data-testid': 'icon-micoff', ...props }),
}))

// Mock UI components
vi.mock('../../ui', () => ({
  Button: ({ children, onClick, disabled, type, className, variant, size, ...props }: any) =>
    createElement('button', { onClick, disabled, type, className, ...props }, children),
  Card: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card' }, children),
  CardContent: ({ children, className }: any) =>
    createElement('div', { className }, children),
  Badge: ({ children, variant }: any) =>
    createElement('span', { 'data-testid': 'badge' }, children),
  Input: ({ label, value, onChange, placeholder, type, required, className }: any) =>
    createElement('div', null, [
      label ? createElement('label', { key: 'label' }, label) : null,
      createElement('input', { key: 'input', value, onChange, placeholder, type, required, className }),
    ]),
  Select: ({ options, value, onChange }: any) =>
    createElement('select', { value, onChange: (e: any) => onChange(e.target.value) },
      options.map((o: any) => createElement('option', { key: o.value, value: o.value }, o.label))
    ),
}))

// Mock SessionCard
vi.mock('../SessionCard', () => ({
  SessionCard: ({ session, onRsvp }: any) =>
    createElement('div', { 'data-testid': `session-card-${session.id}` }, session.title || 'Session'),
}))

// Mock hooks for PartySection
vi.mock('../../../hooks', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'TestUser' },
  }),
  usePremiumStore: vi.fn().mockReturnValue({ hasPremium: false }),
}))

vi.mock('../../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: vi.fn().mockReturnValue({
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    remoteUsers: [],
    joinChannel: vi.fn(),
    leaveChannel: vi.fn(),
    toggleMute: vi.fn(),
    error: null,
  }),
}))

const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
const mockSessions = [
  {
    id: 'session-1',
    title: 'Ranked',
    game: 'Valorant',
    scheduled_at: futureDate,
    status: 'pending',
    rsvp_counts: { present: 2, absent: 0, maybe: 1 },
    my_rsvp: null,
  },
]

const mockOnRsvp = vi.fn()
const mockOnCreateSession = vi.fn().mockResolvedValue({ error: null })

describe('SquadSessionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <SquadSessionsList
        sessions={mockSessions}
        squadId="squad-1"
        squadGame="Valorant"
        onRsvp={mockOnRsvp}
        onCreateSession={mockOnCreateSession}
        sessionsLoading={false}
      />
    )
    expect(screen.getByText('Sessions à venir')).toBeInTheDocument()
  })

  it('displays session cards for future sessions', () => {
    render(
      <SquadSessionsList
        sessions={mockSessions}
        squadId="squad-1"
        squadGame="Valorant"
        onRsvp={mockOnRsvp}
        onCreateSession={mockOnCreateSession}
        sessionsLoading={false}
      />
    )
    expect(screen.getByTestId('session-card-session-1')).toBeInTheDocument()
  })

  it('shows empty state when no sessions', () => {
    render(
      <SquadSessionsList
        sessions={[]}
        squadId="squad-1"
        squadGame="Valorant"
        onRsvp={mockOnRsvp}
        onCreateSession={mockOnCreateSession}
        sessionsLoading={false}
      />
    )
    expect(screen.getByText('Pas encore de session prévue')).toBeInTheDocument()
  })

  it('shows plan button', () => {
    render(
      <SquadSessionsList
        sessions={[]}
        squadId="squad-1"
        squadGame="Valorant"
        onRsvp={mockOnRsvp}
        onCreateSession={mockOnCreateSession}
        sessionsLoading={false}
      />
    )
    expect(screen.getAllByText('Planifier une session').length).toBeGreaterThan(0)
  })

  it('shows create session form when button is clicked', () => {
    render(
      <SquadSessionsList
        sessions={mockSessions}
        squadId="squad-1"
        squadGame="Valorant"
        onRsvp={mockOnRsvp}
        onCreateSession={mockOnCreateSession}
        sessionsLoading={false}
      />
    )
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(screen.getByText('Nouvelle session')).toBeInTheDocument()
  })
})

describe('PartySection', () => {
  it('renders without crashing', () => {
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Party vocale')).toBeInTheDocument()
  })

  it('shows join button when not connected', () => {
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Lancer une party')).toBeInTheDocument()
  })

  it('shows message when no one is connected', () => {
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText("Personne n'est connectée pour l'instant")).toBeInTheDocument()
  })
})
