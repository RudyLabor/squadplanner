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

const useReducedMotionMock = vi.fn().mockReturnValue(false)
vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => useReducedMotionMock(),
}))

import { CrossfadeTransition } from '../CrossfadeTransition'

describe('CrossfadeTransition', () => {
  // STRICT: loading=true shows skeleton, hides content, aria-busy=true, className applied
  it('shows skeleton and hides content when loading with correct accessibility', () => {
    const { container } = render(
      <CrossfadeTransition
        isLoading={true}
        skeleton={<div data-testid="skeleton">Loading skeleton</div>}
        className="crossfade-wrapper"
      >
        <div data-testid="real-content">Real content</div>
      </CrossfadeTransition>
    )

    // Skeleton visible, content hidden
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.getByText('Loading skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('real-content')).not.toBeInTheDocument()

    // aria-busy=true
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')

    // className applied
    expect(container.firstChild).toHaveClass('crossfade-wrapper')
  })

  // STRICT: loading=false shows content, hides skeleton, aria-busy=false
  it('shows content and hides skeleton when not loading', () => {
    const { container } = render(
      <CrossfadeTransition
        isLoading={false}
        skeleton={<div data-testid="skeleton">Skeleton</div>}
        className="loaded-wrapper"
      >
        <div data-testid="real-content">Actual data</div>
      </CrossfadeTransition>
    )

    // Content visible, skeleton hidden
    expect(screen.getByTestId('real-content')).toBeInTheDocument()
    expect(screen.getByText('Actual data')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()

    // aria-busy=false
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')

    // className applied
    expect(container.firstChild).toHaveClass('loaded-wrapper')
  })

  // STRICT: transition between loading states swaps content correctly, aria-busy updates
  it('transitions correctly from loading to loaded state', () => {
    const { container, rerender } = render(
      <CrossfadeTransition
        isLoading={true}
        skeleton={<div data-testid="skel">Loading...</div>}
      >
        <div data-testid="content">Data loaded</div>
      </CrossfadeTransition>
    )

    // Initially loading
    expect(screen.getByTestId('skel')).toBeInTheDocument()
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')

    // Rerender with loading=false
    rerender(
      <CrossfadeTransition
        isLoading={false}
        skeleton={<div data-testid="skel">Loading...</div>}
      >
        <div data-testid="content">Data loaded</div>
      </CrossfadeTransition>
    )

    // Now content visible, skeleton hidden
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
    expect(screen.queryByTestId('skel')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
  })

  // STRICT: reduced motion renders instant swap without AnimatePresence, still has aria-busy
  it('renders instant swap with aria-busy when reduced motion is preferred', () => {
    useReducedMotionMock.mockReturnValue(true)

    const { container, rerender } = render(
      <CrossfadeTransition
        isLoading={true}
        skeleton={<div data-testid="skel-rm">Skeleton RM</div>}
        className="rm-wrapper"
      >
        <div data-testid="content-rm">Content RM</div>
      </CrossfadeTransition>
    )

    // Loading state with reduced motion
    expect(screen.getByTestId('skel-rm')).toBeInTheDocument()
    expect(screen.queryByTestId('content-rm')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
    expect(container.firstChild).toHaveClass('rm-wrapper')

    // Transition to loaded
    rerender(
      <CrossfadeTransition
        isLoading={false}
        skeleton={<div data-testid="skel-rm">Skeleton RM</div>}
        className="rm-wrapper"
      >
        <div data-testid="content-rm">Content RM</div>
      </CrossfadeTransition>
    )

    expect(screen.getByTestId('content-rm')).toBeInTheDocument()
    expect(screen.queryByTestId('skel-rm')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')

    // Reset mock
    useReducedMotionMock.mockReturnValue(false)
  })
})
