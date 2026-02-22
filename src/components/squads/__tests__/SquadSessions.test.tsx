import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
    createElement(
      'button',
      { onClick, disabled, type, className, 'data-variant': variant, ...props },
      children
    ),
  Card: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card' }, children),
  CardContent: ({ children, className }: any) => createElement('div', { className }, children),
  Badge: ({ children, variant }: any) =>
    createElement('span', { 'data-testid': 'badge', 'data-variant': variant }, children),
  Input: ({ label, value, onChange, placeholder, type, required, className }: any) =>
    createElement('div', null, [
      label ? createElement('label', { key: 'label' }, label) : null,
      createElement('input', {
        key: 'input',
        value,
        onChange,
        placeholder,
        type,
        required,
        className,
        'aria-label': label,
      }),
    ]),
  Select: ({ options, value, onChange }: any) =>
    createElement(
      'select',
      { value, onChange: (e: any) => onChange(e.target.value) },
      options.map((o: any) => createElement('option', { key: o.value, value: o.value }, o.label))
    ),
}))

// Mock SessionCard - capture props
vi.mock('../SessionCard', () => ({
  SessionCard: ({ session, onRsvp }: any) =>
    createElement(
      'div',
      { 'data-testid': `session-card-${session.id}` },
      session.title || 'Session'
    ),
}))

// Mock hooks for PartySection
const mockUseAuthStore = vi.hoisted(() => vi.fn())
const mockUsePremiumStore = vi.hoisted(() => vi.fn())
const mockUseVoiceChatStore = vi.hoisted(() => vi.fn())

vi.mock('../../../hooks', () => ({
  useAuthStore: mockUseAuthStore,
  usePremiumStore: mockUsePremiumStore,
}))

vi.mock('../../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: mockUseVoiceChatStore,
}))

const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

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
    mockOnCreateSession.mockResolvedValue({ error: null })
  })

  const renderList = (overrides: any = {}) =>
    render(
      <SquadSessionsList
        sessions={mockSessions}
        squadId="squad-1"
        squadGame="Valorant"
        onRsvp={mockOnRsvp}
        onCreateSession={mockOnCreateSession}
        sessionsLoading={false}
        {...overrides}
      />
    )

  // === SESSIONS LIST ===

  it('renders heading', () => {
    renderList()
    expect(screen.getByText('Sessions à venir')).toBeInTheDocument()
  })

  it('displays session cards for future sessions', () => {
    renderList()
    expect(screen.getByTestId('session-card-session-1')).toBeInTheDocument()
  })

  it('filters out past sessions that are not confirmed', () => {
    renderList({
      sessions: [
        { id: 's-past', title: 'Old', scheduled_at: pastDate, status: 'pending' },
        ...mockSessions,
      ],
    })
    expect(screen.queryByTestId('session-card-s-past')).not.toBeInTheDocument()
    expect(screen.getByTestId('session-card-session-1')).toBeInTheDocument()
  })

  it('keeps confirmed sessions even if past', () => {
    renderList({
      sessions: [
        { id: 's-confirmed', title: 'Confirmed', scheduled_at: pastDate, status: 'confirmed' },
      ],
    })
    expect(screen.getByTestId('session-card-s-confirmed')).toBeInTheDocument()
  })

  it('shows empty state when no future sessions', () => {
    renderList({ sessions: [] })
    expect(screen.getByText('Pas encore de session prévue')).toBeInTheDocument()
    expect(screen.getByText('Propose un créneau pour jouer avec ta squad')).toBeInTheDocument()
  })

  it('shows "Planifier une session" button when no sessions', () => {
    renderList({ sessions: [] })
    expect(screen.getAllByText('Planifier une session').length).toBeGreaterThanOrEqual(1)
  })

  // === CREATE SESSION FORM ===

  it('shows create session form when top button is clicked', () => {
    renderList()
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(screen.getByText('Nouvelle session')).toBeInTheDocument()
    expect(screen.getByText('Titre (optionnel)')).toBeInTheDocument()
  })

  it('shows form inputs: title, date, time, duration, threshold', () => {
    renderList()
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(screen.getByText('Titre (optionnel)')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Heure')).toBeInTheDocument()
    expect(screen.getByText('Duree')).toBeInTheDocument()
  })

  it('has duration options: 1h, 2h, 3h, 4h', () => {
    renderList()
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(screen.getByText('1 heure')).toBeInTheDocument()
    expect(screen.getByText('2 heures')).toBeInTheDocument()
    expect(screen.getByText('3 heures')).toBeInTheDocument()
    expect(screen.getByText('4 heures')).toBeInTheDocument()
  })

  it('has threshold options from 2 to 10 joueurs', () => {
    renderList()
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(screen.getByText('2 joueurs')).toBeInTheDocument()
    expect(screen.getByText('10 joueurs')).toBeInTheDocument()
  })

  it('shows cancel button that hides the form', () => {
    renderList()
    fireEvent.click(screen.getByText('Planifier une session'))
    expect(screen.getByText('Nouvelle session')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Annuler'))
    expect(screen.queryByText('Nouvelle session')).not.toBeInTheDocument()
  })

  it('shows error when submitting without date and time', async () => {
    const { container } = renderList()
    fireEvent.click(screen.getByText('Planifier une session'))
    // Submit the form directly
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText('Date et heure sont requises')).toBeInTheDocument()
    })
  })

  it('submits form with correct data and closes form on success', async () => {
    const { container } = renderList()
    fireEvent.click(screen.getByText('Planifier une session'))

    // Fill in date and time
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-15' } })
    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '20:00' } })

    // Find the submit button and click it; also submit the form to ensure onSubmit fires
    const submitButton = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('type') === 'submit')!
    submitButton.click()

    await waitFor(() => {
      expect(mockOnCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          squad_id: 'squad-1',
          duration_minutes: 120,
          auto_confirm_threshold: 3,
          game: 'Valorant',
        })
      )
    })

    // Form should close on success
    await waitFor(() => {
      expect(screen.queryByText('Nouvelle session')).not.toBeInTheDocument()
    })
  })

  it('shows error message returned from create session API', async () => {
    mockOnCreateSession.mockResolvedValue({ error: { message: 'Server error' } })
    renderList()
    fireEvent.click(screen.getByText('Planifier une session'))

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-15' } })
    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '20:00' } })

    // Use native click on submit button to trigger form submission
    const submitButton = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('type') === 'submit')!
    submitButton.click()

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('disables submit button when sessionsLoading', () => {
    renderList({ sessionsLoading: true })
    fireEvent.click(screen.getByText('Planifier une session'))
    // When sessionsLoading=true, the submit button shows <Loader2> instead of "Créer"
    // Find the submit button by its type attribute
    const allButtons = screen.getAllByRole('button')
    const submitButton = allButtons.find((b) => b.getAttribute('type') === 'submit')
    expect(submitButton).toBeDefined()
    expect(submitButton!.disabled).toBe(true)
  })

  // === EMPTY STATE CTA ===

  it('empty state CTA opens create session form', () => {
    renderList({ sessions: [] })
    const buttons = screen.getAllByText('Planifier une session')
    // Click the one in the empty state area
    fireEvent.click(buttons[buttons.length - 1])
    expect(screen.getByText('Nouvelle session')).toBeInTheDocument()
  })
})

