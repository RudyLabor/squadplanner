import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null, reliability_score: 85, total_sessions: 10, created_at: new Date().toISOString() }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn(),
}))

// Mock haptics
vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

// Mock voice call store
vi.mock('../../hooks/useVoiceCall', () => ({
  useVoiceCallStore: vi.fn().mockReturnValue({
    status: 'idle',
    isMuted: false,
    isSpeakerOn: false,
    callDuration: 0,
    caller: null,
    receiver: null,
    isIncoming: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    networkQualityChanged: null,
    toggleMute: vi.fn(),
    toggleSpeaker: vi.fn(),
    endCall: vi.fn(),
    clearNetworkQualityNotification: vi.fn(),
  }),
  formatCallDuration: vi.fn().mockReturnValue('0:00'),
}))

// Mock network quality
vi.mock('../../hooks/useNetworkQuality', () => ({
  useNetworkQualityStore: vi.fn().mockReturnValue({ localQuality: 'unknown' }),
}))

// Mock focus trap
vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn().mockReturnValue({ current: null }),
}))

// Mock call sub-components
vi.mock('../call/CallToast', () => ({
  CallToast: () => null,
}))
vi.mock('../call/CallAvatar', () => ({
  CallAvatar: () => createElement('div', null, 'avatar'),
}))
vi.mock('../call/CallControls', () => ({
  CallControls: () => createElement('div', null, 'controls'),
}))
vi.mock('../NetworkQualityIndicator', () => ({
  NetworkQualityIndicator: () => null,
  QualityChangeToast: () => null,
}))

// Import stores to modify return values per-test
import { useVoiceCallStore, formatCallDuration } from '../../hooks/useVoiceCall'
import { useNetworkQualityStore } from '../../hooks/useNetworkQuality'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { CallModal } from '../CallModal'

const mockUseVoiceCallStore = vi.mocked(useVoiceCallStore)
const mockUseNetworkQualityStore = vi.mocked(useNetworkQualityStore)
const mockFormatCallDuration = vi.mocked(formatCallDuration)
const mockUseFocusTrap = vi.mocked(useFocusTrap)

describe('CallModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseVoiceCallStore.mockReturnValue({
      status: 'idle',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: null,
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
  })

  it('renders without crash (idle state, returns null)', () => {
    const { container } = render(<CallModal />)
    // idle status should not render anything
    expect(container.innerHTML).toBe('')
  })

  it('returns null when status is idle', () => {
    const { container } = render(<CallModal />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when no receiver/caller info', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: null,
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    const { container } = render(<CallModal />)
    expect(container.innerHTML).toBe('')
  })

  it('renders modal when calling with receiver info', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: { username: 'Player2', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText(/Appel avec Player2/)).toBeInTheDocument()
  })

  it('renders controls sub-component', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: true,
      callDuration: 60,
      caller: null,
      receiver: { username: 'Player2', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('controls')).toBeInTheDocument()
  })

  it('renders avatar sub-component', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: { username: 'Player2', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('avatar')).toBeInTheDocument()
  })

  it('shows caller info for incoming calls', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 10,
      caller: { username: 'Caller1', avatar_url: null },
      receiver: { username: 'Me', avatar_url: null },
      isIncoming: true,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText(/Appel avec Caller1/)).toBeInTheDocument()
  })

  it('has proper dialog role', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: { username: 'Player2', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  // --- P1.1 Audit: renders nothing when no active call ---

  it('renders nothing when status is "ringing" (incoming only)', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: null,
      isIncoming: true,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    const { container } = render(<CallModal />)
    // 'ringing' is not in the shouldShow conditions (calling, connected, ended)
    expect(container.innerHTML).toBe('')
  })

  // --- P1.1 Audit: status text formatting ---

  it('shows "Appel en cours..." when status is calling', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('Appel en cours...')).toBeInTheDocument()
  })

  it('shows formatted duration when status is connected', () => {
    mockFormatCallDuration.mockReturnValue('2:45')
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 165,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('2:45')).toBeInTheDocument()
  })

  it('shows "Appel terminé" when status is ended', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'ended',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 60,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('Appel terminé')).toBeInTheDocument()
  })

  it('shows reconnection text with attempt count', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 30,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: true,
      reconnectAttempts: 2,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('Reconnexion... (2/3)')).toBeInTheDocument()
  })

  // --- P1.1 Audit: reconnection banner ---

  it('shows reconnection banner when isReconnecting is true', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 30,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: true,
      reconnectAttempts: 1,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('Reconnexion en cours...')).toBeInTheDocument()
  })

  // --- P1.1 Audit: close/hangup button ---

  it('shows cancel button when calling and calls endCall on click', () => {
    const endCallMock = vi.fn()
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: endCallMock,
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    const cancelBtn = screen.getByLabelText("Annuler l'appel")
    expect(cancelBtn).toBeInTheDocument()
    fireEvent.click(cancelBtn)
    expect(endCallMock).toHaveBeenCalledTimes(1)
  })

  it('does not show cancel button when connected', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 30,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.queryByLabelText("Annuler l'appel")).not.toBeInTheDocument()
  })

  // --- P1.1 Audit: focus trap ---

  it('initializes focus trap with shouldShow and endCall', () => {
    const endCallMock = vi.fn()
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: endCallMock,
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    // useFocusTrap should be called with shouldShow=true and the endCall callback
    expect(mockUseFocusTrap).toHaveBeenCalledWith(true, endCallMock)
  })

  it('passes shouldShow=false to focus trap when status is idle', () => {
    render(<CallModal />)
    expect(mockUseFocusTrap).toHaveBeenCalledWith(false, expect.any(Function))
  })

  // --- P1.1 Audit: aria-labelledby ---

  it('has aria-labelledby pointing to call-modal-title', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'calling',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
      caller: null,
      receiver: { username: 'Alice', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'call-modal-title')
  })

  // --- P1.1 Audit: initial character fallback ---

  it('shows first initial of username for incoming call', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 10,
      caller: { username: 'Zara', avatar_url: null },
      receiver: { username: 'Me', avatar_url: null },
      isIncoming: true,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    expect(screen.getByText('Appel avec Zara')).toBeInTheDocument()
  })

  // --- P1.1 Audit: volume and speaker in controls ---

  it('renders with volume and speaker props passed to controls', () => {
    mockUseVoiceCallStore.mockReturnValue({
      status: 'connected',
      isMuted: false,
      isSpeakerOn: true,
      volume: 75,
      callDuration: 10,
      caller: null,
      receiver: { username: 'Bob', avatar_url: null },
      isIncoming: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      toggleMute: vi.fn(),
      toggleSpeaker: vi.fn(),
      endCall: vi.fn(),
      setVolume: vi.fn(),
      clearNetworkQualityNotification: vi.fn(),
    } as any)
    render(<CallModal />)
    // Controls sub-component should be rendered
    expect(screen.getByText('controls')).toBeInTheDocument()
  })
})
