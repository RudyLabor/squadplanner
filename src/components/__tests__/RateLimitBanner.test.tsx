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
  AlertTriangle: (props: any) => createElement('svg', props),
  X: (props: any) => createElement('svg', props),
  RefreshCw: (props: any) => createElement('svg', props),
}))

import { RateLimitBanner } from '../RateLimitBanner'

describe('RateLimitBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with default message', () => {
    render(createElement(RateLimitBanner, { retryAfter: 30 }))
    expect(screen.getByText('Trop de requêtes')).toBeDefined()
  })

  it('renders with custom message', () => {
    render(createElement(RateLimitBanner, { retryAfter: 30, message: 'Custom rate limit' }))
    expect(screen.getByText('Custom rate limit')).toBeDefined()
  })

  it('shows countdown timer', () => {
    render(createElement(RateLimitBanner, { retryAfter: 30 }))
    expect(screen.getByText(/30s/)).toBeDefined()
  })

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn()
    render(createElement(RateLimitBanner, { retryAfter: 30, onDismiss }))
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('renders with role alert', () => {
    const { container } = render(createElement(RateLimitBanner, { retryAfter: 10 }))
    expect(container.querySelector('[role="alert"]')).toBeDefined()
  })
})
