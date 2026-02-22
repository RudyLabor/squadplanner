import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createElement } from 'react'
import { SuccessToast } from '../SuccessToast'

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
  Sparkles: (props: any) => createElement('svg', { 'data-testid': 'icon-sparkles', ...props }),
}))

describe('SuccessToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without crashing', () => {
    const onClose = vi.fn()
    render(<SuccessToast message="Success!" onClose={onClose} />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('displays the message text', () => {
    render(<SuccessToast message="Session confirmed!" onClose={vi.fn()} />)
    expect(screen.getByText('Session confirmed!')).toBeInTheDocument()
  })

  it('shows sparkles icon', () => {
    render(<SuccessToast message="Done!" onClose={vi.fn()} />)
    expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument()
  })

  it('auto-closes after 3 seconds for normal messages', () => {
    const onClose = vi.fn()
    render(<SuccessToast message="Regular message" onClose={onClose} />)

    expect(onClose).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('auto-closes after 4 seconds for celebration messages (containing "confirm")', () => {
    const onClose = vi.fn()
    render(<SuccessToast message="Session confirmed!" onClose={onClose} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onClose).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cleans up timer on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = render(<SuccessToast message="Test" onClose={onClose} />)

    unmount()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // onClose should NOT be called after unmount
    expect(onClose).not.toHaveBeenCalled()
  })
})
