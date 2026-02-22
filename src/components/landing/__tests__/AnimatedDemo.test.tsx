import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createElement } from 'react'

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockIntersectionObserver = vi.fn()

vi.stubGlobal(
  'IntersectionObserver',
  class {
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      mockIntersectionObserver(cb, options)
      // Store the callback for later triggering
      ;(this as any)._callback = cb
    }
    observe = mockObserve
    disconnect = mockDisconnect
    unobserve = vi.fn()
  }
)

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

vi.mock('../DemoSteps', () => ({
  demoSteps: [
    {
      id: 'create',
      title: 'Crée ta Squad',
      subtitle: 'Test',
      duration: 3000,
      icon: () => null,
      color: 'blue',
    },
    {
      id: 'invite',
      title: 'Invite',
      subtitle: 'Test2',
      duration: 2500,
      icon: () => null,
      color: 'green',
    },
    {
      id: 'play',
      title: 'Joue',
      subtitle: 'Test3',
      duration: 2000,
      icon: () => null,
      color: 'red',
    },
  ],
  stepComponents: {
    create: () => createElement('div', { 'data-testid': 'step-create' }, 'CreateStep'),
    invite: () => createElement('div', { 'data-testid': 'step-invite' }, 'InviteStep'),
    play: () => createElement('div', { 'data-testid': 'step-play' }, 'PlayStep'),
  },
  PhoneFrame: ({ children }: any) =>
    createElement('div', { 'data-testid': 'phone-frame' }, children),
}))

import { AnimatedDemo } from '../AnimatedDemo'

describe('AnimatedDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockObserve.mockClear()
    mockDisconnect.mockClear()
    mockIntersectionObserver.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without crash and shows first step', () => {
    render(<AnimatedDemo />)
    expect(screen.getByText('CreateStep')).toBeInTheDocument()
  })

  it('renders inside a PhoneFrame', () => {
    render(<AnimatedDemo />)
    expect(screen.getByTestId('phone-frame')).toBeInTheDocument()
  })

  describe('Uncontrolled mode (no props)', () => {
    it('starts at step 0', () => {
      render(<AnimatedDemo />)
      expect(screen.getByTestId('step-create')).toBeInTheDocument()
    })

    it('auto-advances to next step after duration when in view', () => {
      render(<AnimatedDemo />)

      // Trigger IntersectionObserver to mark as in-view
      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        act(() => {
          observerCallback([{ isIntersecting: true }])
        })
      }

      // Advance past step 0 duration (3000ms)
      act(() => {
        vi.advanceTimersByTime(3100)
      })
      expect(screen.getByTestId('step-invite')).toBeInTheDocument()
    })

    it('cycles through all steps and wraps around', () => {
      render(<AnimatedDemo />)

      // Trigger in-view
      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        act(() => {
          observerCallback([{ isIntersecting: true }])
        })
      }

      // Step 0 -> 1 (3000ms)
      act(() => {
        vi.advanceTimersByTime(3100)
      })
      expect(screen.getByTestId('step-invite')).toBeInTheDocument()

      // Step 1 -> 2 (2500ms)
      act(() => {
        vi.advanceTimersByTime(2600)
      })
      expect(screen.getByTestId('step-play')).toBeInTheDocument()

      // Step 2 -> 0 (wraps, 2000ms)
      act(() => {
        vi.advanceTimersByTime(2100)
      })
      expect(screen.getByTestId('step-create')).toBeInTheDocument()
    })

    it('does not auto-advance when not in view', () => {
      render(<AnimatedDemo />)

      // Don't trigger IntersectionObserver (or trigger with isIntersecting=false)
      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        act(() => {
          observerCallback([{ isIntersecting: false }])
        })
      }

      act(() => {
        vi.advanceTimersByTime(10000)
      })
      // Should still be on step 0
      expect(screen.getByTestId('step-create')).toBeInTheDocument()
    })
  })

  describe('Controlled mode (with currentStep + onStepChange)', () => {
    it('renders the step specified by currentStep', () => {
      render(<AnimatedDemo currentStep={1} onStepChange={vi.fn()} />)
      expect(screen.getByTestId('step-invite')).toBeInTheDocument()
    })

    it('renders step 2 when currentStep is 2', () => {
      render(<AnimatedDemo currentStep={2} onStepChange={vi.fn()} />)
      expect(screen.getByTestId('step-play')).toBeInTheDocument()
    })

    it('calls onStepChange during auto-advance', () => {
      const onStepChange = vi.fn()
      render(<AnimatedDemo currentStep={0} onStepChange={onStepChange} />)

      // Trigger in-view
      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        act(() => {
          observerCallback([{ isIntersecting: true }])
        })
      }

      // Wait for auto-advance
      act(() => {
        vi.advanceTimersByTime(3100)
      })
      expect(onStepChange).toHaveBeenCalledWith(1)
    })
  })

  describe('Manual step change pause behavior', () => {
    it('pauses auto-advance for 5s when step changes externally', () => {
      const onStepChange = vi.fn()
      const { rerender } = render(<AnimatedDemo currentStep={0} onStepChange={onStepChange} />)

      // Trigger in-view
      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        act(() => {
          observerCallback([{ isIntersecting: true }])
        })
      }

      // Simulate external step change (parent controls)
      rerender(<AnimatedDemo currentStep={2} onStepChange={onStepChange} />)

      // Should be paused now - advance less than 5s + step duration
      onStepChange.mockClear()
      act(() => {
        vi.advanceTimersByTime(4000)
      })
      // onStepChange should not have been called during the pause
      expect(onStepChange).not.toHaveBeenCalled()

      // After 5s, auto-advance should resume
      act(() => {
        vi.advanceTimersByTime(1100)
      })
      // Now let the step duration pass
      act(() => {
        vi.advanceTimersByTime(2100)
      })
      expect(onStepChange).toHaveBeenCalled()
    })
  })

  describe('IntersectionObserver', () => {
    it('creates an IntersectionObserver with 0.3 threshold', () => {
      render(<AnimatedDemo />)
      expect(mockIntersectionObserver).toHaveBeenCalled()
      const options = mockIntersectionObserver.mock.calls[0]?.[1]
      expect(options).toEqual({ threshold: 0.3 })
    })

    it('calls observe on the ref element', () => {
      render(<AnimatedDemo />)
      expect(mockObserve).toHaveBeenCalled()
    })

    it('disconnects observer on unmount', () => {
      const { unmount } = render(<AnimatedDemo />)
      unmount()
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('Re-export', () => {
    it('re-exports demoSteps', async () => {
      const mod = await import('../AnimatedDemo')
      expect(mod.demoSteps).toBeDefined()
      expect(Array.isArray(mod.demoSteps)).toBe(true)
    })
  })
})
