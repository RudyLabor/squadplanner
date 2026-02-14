import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { NativeVoiceChat } from '../NativeVoiceChat'

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
  Phone: (props: any) => createElement('svg', { 'data-testid': 'icon-phone', ...props }),
  PhoneOff: (props: any) => createElement('svg', { 'data-testid': 'icon-phoneoff', ...props }),
  Mic: (props: any) => createElement('svg', { 'data-testid': 'icon-mic', ...props }),
  MicOff: (props: any) => createElement('svg', { 'data-testid': 'icon-micoff', ...props }),
  Volume2: (props: any) => createElement('svg', { 'data-testid': 'icon-volume', ...props }),
}))

// Use vi.hoisted to create mock functions that can be referenced in vi.mock
const { mockConnect, mockDisconnect, mockToggleMute } = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue(true),
  mockDisconnect: vi.fn(),
  mockToggleMute: vi.fn(),
}))

// Mock useNativeWebRTC
vi.mock('../../../lib/webrtc-native', () => ({
  useNativeWebRTC: vi.fn().mockReturnValue({
    connect: mockConnect,
    disconnect: mockDisconnect,
    toggleMute: mockToggleMute,
    isConnected: false,
    isMuted: false,
    remoteUsers: [],
  }),
}))

// Mock AppleButton
vi.mock('../../../lib/motionApple', () => ({
  AppleButton: ({ children, onClick, className, variant, ...props }: any) =>
    createElement('button', { onClick, className, ...props }, children),
}))

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  roomName: 'test-room',
  token: 'test-token',
  userName: 'TestUser',
}

describe('NativeVoiceChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing when open', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    expect(screen.getByText('TestUser')).toBeInTheDocument()
  })

  it('returns null when not open', () => {
    const { container } = render(<NativeVoiceChat {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('displays the user name', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    expect(screen.getByText('TestUser')).toBeInTheDocument()
  })

  it('displays initial letter in avatar', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows connection state text', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    // Initially should show connecting since isOpen + token + roomName triggers connect
    expect(screen.getByText('Connexion...')).toBeInTheDocument()
  })

  it('renders mic toggle button', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    expect(screen.getByTestId('icon-mic')).toBeInTheDocument()
  })

  it('renders phone off (end call) button', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    expect(screen.getByTestId('icon-phoneoff')).toBeInTheDocument()
  })

  it('renders volume button', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    expect(screen.getByTestId('icon-volume')).toBeInTheDocument()
  })

  it('calls connect when opened with valid token and roomName', () => {
    render(<NativeVoiceChat {...defaultProps} />)
    expect(mockConnect).toHaveBeenCalledWith('test-token', 'test-room')
  })
})
