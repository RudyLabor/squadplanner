import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { CallControls } from '../CallControls'

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
  PhoneOff: (props: any) => createElement('svg', { 'data-testid': 'icon-phoneoff', ...props }),
  Mic: (props: any) => createElement('svg', { 'data-testid': 'icon-mic', ...props }),
  MicOff: (props: any) => createElement('svg', { 'data-testid': 'icon-micoff', ...props }),
  Volume2: (props: any) => createElement('svg', { 'data-testid': 'icon-volume2', ...props }),
  VolumeX: (props: any) => createElement('svg', { 'data-testid': 'icon-volumex', ...props }),
}))

const defaultProps = {
  status: 'connected',
  isMuted: false,
  isSpeakerOn: true,
  toggleMute: vi.fn(),
  toggleSpeaker: vi.fn(),
  endCall: vi.fn(),
}

describe('CallControls', () => {
  it('renders without crashing', () => {
    const { container } = render(<CallControls {...defaultProps} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows end call button', () => {
    render(<CallControls {...defaultProps} />)
    expect(screen.getByLabelText('Raccrocher')).toBeInTheDocument()
  })

  it('calls endCall when end button is clicked', () => {
    render(<CallControls {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Raccrocher'))
    expect(defaultProps.endCall).toHaveBeenCalled()
  })

  it('shows mute button when connected', () => {
    render(<CallControls {...defaultProps} />)
    expect(screen.getByLabelText('Couper le micro')).toBeInTheDocument()
  })

  it('calls toggleMute when mute button is clicked', () => {
    render(<CallControls {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Couper le micro'))
    expect(defaultProps.toggleMute).toHaveBeenCalled()
  })

  it('shows unmute label when muted', () => {
    render(<CallControls {...defaultProps} isMuted={true} />)
    expect(screen.getByLabelText('Réactiver le micro')).toBeInTheDocument()
  })

  it('shows mic icon when not muted', () => {
    render(<CallControls {...defaultProps} isMuted={false} />)
    expect(screen.getByTestId('icon-mic')).toBeInTheDocument()
  })

  it('shows micoff icon when muted', () => {
    render(<CallControls {...defaultProps} isMuted={true} />)
    expect(screen.getByTestId('icon-micoff')).toBeInTheDocument()
  })

  it('shows speaker button when connected', () => {
    render(<CallControls {...defaultProps} />)
    expect(screen.getByLabelText('Désactiver le haut-parleur')).toBeInTheDocument()
  })

  it('calls toggleSpeaker when speaker button is clicked', () => {
    render(<CallControls {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Désactiver le haut-parleur'))
    expect(defaultProps.toggleSpeaker).toHaveBeenCalled()
  })

  it('does not show mute/speaker buttons when status is calling', () => {
    render(<CallControls {...defaultProps} status="calling" />)
    expect(screen.queryByLabelText('Couper le micro')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Désactiver le haut-parleur')).not.toBeInTheDocument()
  })

  it('shows hint text when calling', () => {
    render(<CallControls {...defaultProps} status="calling" />)
    expect(screen.getByText('En attente de réponse...')).toBeInTheDocument()
  })

  it('does not show hint text when connected', () => {
    render(<CallControls {...defaultProps} status="connected" />)
    expect(screen.queryByText('En attente de réponse...')).not.toBeInTheDocument()
  })

  it('has correct aria-pressed for mute button', () => {
    render(<CallControls {...defaultProps} isMuted={true} />)
    const muteBtn = screen.getByLabelText('Réactiver le micro')
    expect(muteBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('has correct aria-pressed for speaker button', () => {
    render(<CallControls {...defaultProps} isSpeakerOn={true} />)
    const speakerBtn = screen.getByLabelText('Désactiver le haut-parleur')
    expect(speakerBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
