import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentTransition } from '../ContentTransition'
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

describe('ContentTransition', () => {
  // STRICT: loading=true shows skeleton only, hides children, aria-busy=true, skeleton content correct
  it('shows skeleton exclusively when loading with aria-busy true', () => {
    const { container } = render(
      <ContentTransition
        isLoading={true}
        skeleton={
          <div data-testid="skel">
            <span>Loading cards...</span>
          </div>
        }
      >
        <div data-testid="content">
          <span>Actual cards</span>
        </div>
      </ContentTransition>
    )

    // Skeleton visible
    expect(screen.getByTestId('skel')).toBeInTheDocument()
    expect(screen.getByText('Loading cards...')).toBeInTheDocument()

    // Content hidden
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.queryByText('Actual cards')).not.toBeInTheDocument()

    // aria-busy=true on wrapper
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')

    // Wrapper is a div
    expect((container.firstChild as HTMLElement).tagName).toBe('DIV')
  })

  // STRICT: loading=false shows children only, hides skeleton, aria-busy=false, children content correct
  it('shows children exclusively when loaded with aria-busy false', () => {
    const { container } = render(
      <ContentTransition
        isLoading={false}
        skeleton={<div data-testid="skel">Skeleton placeholder</div>}
      >
        <div data-testid="content">
          <h2>Dashboard</h2>
          <p>Stats loaded</p>
        </div>
      </ContentTransition>
    )

    // Children visible
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Stats loaded')).toBeInTheDocument()

    // Skeleton hidden
    expect(screen.queryByTestId('skel')).not.toBeInTheDocument()
    expect(screen.queryByText('Skeleton placeholder')).not.toBeInTheDocument()

    // aria-busy=false
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
  })

  // STRICT: transition from loading to loaded swaps content correctly, aria-busy updates
  it('transitions correctly from loading to loaded state', () => {
    const { container, rerender } = render(
      <ContentTransition isLoading={true} skeleton={<div data-testid="skel">Skeleton</div>}>
        <div data-testid="content">Real data</div>
      </ContentTransition>
    )

    // Initially loading
    expect(screen.getByTestId('skel')).toBeInTheDocument()
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')

    // Transition to loaded
    rerender(
      <ContentTransition isLoading={false} skeleton={<div data-testid="skel">Skeleton</div>}>
        <div data-testid="content">Real data</div>
      </ContentTransition>
    )

    // Now content visible, skeleton hidden
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByText('Real data')).toBeInTheDocument()
    expect(screen.queryByTestId('skel')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
  })

  // STRICT: transition from loaded back to loading (refetch scenario) swaps content correctly
  it('transitions back from loaded to loading on data refetch', () => {
    const { container, rerender } = render(
      <ContentTransition isLoading={false} skeleton={<div data-testid="skel">Loading...</div>}>
        <div data-testid="content">Data v1</div>
      </ContentTransition>
    )

    // Initially loaded
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.queryByTestId('skel')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')

    // Back to loading (refetch)
    rerender(
      <ContentTransition isLoading={true} skeleton={<div data-testid="skel">Loading...</div>}>
        <div data-testid="content">Data v1</div>
      </ContentTransition>
    )

    // Skeleton shown again
    expect(screen.getByTestId('skel')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')

    // Load again with new data
    rerender(
      <ContentTransition isLoading={false} skeleton={<div data-testid="skel">Loading...</div>}>
        <div data-testid="content">Data v2</div>
      </ContentTransition>
    )

    expect(screen.getByText('Data v2')).toBeInTheDocument()
    expect(screen.queryByTestId('skel')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
  })
})
