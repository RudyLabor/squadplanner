import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

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
  Volume: (props: any) => createElement('svg', props),
  Volume1: (props: any) => createElement('svg', props),
  Volume2: (props: any) => createElement('svg', props),
  VolumeX: (props: any) => createElement('svg', props),
}))

// Mock Tooltip
vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

import { ParticipantVolumeControl } from '../ParticipantVolumeControl'

describe('ParticipantVolumeControl', () => {
  const defaultProps = {
    participantId: 'p1',
    participantName: 'Player One',
    onVolumeChange: vi.fn(),
    onMute: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders participant name', () => {
    render(createElement(ParticipantVolumeControl, defaultProps))
    expect(screen.getByText('Player One')).toBeDefined()
  })

  it('renders volume percentage display', () => {
    const { container } = render(createElement(ParticipantVolumeControl, defaultProps))
    // The full mode shows "100%" in a span with tabular-nums
    const volumeText = container.querySelector('.tabular-nums')
    expect(volumeText?.textContent).toContain('100%')
  })

  it('renders volume slider', () => {
    render(createElement(ParticipantVolumeControl, defaultProps))
    const slider = screen.getByLabelText('Volume de Player One')
    expect(slider).toBeDefined()
  })

  it('calls onMute when mute button is clicked', () => {
    render(createElement(ParticipantVolumeControl, defaultProps))
    const muteBtn = screen.getByLabelText('Couper le son')
    fireEvent.click(muteBtn)
    expect(defaultProps.onMute).toHaveBeenCalledWith('p1', true)
  })

  it('renders compact mode', () => {
    render(createElement(ParticipantVolumeControl, { ...defaultProps, compact: true }))
    const slider = screen.getByLabelText('Volume de Player One')
    expect(slider).toBeDefined()
  })

  it('shows 0% when muted', () => {
    const { container } = render(
      createElement(ParticipantVolumeControl, { ...defaultProps, isMuted: true })
    )
    const volumeText = container.querySelector('.tabular-nums')
    expect(volumeText?.textContent).toContain('0%')
  })

  it('calls onVolumeChange when slider is changed', () => {
    render(createElement(ParticipantVolumeControl, defaultProps))
    const slider = screen.getByLabelText('Volume de Player One')
    fireEvent.change(slider, { target: { value: '150' } })
    expect(defaultProps.onVolumeChange).toHaveBeenCalledWith('p1', 150)
  })
})
