import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { VoiceWaveform, VoiceWaveformDemo } from '../VoiceWaveform'

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

// Mock useAudioAnalyser
vi.mock('../../hooks/useAudioAnalyser', () => ({
  useAudioAnalyser: vi.fn().mockReturnValue({
    frequencyData: new Uint8Array(128).fill(0),
    volumeLevel: 'silent',
    isSpeaking: false,
  }),
}))

describe('VoiceWaveform', () => {
  it('renders without crashing', () => {
    const { container } = render(<VoiceWaveform isActive={false} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with default props', () => {
    const { container } = render(<VoiceWaveform isActive={false} />)
    // Should render with aria-hidden
    const waveform = container.querySelector('[aria-hidden="true"]')
    expect(waveform).toBeInTheDocument()
  })

  it('renders correct number of bars (default 5)', () => {
    const { container } = render(<VoiceWaveform isActive={false} />)
    const bars = container.querySelectorAll('.rounded-full')
    expect(bars.length).toBe(5)
  })

  it('renders custom number of bars', () => {
    const { container } = render(<VoiceWaveform isActive={false} barCount={8} />)
    const bars = container.querySelectorAll('.rounded-full')
    expect(bars.length).toBe(8)
  })

  it('applies custom className', () => {
    const { container } = render(<VoiceWaveform isActive={false} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders in sm size', () => {
    const { container } = render(<VoiceWaveform isActive={false} size="sm" />)
    const waveform = container.firstChild as HTMLElement
    expect(waveform.style.height).toBe('24px')
  })

  it('renders in md size (default)', () => {
    const { container } = render(<VoiceWaveform isActive={false} size="md" />)
    const waveform = container.firstChild as HTMLElement
    expect(waveform.style.height).toBe('32px')
  })

  it('renders in lg size', () => {
    const { container } = render(<VoiceWaveform isActive={false} size="lg" />)
    const waveform = container.firstChild as HTMLElement
    expect(waveform.style.height).toBe('48px')
  })

  it('renders with active state', () => {
    const { container } = render(<VoiceWaveform isActive={true} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with custom color', () => {
    const { container } = render(<VoiceWaveform isActive={false} color="red" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('is hidden from assistive technology', () => {
    const { container } = render(<VoiceWaveform isActive={false} />)
    const element = container.querySelector('[aria-hidden="true"]')
    expect(element).toBeInTheDocument()
  })
})

describe('VoiceWaveformDemo', () => {
  it('renders without crashing', () => {
    const { container } = render(<VoiceWaveformDemo isActive={false} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders correct number of bars', () => {
    const { container } = render(<VoiceWaveformDemo isActive={false} barCount={6} />)
    const bars = container.querySelectorAll('.rounded-full')
    expect(bars.length).toBe(6)
  })

  it('renders in active state', () => {
    const { container } = render(<VoiceWaveformDemo isActive={true} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('is hidden from assistive technology', () => {
    const { container } = render(<VoiceWaveformDemo isActive={false} />)
    const element = container.querySelector('[aria-hidden="true"]')
    expect(element).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<VoiceWaveformDemo isActive={false} className="demo-waveform" />)
    expect(container.firstChild).toHaveClass('demo-waveform')
  })
})
