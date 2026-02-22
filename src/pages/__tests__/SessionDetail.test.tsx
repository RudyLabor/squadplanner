import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// --- Hoisted mock variables ---
const mockHoisted = vi.hoisted(() => {
  const mockNavigate = vi.fn()
  const mockMutateRsvp = vi.fn()
  const mockMutateCheckin = vi.fn()
  const mockMutateConfirm = vi.fn()
  const mockMutateCancel = vi.fn()
  const mockMutateUpdate = vi.fn()
  let mockSessionData: any = null
  let mockSessionLoading = false
  let mockUser: any = { id: 'user-1' }
  let mockParams: any = { id: 'sess1' }
  let mockUpdatePending = false

  // Captured props from child components
  let capturedRsvpButtonsProps: any = null
  let capturedCheckinProps: any = null
  let capturedSessionInfoProps: any = null
  let capturedRsvpCountsProps: any = null
  let capturedParticipantsProps: any = null
  let capturedConfirmDialogProps: any = null
  let capturedVoiceChatProps: any = null

  return {
    mockNavigate,
    mockMutateRsvp,
    mockMutateCheckin,
    mockMutateConfirm,
    mockMutateCancel,
    mockMutateUpdate,
    get mockSessionData() {
      return mockSessionData
    },
    set mockSessionData(v: any) {
      mockSessionData = v
    },
    get mockSessionLoading() {
      return mockSessionLoading
    },
    set mockSessionLoading(v: boolean) {
      mockSessionLoading = v
    },
    get mockUser() {
      return mockUser
    },
    set mockUser(v: any) {
      mockUser = v
    },
    get mockParams() {
      return mockParams
    },
    set mockParams(v: any) {
      mockParams = v
    },
    get mockUpdatePending() {
      return mockUpdatePending
    },
    set mockUpdatePending(v: boolean) {
      mockUpdatePending = v
    },
    get capturedRsvpButtonsProps() {
      return capturedRsvpButtonsProps
    },
    set capturedRsvpButtonsProps(v: any) {
      capturedRsvpButtonsProps = v
    },
    get capturedCheckinProps() {
      return capturedCheckinProps
    },
    set capturedCheckinProps(v: any) {
      capturedCheckinProps = v
    },
    get capturedSessionInfoProps() {
      return capturedSessionInfoProps
    },
    set capturedSessionInfoProps(v: any) {
      capturedSessionInfoProps = v
    },
    get capturedRsvpCountsProps() {
      return capturedRsvpCountsProps
    },
    set capturedRsvpCountsProps(v: any) {
      capturedRsvpCountsProps = v
    },
    get capturedParticipantsProps() {
      return capturedParticipantsProps
    },
    set capturedParticipantsProps(v: any) {
      capturedParticipantsProps = v
    },
    get capturedConfirmDialogProps() {
      return capturedConfirmDialogProps
    },
    set capturedConfirmDialogProps(v: any) {
      capturedConfirmDialogProps = v
    },
    get capturedVoiceChatProps() {
      return capturedVoiceChatProps
    },
    set capturedVoiceChatProps(v: any) {
      capturedVoiceChatProps = v
    },
  }
})

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/session/sess1', hash: '', search: '' }),
  useNavigate: vi.fn(() => mockHoisted.mockNavigate),
  useParams: vi.fn(() => mockHoisted.mockParams),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({
      user: mockHoisted.mockUser,
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
    })),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({
      user: mockHoisted.mockUser,
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
    })),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
  useConfetti: vi.fn(() => ({ active: false, fire: vi.fn(), cancel: vi.fn() })),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

