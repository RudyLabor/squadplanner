import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

// Import useVoiceCallStore to modify return values per-test
import { useVoiceCallStore } from '../../hooks/useVoiceCall'
import { CallModal } from '../CallModal'

const mockUseVoiceCallStore = vi.mocked(useVoiceCallStore)

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
})