describe('PartySection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
    })
    mockUsePremiumStore.mockReturnValue({ hasPremium: false })
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
  })

  it('renders party header', () => {
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Party vocale')).toBeInTheDocument()
  })

  it('shows "Lancer une party" when not connected and no participants', () => {
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Lancer une party')).toBeInTheDocument()
  })

  it('shows "Personne n\'est connectée" when no participants', () => {
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText("Personne n'est connectée pour l'instant")).toBeInTheDocument()
  })

  it('shows "Rejoindre la party" when remote users are connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [{ odrop: '123', username: 'Player2', isSpeaking: false }],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Rejoindre la party')).toBeInTheDocument()
  })

  it('shows connected badge with participant count', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [
        { odrop: '1', username: 'P1', isSpeaking: false },
        { odrop: '2', username: 'P2', isSpeaking: false },
      ],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('2 connectés')).toBeInTheDocument()
  })

  it('shows singular "connecté" for 1 participant', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [{ odrop: '1', username: 'P1', isSpeaking: false }],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('1 connecté')).toBeInTheDocument()
  })

  it('shows error message when error exists', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: 'Connexion échouée',
    })
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Connexion échouée')).toBeInTheDocument()
  })

  it('disables join button when connecting', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      isMuted: false,
      remoteUsers: [],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    const joinBtn = screen.getByText('Lancer une party').closest('button')
    expect(joinBtn?.disabled).toBe(true)
  })

  it('shows connected UI with mute/leave buttons when connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Toi')).toBeInTheDocument()
    expect(screen.getByText('Micro actif')).toBeInTheDocument()
    expect(screen.getByText('Quitter')).toBeInTheDocument()
  })

  it('shows "Muet" button when muted', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: true,
      remoteUsers: [],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Muet')).toBeInTheDocument()
  })

  it('calls toggleMute when mute button clicked', () => {
    const toggleMute = vi.fn()
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute,
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    fireEvent.click(screen.getByText('Micro actif'))
    expect(toggleMute).toHaveBeenCalled()
  })

  it('calls leaveChannel when "Quitter" clicked', () => {
    const leaveChannel = vi.fn()
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [],
      joinChannel: vi.fn(),
      leaveChannel,
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    fireEvent.click(screen.getByText('Quitter'))
    expect(leaveChannel).toHaveBeenCalled()
  })

  it('shows remote users by username when connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [
        { odrop: '1', username: 'Alice', isSpeaking: true },
        { odrop: '2', username: 'Bob', isSpeaking: false },
      ],
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('calls joinChannel with correct params on join click', () => {
    const joinChannel = vi.fn()
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [],
      joinChannel,
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    fireEvent.click(screen.getByText('Lancer une party'))
    expect(joinChannel).toHaveBeenCalledWith('squad-squad-1', 'user-1', 'TestUser', false)
  })

  it('does not call joinChannel if user is null', () => {
    const joinChannel = vi.fn()
    mockUseAuthStore.mockReturnValue({ user: null, profile: null })
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      remoteUsers: [],
      joinChannel,
      leaveChannel: vi.fn(),
      toggleMute: vi.fn(),
      error: null,
    })
    render(<PartySection squadId="squad-1" />)
    fireEvent.click(screen.getByText('Lancer une party'))
    expect(joinChannel).not.toHaveBeenCalled()
  })
})
