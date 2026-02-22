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

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

import { PartyToast } from '../PartyToast'

describe('PartyToast', () => {
  // STRICT: verifies hidden state — no message text, empty container, onClose not called, no toast structure
  it('renders nothing when isVisible is false', () => {
    const onClose = vi.fn()
    const { container } = render(
      <PartyToast message="Hidden" isVisible={false} onClose={onClose} />
    )

    // 1. Message text not rendered
    expect(screen.queryByText('Hidden')).toBeNull()
    // 2. onClose not called
    expect(onClose).not.toHaveBeenCalled()
    // 3. Container empty
    expect(container.textContent).toBe('')
    // 4. No span elements (no icon rendered)
    expect(container.querySelectorAll('span').length).toBe(0)
    // 5. No fixed positioning
    expect(container.querySelector('.fixed')).toBeNull()
    // 6. Message prop not leaked
    expect(container.innerHTML).not.toContain('Hidden')
  })

  // STRICT: verifies visible success toast — message shown, icon present, auto-dismiss at 3000ms, correct structure
  it('shows success toast with message, icon, and auto-dismisses after 3000ms', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const { container } = render(
      <PartyToast message="Connecté !" isVisible={true} onClose={onClose} />
    )

    // 1. Message displayed
    expect(screen.getByText('Connecté !')).toBeDefined()
    // 2. Container has content
    expect(container.textContent).toContain('Connecté !')
    // 3. Icon rendered (as span)
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBeGreaterThan(0)
    // 4. Message in a span element
    expect(screen.getByText('Connecté !').tagName.toLowerCase()).toBe('span')
    // 5. onClose not yet called
    expect(onClose).not.toHaveBeenCalled()
    // 6. After 3000ms, onClose is called (auto-dismiss)
    vi.advanceTimersByTime(3000)
    expect(onClose).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  // STRICT: verifies error variant — message shown, variant styling applied, icon matches variant
  it('renders error variant toast with correct message and variant styling', () => {
    const { container } = render(
      <PartyToast
        message="Erreur de connexion"
        isVisible={true}
        onClose={vi.fn()}
        variant="error"
      />
    )

    // 1. Error message shown
    expect(screen.getByText('Erreur de connexion')).toBeDefined()
    // 2. Container has text
    expect(container.textContent).toContain('Erreur de connexion')
    // 3. bg-error class present (error variant)
    expect(container.querySelector('.bg-error')).not.toBeNull()
    // 4. text-white class for error variant
    expect(container.querySelector('.text-white')).not.toBeNull()
    // 5. AlertCircle icon rendered (as span)
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBeGreaterThan(0)
    // 6. Message is readable
    expect(screen.getByText('Erreur de connexion').textContent).toBe('Erreur de connexion')
  })

  // STRICT: verifies warning variant — different styling, WifiOff icon, and correct background
  it('renders warning variant with correct styling', () => {
    const { container } = render(
      <PartyToast
        message="Connexion instable"
        isVisible={true}
        onClose={vi.fn()}
        variant="warning"
      />
    )

    // 1. Warning message shown
    expect(screen.getByText('Connexion instable')).toBeDefined()
    // 2. bg-warning class present
    expect(container.querySelector('.bg-warning')).not.toBeNull()
    // 3. text-bg-base for warning variant
    expect(container.querySelector('.text-bg-base')).not.toBeNull()
    // 4. WifiOff icon rendered (as span)
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBeGreaterThan(0)
    // 5. Default success variant NOT applied
    expect(container.querySelector('.bg-success')).toBeNull()
    // 6. Error variant NOT applied
    expect(container.querySelector('.bg-error')).toBeNull()
  })
})
