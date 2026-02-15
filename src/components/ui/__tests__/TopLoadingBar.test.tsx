import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

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

vi.mock('../../../hooks/useNavigationProgress', () => ({
  useNavigationProgressStore: Object.assign(
    vi.fn().mockReturnValue(false),
    { getState: vi.fn().mockReturnValue({ isNavigating: false }) }
  ),
}))

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn().mockReturnValue(false),
}))

import { TopLoadingBar } from '../TopLoadingBar'
import { useReducedMotion } from '../../../hooks/useReducedMotion'

describe('TopLoadingBar', () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  // STRICT: not navigating renders nothing visible, no fixed bar, no inner progress element
  it('renders nothing visible when not navigating', () => {
    const { container } = render(<TopLoadingBar />)

    // Bar should not be visible when not navigating
    expect(container).toBeDefined()
    // The outer wrapper should not contain the loading bar
    const fixedBar = container.querySelector('.fixed')
    expect(fixedBar).not.toBeInTheDocument()
    // No progress bar inner element
    expect(container.querySelector('[style*="width"]')).not.toBeInTheDocument()
    // No divs at all when idle
    const allDivs = container.querySelectorAll('div')
    expect(allDivs.length).toBe(0)
  })

  // STRICT: reduced motion returns null, nothing rendered at all
  it('returns null when reduced motion is preferred', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    const { container } = render(<TopLoadingBar />)

    expect(container.innerHTML).toBe('')
    expect(container.querySelector('.fixed')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-hidden]')).not.toBeInTheDocument()
    // Absolutely nothing in the container
    expect(container.childNodes.length).toBe(0)
  })

  // STRICT: no extra DOM pollution when idle, zero divs
  it('produces zero DOM elements when idle', () => {
    const { container } = render(<TopLoadingBar />)

    expect(container).toBeDefined()
    // Verify no extra DOM pollution when idle
    const allDivs = container.querySelectorAll('div')
    expect(allDivs.length).toBe(0)
    expect(container.innerHTML).toBe('')
  })

  // STRICT: component mounts and unmounts cleanly without errors
  it('mounts and unmounts cleanly without memory leaks', () => {
    const { unmount, container } = render(<TopLoadingBar />)

    expect(container).toBeDefined()
    // Unmount should not throw
    expect(() => unmount()).not.toThrow()
    expect(container.innerHTML).toBe('')
  })
})
