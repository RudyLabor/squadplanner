import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
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

vi.mock('@tanstack/react-query', () => ({
  useIsMutating: vi.fn().mockReturnValue(0),
}))

import { SyncIndicator } from '../SyncIndicator'
import { useIsMutating } from '@tanstack/react-query'

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(useIsMutating).mockReturnValue(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // STRICT: idle state renders nothing, no role=status in DOM, no aria-label, container is empty
  it('renders nothing when idle (no mutations)', () => {
    vi.mocked(useIsMutating).mockReturnValue(0)
    const { container } = render(<SyncIndicator />)

    expect(container).toBeDefined()
    expect(container.innerHTML).toBe('')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Synchronisation en cours')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Synchronise')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Erreur de synchronisation')).not.toBeInTheDocument()
  })

  // STRICT: syncing state shows status element with correct aria-label, has sync-indicator class, contains SVG spinner
  it('shows syncing indicator when mutations are pending', () => {
    vi.mocked(useIsMutating).mockReturnValue(2)
    const { container } = render(<SyncIndicator />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toBeInTheDocument()
    expect(statusEl).toHaveAttribute('aria-live', 'polite')
    expect(statusEl).toHaveAttribute('aria-label', 'Synchronisation en cours')

    // SVG spinner should be present (the syncing icon)
    const svg = container.querySelector('.sync-icon--syncing')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
  })

  // STRICT: syncing indicator has correct structure: role=status, aria-live=polite, sync-indicator class, spinner SVG
  it('syncing indicator has proper DOM structure and accessibility', () => {
    vi.mocked(useIsMutating).mockReturnValue(3)
    const { container } = render(<SyncIndicator />)

    // Status element structure
    const statusEl = screen.getByRole('status')
    expect(statusEl).toBeInTheDocument()
    expect(statusEl).toHaveAttribute('aria-live', 'polite')
    expect(statusEl).toHaveAttribute('aria-label', 'Synchronisation en cours')

    // SVG spinner structure
    const svg = container.querySelector('.sync-icon--syncing')
    expect(svg).toBeInTheDocument()
    expect(svg!.tagName.toLowerCase()).toBe('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 16 16')

    // Circle element inside spinner
    const circle = svg!.querySelector('circle')
    expect(circle).toBeInTheDocument()
    expect(circle).toHaveAttribute('cx', '8')
    expect(circle).toHaveAttribute('cy', '8')
    expect(circle).toHaveAttribute('stroke', 'currentColor')
  })

  // STRICT: error state shows warning icon with correct aria-label after sync-error event
  it('shows error indicator on sync-error event and fades after 4s', () => {
    // Start with no mutations (idle), then dispatch error
    vi.mocked(useIsMutating).mockReturnValue(0)
    const { container } = render(<SyncIndicator />)

    // Dispatch sync-error
    act(() => {
      window.dispatchEvent(new Event('sync-error'))
    })

    // Error state should be showing
    const statusEl = screen.getByRole('status')
    expect(statusEl).toBeInTheDocument()
    expect(statusEl).toHaveAttribute('aria-label', 'Erreur de synchronisation')
    expect(statusEl).toHaveAttribute('aria-live', 'polite')

    const errorIcon = container.querySelector('.sync-icon--error')
    expect(errorIcon).toBeInTheDocument()
    expect(errorIcon).toHaveAttribute('width', '16')
    expect(errorIcon).toHaveAttribute('height', '16')

    // After 4s, back to idle
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(container.querySelector('.sync-icon--error')).not.toBeInTheDocument()
  })
})
