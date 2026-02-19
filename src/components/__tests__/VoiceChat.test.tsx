import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { VoiceChat } from '../VoiceChat'

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

// Mock UI components
vi.mock('../ui', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) =>
    createElement('button', { onClick, disabled, className, ...props }, children),
}))

// Mock hooks
vi.mock('../../hooks', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'TestUser' },
  }),
  usePremiumStore: vi.fn().mockReturnValue({ hasPremium: false }),
}))

// Use vi.hoisted for mock functions referenced inside vi.mock factory
const { mockJoinChannel, mockLeaveChannel, mockToggleMute, mockClearError } = vi.hoisted(() => ({
  mockJoinChannel: vi.fn(),
  mockLeaveChannel: vi.fn(),
  mockToggleMute: vi.fn(),
  mockClearError: vi.fn(),
}))

vi.mock('../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: vi.fn().mockReturnValue({
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    localUser: null,
    remoteUsers: [],
    error: null,
    joinChannel: mockJoinChannel,
    leaveChannel: mockLeaveChannel,
    toggleMute: mockToggleMute,
    clearError: mockClearError,
  }),
}))

import { useVoiceChatStore } from '../../hooks/useVoiceChat'
import { usePremiumStore } from '../../hooks'
const mockUseVoiceChatStore = vi.mocked(useVoiceChatStore)
const mockUsePremiumStore = vi.mocked(usePremiumStore)

describe('VoiceChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Chat Vocal')).toBeInTheDocument()
  })

  it('shows "Chat Vocal" when disconnected', () => {
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Chat Vocal')).toBeInTheDocument()
  })

  it('shows join button when not connected', () => {
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Rejoindre le vocal')).toBeInTheDocument()
  })

  it('shows descriptive text when disconnected', () => {
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText(/Rejoins le vocal pour parler avec ta squad/)).toBeInTheDocument()
  })

  it('shows session title when provided', () => {
    render(<VoiceChat sessionId="session-1" sessionTitle="Ranked Duo" />)
    expect(screen.getByText('Session: Ranked Duo')).toBeInTheDocument()
  })

  it('does not show session title when not provided', () => {
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.queryByText(/Session:/)).not.toBeInTheDocument()
  })

  it('calls joinChannel when join button is clicked', () => {
    render(<VoiceChat sessionId="session-1" />)
    fireEvent.click(screen.getByText('Rejoindre le vocal'))
    expect(mockJoinChannel).toHaveBeenCalledWith('session-session-1', 'user-1', 'TestUser', false)
  })

  // --- P1.1 Audit: connected state rendering with participant count ---

  it('shows "Vocal connecté" when connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Vocal connecté')).toBeInTheDocument()
  })

  it('shows participant count when connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [
        { odrop: 'user-2', username: 'Player2', isMuted: false, isSpeaking: false, volume: 100 },
        { odrop: 'user-3', username: 'Player3', isMuted: true, isSpeaking: false, volume: 100 },
      ],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('3 participants')).toBeInTheDocument()
  })

  it('shows singular "participant" for single user', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('1 participant')).toBeInTheDocument()
  })

  // --- P1.1 Audit: participant list with speaking indicators ---

  it('renders participant list with usernames', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [
        { odrop: 'user-2', username: 'GamerPro', isMuted: false, isSpeaking: true, volume: 100 },
      ],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('TestUser')).toBeInTheDocument()
    expect(screen.getByText('GamerPro')).toBeInTheDocument()
  })

  it('shows "(toi)" label next to local user', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('(toi)')).toBeInTheDocument()
  })

  it('shows first initial of each participant', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [
        { odrop: 'user-2', username: 'Alex', isMuted: false, isSpeaking: false, volume: 100 },
      ],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  // --- P1.1 Audit: error display with dismiss button ---

  it('shows error message when error is present', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      localUser: null,
      remoteUsers: [],
      error: 'Impossible de se connecter au vocal',
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Impossible de se connecter au vocal')).toBeInTheDocument()
  })

  it('shows dismiss button for errors and calls clearError on click', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      localUser: null,
      remoteUsers: [],
      error: 'Connection failed',
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    const dismissBtn = screen.getByText('Fermer')
    expect(dismissBtn).toBeInTheDocument()
    fireEvent.click(dismissBtn)
    expect(mockClearError).toHaveBeenCalledTimes(1)
  })

  it('does not show error when error is null', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      localUser: null,
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.queryByText('Fermer')).not.toBeInTheDocument()
  })

  // --- P1.1 Audit: mute toggle behavior ---

  it('shows "Micro" button when unmuted and connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Micro')).toBeInTheDocument()
  })

  it('shows "Muet" button when muted and connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: true,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: true, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Muet')).toBeInTheDocument()
  })

  it('calls toggleMute when mute button is clicked', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    fireEvent.click(screen.getByText('Micro'))
    expect(mockToggleMute).toHaveBeenCalledTimes(1)
  })

  // --- P1.1 Audit: premium HD audio quality ---

  it('passes hasPremium=true to joinChannel for premium users', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      localUser: null,
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    mockUsePremiumStore.mockReturnValue({ hasPremium: true } as any)
    render(<VoiceChat sessionId="session-1" />)
    fireEvent.click(screen.getByText('Rejoindre le vocal'))
    expect(mockJoinChannel).toHaveBeenCalledWith('session-session-1', 'user-1', 'TestUser', true)
  })

  // --- P1.1 Audit: leave channel button ---

  it('shows leave button when connected and calls leaveChannel', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    const leaveBtn = screen.getByLabelText('Quitter le vocal')
    expect(leaveBtn).toBeInTheDocument()
    fireEvent.click(leaveBtn)
    expect(mockLeaveChannel).toHaveBeenCalledTimes(1)
  })

  // --- P1.1 Audit: connecting state ---

  it('shows "Connexion..." text when connecting', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      isMuted: false,
      localUser: null,
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    expect(screen.getByText('Connexion...')).toBeInTheDocument()
  })

  it('disables join button when connecting', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      isMuted: false,
      localUser: null,
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    render(<VoiceChat sessionId="session-1" />)
    const joinBtn = screen.getByText('Connexion...').closest('button')
    expect(joinBtn).toHaveAttribute('disabled')
  })

  // --- P1.1 Audit: channel cleanup on unmount ---

  it('calls leaveChannel on unmount when connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isMuted: false,
      localUser: { odrop: 'user-1', username: 'TestUser', isMuted: false, isSpeaking: false, volume: 100 },
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    const { unmount } = render(<VoiceChat sessionId="session-1" />)
    unmount()
    expect(mockLeaveChannel).toHaveBeenCalled()
  })

  it('does NOT call leaveChannel on unmount when not connected', () => {
    mockUseVoiceChatStore.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      localUser: null,
      remoteUsers: [],
      error: null,
      joinChannel: mockJoinChannel,
      leaveChannel: mockLeaveChannel,
      toggleMute: mockToggleMute,
      clearError: mockClearError,
    } as any)
    const { unmount } = render(<VoiceChat sessionId="session-1" />)
    unmount()
    expect(mockLeaveChannel).not.toHaveBeenCalled()
  })
})
