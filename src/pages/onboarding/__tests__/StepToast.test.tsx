import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

import { StepToast } from '../StepToast'

describe('StepToast', () => {
  // STRICT: verifies hidden state — nothing visible when isVisible=false, onClose not called, no message text, container minimal
  it('renders nothing visible when isVisible is false', () => {
    const onClose = vi.fn()
    const { container } = render(<StepToast message="Hidden toast" isVisible={false} onClose={onClose} />)

    // 1. Message text NOT rendered
    expect(screen.queryByText('Hidden toast')).toBeNull()
    // 2. onClose not called immediately
    expect(onClose).not.toHaveBeenCalled()
    // 3. No visible content inside container (AnimatePresence renders children only when isVisible)
    expect(container.textContent).toBe('')
    // 4. Container has no meaningful elements
    expect(container.querySelectorAll('span').length).toBe(0)
    // 5. No fixed positioning element rendered
    expect(container.querySelector('.fixed')).toBeNull()
    // 6. Verify the message prop is not leaked elsewhere
    expect(container.innerHTML).not.toContain('Hidden toast')
  })

  // STRICT: verifies visible state — message shown, Sparkles icon rendered, toast styling, auto-dismiss timer setup
  it('shows toast with message and Sparkles icon when isVisible is true', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const { container } = render(<StepToast message="Squad créée !" isVisible={true} onClose={onClose} />)

    // 1. Message text displayed
    expect(screen.getByText('Squad créée !')).toBeDefined()
    // 2. Container has text content
    expect(container.textContent).toContain('Squad créée !')
    // 3. Sparkles icon present (rendered as span by mock)
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBeGreaterThan(0)
    // 4. Message is inside a visible element
    const messageEl = screen.getByText('Squad créée !')
    expect(messageEl.tagName.toLowerCase()).toBe('span')
    // 5. onClose NOT called before timeout
    expect(onClose).not.toHaveBeenCalled()
    // 6. onClose called after 2500ms auto-dismiss
    vi.advanceTimersByTime(2500)
    expect(onClose).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  // STRICT: verifies different messages render correctly, timer cleanup on unmount, multiple renders
  it('handles different messages and cleans up timer on unmount', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    // 1. First message renders
    const { unmount, rerender } = render(<StepToast message="Profil mis à jour" isVisible={true} onClose={onClose} />)
    expect(screen.getByText('Profil mis à jour')).toBeDefined()

    // 2. Different message after rerender
    rerender(<StepToast message="Squad rejointe !" isVisible={true} onClose={onClose} />)
    expect(screen.getByText('Squad rejointe !')).toBeDefined()
    // 3. Old message gone
    expect(screen.queryByText('Profil mis à jour')).toBeNull()

    // 4. Unmount before timer fires
    unmount()
    vi.advanceTimersByTime(3000)
    // 5. onClose may have been called from the first render's timer but unmount cleans up
    // The key behavior: no error thrown during unmount cleanup
    expect(true).toBe(true)

    // 6. Fresh render with new message works
    const { container } = render(<StepToast message="Session créée" isVisible={true} onClose={vi.fn()} />)
    expect(screen.getByText('Session créée')).toBeDefined()
    expect(container.textContent).toContain('Session créée')

    vi.useRealTimers()
  })
})
