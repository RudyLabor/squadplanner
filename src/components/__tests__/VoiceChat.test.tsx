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
})
