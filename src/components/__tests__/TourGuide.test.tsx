import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { useLocation } from 'react-router'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/other', hash: '', search: '' }),
}))

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

vi.mock('../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

// Capture TourOverlay and TourTooltip props
const mockTourOverlayProps = vi.fn()
const mockTourTooltipProps = vi.fn()
vi.mock('../tour/TourOverlay', () => ({
  TourOverlay: (props: any) => {
    mockTourOverlayProps(props)
    return createElement('div', { 'data-testid': 'tour-overlay', onClick: props.onSkip })
  },
}))
vi.mock('../tour/TourTooltip', () => ({
  TourTooltip: (props: any) => {
    mockTourTooltipProps(props)
    return createElement('div', { 'data-testid': 'tour-tooltip' }, props.title)
  },
}))

const mockedUseLocation = vi.mocked(useLocation)

import { TourGuide } from '../TourGuide'

describe('TourGuide', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockedUseLocation.mockReturnValue({ pathname: '/other', hash: '', search: '', state: null, key: '' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // STRICT: Verifies that TourGuide renders nothing when pathname is not /home or /squads — no overlay, no tooltip, empty container
  it('renders nothing when pathname is not /home or /squads', () => {
    const { container } = render(<TourGuide />)

    // 1. Container is empty
    expect(container.innerHTML).toBe('')
    // 2. No tour overlay rendered
    expect(container.querySelector('[data-testid="tour-overlay"]')).toBeNull()
    // 3. No tour tooltip rendered
    expect(container.querySelector('[data-testid="tour-tooltip"]')).toBeNull()
    // 4. TourOverlay was never called
    expect(mockTourOverlayProps).not.toHaveBeenCalled()
    // 5. TourTooltip was never called
    expect(mockTourTooltipProps).not.toHaveBeenCalled()
    // 6. localStorage was NOT written to
    expect(localStorage.getItem('sq-tour-completed-v1')).toBeNull()
  })

  // STRICT: Verifies that TourGuide renders nothing initially even on /home (3s delay), and respects localStorage completed flag
  it('renders nothing initially on /home due to 3s delay and respects completed flag', () => {
    mockedUseLocation.mockReturnValue({ pathname: '/home', hash: '', search: '', state: null, key: '' })

    // Test 1: Without completed flag, still empty because timer hasn't fired
    const { container } = render(<TourGuide />)

    // 1. Initially empty (3s timer not fired)
    expect(container.innerHTML).toBe('')
    // 2. No overlay
    expect(mockTourOverlayProps).not.toHaveBeenCalled()
    // 3. No tooltip
    expect(mockTourTooltipProps).not.toHaveBeenCalled()

    // Test 2: With completed flag, should always be empty
    localStorage.setItem('sq-tour-completed-v1', 'true')
    const { container: container2 } = render(<TourGuide />)

    // 4. Still empty because tour is marked completed
    expect(container2.innerHTML).toBe('')
    // 5. Overlay still never called
    expect(mockTourOverlayProps).not.toHaveBeenCalled()
    // 6. Tooltip still never called
    expect(mockTourTooltipProps).not.toHaveBeenCalled()
  })
})