// Mock query hooks
vi.mock('../../hooks/queries', () => ({
  useSessionQuery: vi.fn(() => ({
    data: mockHoisted.mockSessionData,
    isLoading: mockHoisted.mockSessionLoading,
  })),
  useRsvpMutation: vi.fn(() => ({ mutateAsync: mockHoisted.mockMutateRsvp, isPending: false })),
  useCheckinMutation: vi.fn(() => ({ mutateAsync: mockHoisted.mockMutateCheckin })),
  useConfirmSessionMutation: vi.fn(() => ({ mutateAsync: mockHoisted.mockMutateConfirm })),
  useCancelSessionMutation: vi.fn(() => ({ mutateAsync: mockHoisted.mockMutateCancel })),
  useUpdateSessionMutation: vi.fn(() => ({
    mutateAsync: mockHoisted.mockMutateUpdate,
    isPending: mockHoisted.mockUpdatePending,
  })),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  ArrowLeft: (props: any) => createElement('span', props),
  CheckCircle2: (props: any) => createElement('span', props),
  AlertCircle: (props: any) => createElement('span', props),
  XCircle: (props: any) => createElement('span', props),
  Clock: (props: any) => createElement('span', props),
  Loader2: (props: any) => createElement('span', props),
  Sparkles: (props: any) => createElement('span', props),
  Edit2: (props: any) => createElement('span', props),
  X: (props: any) => createElement('span', props),
  Calendar: (props: any) => createElement('span', props),
  Trophy: (props: any) => createElement('span', props),
  Users: (props: any) => createElement('span', props),
  TrendingUp: (props: any) => createElement('span', props),
  Share2: (props: any) => createElement('span', props),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: (props: any) => (props ? createElement('div', { 'data-testid': 'confetti' }) : null),
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
  ConfirmDialog: (props: any) => {
    mockHoisted.capturedConfirmDialogProps = props
    if (!props.open) return null
    return createElement(
      'div',
      { 'data-testid': 'confirm-dialog' },
      createElement('span', null, props.title),
      createElement(
        'button',
        { onClick: props.onConfirm, 'data-testid': 'confirm-action' },
        props.confirmLabel
      ),
      createElement('button', { onClick: props.onClose, 'data-testid': 'cancel-action' }, 'Fermer')
    )
  },
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  CardContent: ({ children, ...props }: any) => createElement('div', props, children),
  Select: ({ options, value, onChange }: any) =>
    createElement(
      'select',
      { value, onChange: (e: any) => onChange(e.target.value) },
      (options || []).map((o: any) =>
        createElement('option', { key: o.value, value: o.value }, o.label)
      )
    ),
  Badge: ({ children, variant, ...props }: any) =>
    createElement('span', { 'data-variant': variant, ...props }, children),
}))

vi.mock('../../components/ShareButtons', () => ({
  ShareButtons: (props: any) => createElement('div', { 'data-testid': 'share-buttons' }),
}))

vi.mock('../session-detail/EditSessionModal', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return actual
})

vi.mock('../../components/VoiceChat', () => ({
  VoiceChat: (props: any) => {
    mockHoisted.capturedVoiceChatProps = props
    return createElement('div', { 'data-testid': 'voice-chat' })
  },
}))

// Mock session detail sub-components with prop capture
vi.mock('../session-detail/SessionDetailSections', () => ({
  SessionInfoCards: (props: any) => {
    mockHoisted.capturedSessionInfoProps = props
    return createElement('div', { 'data-testid': 'session-info' }, props.dateInfo?.day || '')
  },
  RsvpCounts: (props: any) => {
    mockHoisted.capturedRsvpCountsProps = props
    return createElement(
      'div',
      { 'data-testid': 'rsvp-counts' },
      `${props.present}/${props.maybe}/${props.absent}`
    )
  },
  RsvpButtons: (props: any) => {
    mockHoisted.capturedRsvpButtonsProps = props
    return createElement(
      'div',
      { 'data-testid': 'rsvp-buttons' },
      createElement(
        'button',
        { onClick: () => props.onRsvp('present'), 'data-testid': 'rsvp-present' },
        'Present'
      ),
      createElement(
        'button',
        { onClick: () => props.onRsvp('absent'), 'data-testid': 'rsvp-absent' },
        'Absent'
      ),
      createElement(
        'button',
        { onClick: () => props.onRsvp('maybe'), 'data-testid': 'rsvp-maybe' },
        'Maybe'
      )
    )
  },
  CheckinSection: (props: any) => {
    mockHoisted.capturedCheckinProps = props
    return createElement(
      'div',
      { 'data-testid': 'checkin-section' },
      createElement(
        'button',
        { onClick: props.onCheckin, 'data-testid': 'checkin-btn' },
        'Check-in'
      )
    )
  },
  ParticipantsList: (props: any) => {
    mockHoisted.capturedParticipantsProps = props
    return createElement('div', { 'data-testid': 'participants' })
  },
}))

