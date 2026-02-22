import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { VoiceMessagePlayer } from '../VoiceMessagePlayer'

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
vi.mock('../icons', () => ({
  Play: (props: any) => createElement('svg', { 'data-testid': 'icon-play', ...props }),
  Pause: (props: any) => createElement('svg', { 'data-testid': 'icon-pause', ...props }),
  Mic: (props: any) => createElement('svg', { 'data-testid': 'icon-mic', ...props }),
}))

// Mock HTMLAudioElement
beforeEach(() => {
  vi.stubGlobal(
    'HTMLAudioElement',
    vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      currentTime: 0,
      duration: 30,
      paused: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
})

describe('VoiceMessagePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<VoiceMessagePlayer />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders mic icon when no audio URL', () => {
    render(<VoiceMessagePlayer />)
    expect(screen.getByTestId('icon-mic')).toBeInTheDocument()
  })

  it('renders play button when voiceUrl is provided', () => {
    render(<VoiceMessagePlayer voiceUrl="https://example.com/audio.webm" duration={30} />)
    expect(screen.getByLabelText('Lire')).toBeInTheDocument()
  })

  it('shows play icon by default (not playing)', () => {
    render(<VoiceMessagePlayer voiceUrl="https://example.com/audio.webm" duration={30} />)
    expect(screen.getByTestId('icon-play')).toBeInTheDocument()
  })

  it('displays duration in formatted time', () => {
    render(<VoiceMessagePlayer voiceUrl="https://example.com/audio.webm" duration={90} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('displays 0:00 for zero duration', () => {
    render(<VoiceMessagePlayer voiceUrl="https://example.com/audio.webm" duration={0} />)
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('renders waveform bars', () => {
    const { container } = render(
      <VoiceMessagePlayer voiceUrl="https://example.com/audio.webm" duration={30} />
    )
    // 24 bars should be rendered
    const bars = container.querySelectorAll('.rounded-full')
    expect(bars.length).toBeGreaterThan(0)
  })

  it('renders audio element when voiceUrl is provided', () => {
    const { container } = render(
      <VoiceMessagePlayer voiceUrl="https://example.com/audio.webm" duration={30} />
    )
    const audio = container.querySelector('audio')
    expect(audio).toBeInTheDocument()
    expect(audio).toHaveAttribute('src', 'https://example.com/audio.webm')
  })

  it('does not render audio element when no voiceUrl', () => {
    const { container } = render(<VoiceMessagePlayer />)
    const audio = container.querySelector('audio')
    expect(audio).not.toBeInTheDocument()
  })

  it('disables play button when no audio URL', () => {
    render(<VoiceMessagePlayer />)
    const button = screen.getByLabelText('Lire')
    expect(button).toBeDisabled()
  })

  it('extracts duration from content if not provided', () => {
    render(<VoiceMessagePlayer content="Voice message (1:45)" />)
    expect(screen.getByText('1:45')).toBeInTheDocument()
  })
})