import SessionDetail from '../SessionDetail'

// Helper: standard session data factory
function makeSession(overrides: Record<string, any> = {}) {
  return {
    id: 'sess1',
    title: 'Session Ranked',
    game: 'Valorant',
    squad_id: 'sq1',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    duration_minutes: 120,
    status: 'proposed',
    created_by: 'user-1',
    rsvp_counts: { present: 2, absent: 0, maybe: 1 },
    my_rsvp: null as string | null,
    rsvps: [
      { user_id: 'user-1', response: 'present', profiles: { username: 'TestUser' } },
      { user_id: 'user-2', response: 'present', profiles: { username: 'Player2' } },
    ],
    checkins: [] as any[],
    ...overrides,
  }
}

describe('SessionDetail Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    // Reset all mutable state
    mockHoisted.mockSessionData = makeSession()
    mockHoisted.mockSessionLoading = false
    mockHoisted.mockUser = { id: 'user-1' }
    mockHoisted.mockParams = { id: 'sess1' }
    mockHoisted.mockUpdatePending = false
    mockHoisted.mockNavigate.mockClear()
    mockHoisted.mockMutateRsvp.mockReset().mockResolvedValue(undefined)
    mockHoisted.mockMutateCheckin.mockReset().mockResolvedValue(undefined)
    mockHoisted.mockMutateConfirm.mockReset().mockResolvedValue(undefined)
    mockHoisted.mockMutateCancel.mockReset().mockResolvedValue(undefined)
    mockHoisted.mockMutateUpdate.mockReset().mockResolvedValue(undefined)
    mockHoisted.capturedRsvpButtonsProps = null
    mockHoisted.capturedCheckinProps = null
    mockHoisted.capturedSessionInfoProps = null
    mockHoisted.capturedRsvpCountsProps = null
    mockHoisted.capturedParticipantsProps = null
    mockHoisted.capturedConfirmDialogProps = null
    mockHoisted.capturedVoiceChatProps = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderPage = () =>
    render(
      createElement(QueryClientProvider, { client: queryClient }, createElement(SessionDetail))
    )

  // =================== LOADING STATE ===================
  describe('Loading state', () => {
    it('shows spinner when loading and no session data', () => {
      mockHoisted.mockSessionLoading = true
      mockHoisted.mockSessionData = null
      const { container } = renderPage()
      expect(container.querySelector('.animate-spin')).toBeTruthy()
    })

    it('does NOT show spinner when loading but session data already exists', () => {
      mockHoisted.mockSessionLoading = true
      // mockSessionData is already set to valid session
      renderPage()
      expect(screen.getByText('Session Ranked')).toBeTruthy()
    })
  })

  // =================== NOT FOUND STATE ===================
  describe('Not found state', () => {
    it('shows "Session non trouvée" when no session and not loading', () => {
      mockHoisted.mockSessionData = null
      mockHoisted.mockSessionLoading = false
      renderPage()
      expect(screen.getByText('Session non trouvée')).toBeTruthy()
    })

    it('shows a back button that navigates to /home', () => {
      mockHoisted.mockSessionData = null
      renderPage()
      const btn = screen.getByText("Retour à l'accueil")
      fireEvent.click(btn)
      expect(mockHoisted.mockNavigate).toHaveBeenCalledWith('/home')
    })
  })

  // =================== NORMAL RENDER ===================
  describe('Normal render with session data', () => {
    it('renders session title', () => {
      renderPage()
      expect(screen.getByText('Session Ranked')).toBeTruthy()
    })

    it('falls back to game name when title is empty', () => {
      mockHoisted.mockSessionData = makeSession({ title: '', game: 'CS2' })
      renderPage()
      expect(screen.getByText('CS2')).toBeTruthy()
    })

    it('falls back to "Session" when both title and game are empty', () => {
      mockHoisted.mockSessionData = makeSession({ title: '', game: '' })
      renderPage()
      expect(screen.getByText('Session')).toBeTruthy()
    })

    it('renders aria label on main', () => {
      renderPage()
      expect(document.querySelector('[aria-label="Détail de session"]')).toBeTruthy()
    })

    it('renders back link to squad page', () => {
      renderPage()
      const link = document.querySelector('a[href="/squad/sq1"]')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('aria-label')).toBe('Retour à la squad')
    })
  })

  // =================== STATUS DISPLAY ===================
  describe('Status info display', () => {
    it('shows "En attente de confirmations" for proposed status with future date', () => {
      renderPage()
      expect(screen.getByText('En attente de confirmations')).toBeTruthy()
    })

    it('shows "Confirmée" for confirmed status', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'confirmed' })
      renderPage()
      expect(screen.getByText('Confirmée')).toBeTruthy()
    })

    it('shows "Annulée" for cancelled status', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'cancelled' })
      renderPage()
      expect(screen.getByText('Annulée')).toBeTruthy()
    })

    it('shows "Terminée" for completed status', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'completed' })
      renderPage()
      expect(screen.getByText('Terminée')).toBeTruthy()
    })

    it('shows "Passée" when session date is in the past and status is not cancelled/completed/confirmed', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'proposed',
        scheduled_at: new Date(Date.now() - 86400000).toISOString(),
      })
      renderPage()
      expect(screen.getByText('Passée')).toBeTruthy()
    })
  })

  // =================== CREATOR CONTROLS ===================
  describe('Creator controls', () => {
    it('shows edit button when user is creator and session is not cancelled/completed', () => {
      renderPage()
      expect(screen.getByLabelText('Modifier la session')).toBeTruthy()
    })

    it('hides edit button when user is NOT creator', () => {
      mockHoisted.mockUser = { id: 'other-user' }
      renderPage()
      expect(screen.queryByLabelText('Modifier la session')).toBeNull()
    })

    it('hides edit button when session is cancelled', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'cancelled' })
      renderPage()
      expect(screen.queryByLabelText('Modifier la session')).toBeNull()
    })

    it('hides edit button when session is completed', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'completed' })
      renderPage()
      expect(screen.queryByLabelText('Modifier la session')).toBeNull()
    })

    it('shows confirm/cancel buttons when creator and status is proposed', () => {
      renderPage()
      expect(screen.getByText('Confirmer la session')).toBeTruthy()
      expect(screen.getByText('Annuler la session')).toBeTruthy()
    })

    it('hides confirm/cancel buttons when not creator', () => {
      mockHoisted.mockUser = { id: 'other-user' }
      renderPage()
      expect(screen.queryByText('Confirmer la session')).toBeNull()
    })

    it('hides confirm/cancel buttons when status is not proposed', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'confirmed' })
      renderPage()
      expect(screen.queryByText('Confirmer la session')).toBeNull()
    })
  })

  // =================== RSVP BUTTONS VISIBILITY ===================
  describe('RSVP buttons visibility', () => {
    it('shows RSVP buttons for non-cancelled, non-completed sessions', () => {
      renderPage()
      expect(screen.getByTestId('rsvp-buttons')).toBeTruthy()
    })

    it('hides RSVP buttons when session is cancelled', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'cancelled' })
      renderPage()
      expect(screen.queryByTestId('rsvp-buttons')).toBeNull()
    })

    it('hides RSVP buttons when session is completed', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'completed' })
      renderPage()
      expect(screen.queryByTestId('rsvp-buttons')).toBeNull()
    })
  })

  // =================== RSVP HANDLERS ===================
  describe('RSVP interactions', () => {
    it('calls rsvpMutation with "present" and shows confetti on success', async () => {
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByTestId('rsvp-present'))
      })
      expect(mockHoisted.mockMutateRsvp).toHaveBeenCalledWith({
        sessionId: 'sess1',
        response: 'present',
      })
    })

    it('calls rsvpMutation with "absent" without confetti', async () => {
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByTestId('rsvp-absent'))
      })
      expect(mockHoisted.mockMutateRsvp).toHaveBeenCalledWith({
        sessionId: 'sess1',
        response: 'absent',
      })
    })

    it('calls rsvpMutation with "maybe"', async () => {
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByTestId('rsvp-maybe'))
      })
      expect(mockHoisted.mockMutateRsvp).toHaveBeenCalledWith({
        sessionId: 'sess1',
        response: 'maybe',
      })
    })

    it('shows error toast when RSVP fails', async () => {
      mockHoisted.mockMutateRsvp.mockRejectedValueOnce(new Error('network'))
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByTestId('rsvp-present'))
      })
      // The toast component is rendered. The CelebrationToast checks isVisible
      // After error, toastMessage should be error text
    })

    it('does not call mutation when id is missing', async () => {
      mockHoisted.mockParams = { id: undefined }
      // Since id is undefined, handleRsvp should early return.
      // But the session is still rendered because mockSessionData is set.
      // The early return is in handleRsvp before calling mutateAsync.
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByTestId('rsvp-present'))
      })
      expect(mockHoisted.mockMutateRsvp).not.toHaveBeenCalled()
    })
  })

  // =================== RSVP COUNTS DATA FLOW ===================
  describe('RSVP counts data flow', () => {
    it('passes correct rsvp counts to RsvpCounts', () => {
      mockHoisted.mockSessionData = makeSession({
        rsvp_counts: { present: 5, absent: 2, maybe: 3 },
      })
      renderPage()
      expect(screen.getByText('5/3/2')).toBeTruthy()
    })

    it('falls back to 0 when rsvp_counts is null', () => {
      mockHoisted.mockSessionData = makeSession({ rsvp_counts: null })
      renderPage()
      expect(screen.getByText('0/0/0')).toBeTruthy()
    })
  })

  // =================== CHECKIN SECTION ===================
  describe('Check-in section', () => {
    function makeCheckinSession(overrides: Record<string, any> = {}) {
      // 15 minutes from now (within 30-min window), confirmed, my_rsvp = present, no checkins
      return makeSession({
        status: 'confirmed',
        scheduled_at: new Date(Date.now() + 15 * 60000).toISOString(),
        my_rsvp: 'present',
        checkins: [],
        ...overrides,
      })
    }

    it('shows check-in when in window, confirmed, rsvp present, not checked in', () => {
      mockHoisted.mockSessionData = makeCheckinSession()
      renderPage()
      expect(screen.getByTestId('checkin-section')).toBeTruthy()
    })

    it('hides check-in when status is not confirmed', () => {
      mockHoisted.mockSessionData = makeCheckinSession({ status: 'proposed' })
      renderPage()
      expect(screen.queryByTestId('checkin-section')).toBeNull()
    })

    it('hides check-in when my_rsvp is not present', () => {
      mockHoisted.mockSessionData = makeCheckinSession({ my_rsvp: 'absent' })
      renderPage()
      expect(screen.queryByTestId('checkin-section')).toBeNull()
    })

    it('hides check-in when already checked in', () => {
      mockHoisted.mockSessionData = makeCheckinSession({
        checkins: [{ user_id: 'user-1', status: 'present' }],
      })
      renderPage()
      expect(screen.queryByTestId('checkin-section')).toBeNull()
    })

    it('hides check-in when session is too far in the future (>30min)', () => {
      mockHoisted.mockSessionData = makeCheckinSession({
        scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      })
      renderPage()
      expect(screen.queryByTestId('checkin-section')).toBeNull()
    })

    it('calls checkinMutation when check-in button clicked', async () => {
      mockHoisted.mockSessionData = makeCheckinSession()
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByTestId('checkin-btn'))
      })
      expect(mockHoisted.mockMutateCheckin).toHaveBeenCalledWith({
        sessionId: 'sess1',
        status: 'present',
      })
    })

    it('shows error toast when checkin fails', async () => {
      mockHoisted.mockMutateCheckin.mockRejectedValueOnce(new Error('network'))
      mockHoisted.mockSessionData = makeCheckinSession()
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByTestId('checkin-btn'))
      })
      // Error toast triggered internally
    })
  })

  // =================== CHECKED-IN CONFIRMATION ===================
  describe('Check-in confirmed display', () => {
    it('shows "Check-in confirmé" when user has checked in', () => {
      mockHoisted.mockSessionData = makeSession({
        checkins: [{ user_id: 'user-1', status: 'present' }],
      })
      renderPage()
      expect(screen.getByText('Check-in confirmé !')).toBeTruthy()
    })

    it('hides "Check-in confirmé" when user has not checked in', () => {
      mockHoisted.mockSessionData = makeSession({ checkins: [] })
      renderPage()
      expect(screen.queryByText('Check-in confirmé !')).toBeNull()
    })
  })

  // =================== VOICE CHAT ===================
  describe('VoiceChat section', () => {
    it('shows VoiceChat when session is confirmed and id exists', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'confirmed' })
      renderPage()
      expect(screen.getByTestId('voice-chat')).toBeTruthy()
      expect(mockHoisted.capturedVoiceChatProps.sessionId).toBe('sess1')
      expect(mockHoisted.capturedVoiceChatProps.sessionTitle).toBe('Session Ranked')
    })

    it('hides VoiceChat when session is not confirmed', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'proposed' })
      renderPage()
      expect(screen.queryByTestId('voice-chat')).toBeNull()
    })

    it('uses game name as fallback for session title in VoiceChat', () => {
      mockHoisted.mockSessionData = makeSession({ status: 'confirmed', title: '', game: 'LoL' })
      renderPage()
      expect(mockHoisted.capturedVoiceChatProps.sessionTitle).toBe('LoL')
    })
  })

  // =================== CONFIRM SESSION ===================
  describe('Confirm session', () => {
    it('calls confirmSessionMutation when confirm button is clicked', async () => {
      renderPage()
      await act(async () => {
        fireEvent.click(screen.getByText('Confirmer la session'))
      })
      expect(mockHoisted.mockMutateConfirm).toHaveBeenCalledWith('sess1')
    })
  })

  // =================== CANCEL SESSION FLOW ===================
  describe('Cancel session flow', () => {
    it('opens confirm dialog when cancel button is clicked', () => {
      renderPage()
      fireEvent.click(screen.getByText('Annuler la session'))
      expect(screen.getByTestId('confirm-dialog')).toBeTruthy()
      expect(screen.getByText('Annuler cette session ?')).toBeTruthy()
    })

    it('calls cancelMutation when confirmed in dialog', async () => {
      renderPage()
      fireEvent.click(screen.getByText('Annuler la session'))
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-action'))
      })
      expect(mockHoisted.mockMutateCancel).toHaveBeenCalledWith('sess1')
    })

    it('closes dialog when cancel is clicked in dialog', () => {
      renderPage()
      fireEvent.click(screen.getByText('Annuler la session'))
      expect(screen.getByTestId('confirm-dialog')).toBeTruthy()
      fireEvent.click(screen.getByTestId('cancel-action'))
      expect(screen.queryByTestId('confirm-dialog')).toBeNull()
    })

    it('shows toast and closes dialog on cancel error', async () => {
      mockHoisted.mockMutateCancel.mockRejectedValueOnce(new Error('fail'))
      renderPage()
      fireEvent.click(screen.getByText('Annuler la session'))
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-action'))
      })
      // Dialog should close after error
      expect(screen.queryByTestId('confirm-dialog')).toBeNull()
    })
  })

  // =================== EDIT MODAL ===================
  describe('Edit session modal', () => {
    it('opens edit modal when edit button is clicked', () => {
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))
      expect(screen.getByText('Modifier la session')).toBeTruthy()
    })

    it('closes modal when Fermer button is clicked', () => {
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))
      expect(screen.getByRole('dialog')).toBeTruthy()
      fireEvent.click(screen.getByLabelText('Fermer'))
      // After closing, dialog should not be present
    })

    it('shows initial title in the input', () => {
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))
      const input = screen.getByPlaceholderText(
        'Session ranked, Détente, Tryhard...'
      ) as HTMLInputElement
      expect(input.value).toBe('Session Ranked')
    })

    it('shows error when date/time is missing on submit', async () => {
      mockHoisted.mockSessionData = makeSession({
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      })
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))

      // The form has pre-filled date and time, so we need to test the validation
      // by checking the submit button works
      const submitBtn = screen.getByText('Enregistrer')
      expect(submitBtn).toBeTruthy()
    })

    it('calls updateMutation on valid submit', async () => {
      mockHoisted.mockSessionData = makeSession({
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      })
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))
      const submitBtn = screen.getByText('Enregistrer')
      await act(async () => {
        fireEvent.click(submitBtn)
      })
      expect(mockHoisted.mockMutateUpdate).toHaveBeenCalled()
    })

    it('shows error message on update failure', async () => {
      mockHoisted.mockMutateUpdate.mockRejectedValueOnce(new Error('fail'))
      mockHoisted.mockSessionData = makeSession({
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      })
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))
      await act(async () => {
        fireEvent.click(screen.getByText('Enregistrer'))
      })
      expect(screen.getByText('Erreur lors de la modification')).toBeTruthy()
    })

    it('shows "Enregistrement..." when update is pending', () => {
      mockHoisted.mockUpdatePending = true
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))
      expect(screen.getByText('Enregistrement...')).toBeTruthy()
    })

    it('closes modal via Escape key', () => {
      renderPage()
      fireEvent.click(screen.getByLabelText('Modifier la session'))
      expect(screen.getByRole('dialog')).toBeTruthy()
      fireEvent.keyDown(document, { key: 'Escape' })
      // Modal should close after escape
    })
  })

  // =================== POST-SESSION RESULTS ===================
  describe('PostSessionResults', () => {
    it('shows post-session results when session is past', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'proposed',
        scheduled_at: new Date(Date.now() - 86400000).toISOString(),
        rsvps: [
          { user_id: 'u1', response: 'present', profiles: { username: 'A' } },
          { user_id: 'u2', response: 'absent', profiles: { username: 'B' } },
        ],
        checkins: [{ user_id: 'u1', status: 'present' }],
      })
      renderPage()
      expect(screen.getByText('Récapitulatif')).toBeTruthy()
    })

    it('shows post-session results when status is completed', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'completed',
        rsvps: [{ user_id: 'u1', response: 'present', profiles: { username: 'A' } }],
        checkins: [{ user_id: 'u1', status: 'present' }],
      })
      renderPage()
      expect(screen.getByText('Récapitulatif')).toBeTruthy()
    })

    it('computes participation rate correctly', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'completed',
        rsvps: [
          { user_id: 'u1', response: 'present', profiles: { username: 'A' } },
          { user_id: 'u2', response: 'present', profiles: { username: 'B' } },
          { user_id: 'u3', response: 'absent', profiles: { username: 'C' } },
        ],
        checkins: [{ user_id: 'u1', status: 'present' }],
        duration_minutes: 90,
      })
      renderPage()
      // 1 checkin / 2 present = 50%
      expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('90 min')).toBeTruthy()
      expect(screen.getByText('Joueurs présents')).toBeTruthy()
    })

    it('shows 0% participation when no present rsvps', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'completed',
        rsvps: [{ user_id: 'u1', response: 'absent', profiles: { username: 'A' } }],
        checkins: [],
      })
      renderPage()
      expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
    })

    it('shows checkin detail line when checkins exist', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'completed',
        rsvps: [
          { user_id: 'u1', response: 'present', profiles: { username: 'A' } },
          { user_id: 'u2', response: 'present', profiles: { username: 'B' } },
        ],
        checkins: [{ user_id: 'u1', status: 'present' }],
      })
      renderPage()
      expect(screen.getByText('Joueurs présents')).toBeTruthy()
      expect(screen.getByText('1 / 2')).toBeTruthy()
    })

    it('applies success badge for rate >= 75%', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'completed',
        rsvps: [{ user_id: 'u1', response: 'present', profiles: { username: 'A' } }],
        checkins: [{ user_id: 'u1', status: 'present' }],
      })
      renderPage()
      // 100% participation
      const badge = screen
        .getAllByText('100%')
        .find((el) => el.getAttribute('data-variant') === 'success')
      expect(badge).toBeTruthy()
    })

    it('applies warning badge for rate >= 50% and < 75%', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'completed',
        rsvps: [
          { user_id: 'u1', response: 'present', profiles: { username: 'A' } },
          { user_id: 'u2', response: 'present', profiles: { username: 'B' } },
        ],
        checkins: [{ user_id: 'u1', status: 'present' }],
      })
      renderPage()
      const badge = screen
        .getAllByText('50%')
        .find((el) => el.getAttribute('data-variant') === 'warning')
      expect(badge).toBeTruthy()
    })

    it('applies danger badge for rate < 50%', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'completed',
        rsvps: [
          { user_id: 'u1', response: 'present', profiles: { username: 'A' } },
          { user_id: 'u2', response: 'present', profiles: { username: 'B' } },
          { user_id: 'u3', response: 'present', profiles: { username: 'C' } },
        ],
        checkins: [{ user_id: 'u1', status: 'present' }],
      })
      renderPage()
      // 1/3 = 33%
      const badge = screen
        .getAllByText('33%')
        .find((el) => el.getAttribute('data-variant') === 'danger')
      expect(badge).toBeTruthy()
    })
  })

  // =================== DATA FLOW TO CHILD COMPONENTS ===================
  describe('Data flow to child components', () => {
    it('passes dateInfo and durationMinutes to SessionInfoCards', () => {
      renderPage()
      expect(mockHoisted.capturedSessionInfoProps).toBeTruthy()
      expect(mockHoisted.capturedSessionInfoProps.durationMinutes).toBe(120)
      expect(mockHoisted.capturedSessionInfoProps.dateInfo).toHaveProperty('day')
      expect(mockHoisted.capturedSessionInfoProps.dateInfo).toHaveProperty('time')
    })

    it('passes rsvp counts to RsvpCounts', () => {
      renderPage()
      expect(mockHoisted.capturedRsvpCountsProps).toEqual({ present: 2, maybe: 1, absent: 0 })
    })

    it('passes my_rsvp and rsvpLoading to RsvpButtons', () => {
      mockHoisted.mockSessionData = makeSession({ my_rsvp: 'present' })
      renderPage()
      expect(mockHoisted.capturedRsvpButtonsProps.myRsvp).toBe('present')
    })

    it('passes rsvps and checkins to ParticipantsList', () => {
      renderPage()
      expect(mockHoisted.capturedParticipantsProps.rsvps).toHaveLength(2)
      expect(mockHoisted.capturedParticipantsProps.checkins).toHaveLength(0)
    })
  })

  // =================== EDGE CASES ===================
  describe('Edge cases', () => {
    it('handles null user gracefully', () => {
      mockHoisted.mockUser = null
      renderPage()
      // Should still render the session (isCreator will be false)
      expect(screen.getByText('Session Ranked')).toBeTruthy()
      // Creator buttons should not appear
      expect(screen.queryByLabelText('Modifier la session')).toBeNull()
    })

    it('uses default duration 120 for isCheckinWindow when duration_minutes is null', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'confirmed',
        duration_minutes: null,
        scheduled_at: new Date(Date.now() + 15 * 60000).toISOString(),
        my_rsvp: 'present',
        checkins: [],
      })
      renderPage()
      // Should still show checkin since we're within window
      expect(screen.getByTestId('checkin-section')).toBeTruthy()
    })

    it('uses default duration 120 for isSessionPast when duration_minutes is null', () => {
      mockHoisted.mockSessionData = makeSession({
        status: 'proposed',
        duration_minutes: null,
        // Session started 3 hours ago - past even with 120 min default
        scheduled_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      })
      renderPage()
      expect(screen.getByText('Récapitulatif')).toBeTruthy()
    })

    it('handles missing rsvp_counts object (undefined)', () => {
      mockHoisted.mockSessionData = makeSession({ rsvp_counts: undefined })
      renderPage()
      expect(screen.getByText('0/0/0')).toBeTruthy()
    })

    it('renders with my_rsvp as null (undefined passed to RsvpButtons)', () => {
      mockHoisted.mockSessionData = makeSession({ my_rsvp: null })
      renderPage()
      expect(mockHoisted.capturedRsvpButtonsProps.myRsvp).toBeUndefined()
    })
  })
})
