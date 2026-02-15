import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

vi.mock('../../icons', () => ({
  ChevronDown: (props: any) => createElement('span', { ...props, 'data-testid': 'chevron-icon' }, 'chevron'),
}))

import { Expandable } from '../Expandable'

describe('Expandable', () => {
  // STRICT: renders children, applies className, uses webkit line clamp, overflow hidden
  it('renders children with truncation styles and custom className', () => {
    const { container } = render(
      <Expandable className="custom-wrapper" previewLines={5}>
        <p>Long content that could be truncated</p>
      </Expandable>
    )

    // Children rendered
    expect(screen.getByText('Long content that could be truncated')).toBeInTheDocument()

    // Custom className applied to wrapper
    expect(container.firstChild).toHaveClass('custom-wrapper')

    // Preview container has overflow hidden class
    const overflowDiv = container.querySelector('.overflow-hidden')
    expect(overflowDiv).toBeInTheDocument()

    // WebkitLineClamp set via style (from previewLines prop)
    expect(overflowDiv).toHaveStyle({ WebkitLineClamp: 5 })

    // Display set to -webkit-box for truncation
    expect(overflowDiv).toHaveStyle({ display: '-webkit-box' })
  })

  // STRICT: default prop values, default labels, default previewLines=3
  it('uses default prop values (previewLines=3, default labels)', () => {
    const { container } = render(
      <Expandable>
        <p>Content</p>
      </Expandable>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()

    // Default previewLines = 3
    const overflowDiv = container.querySelector('.overflow-hidden')
    expect(overflowDiv).toBeInTheDocument()
    expect(overflowDiv).toHaveStyle({ WebkitLineClamp: 3 })

    // Default className is empty string, wrapper div exists
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
  })

  // STRICT: when needsTruncation is true, button appears with correct aria-expanded and labels toggle
  it('shows toggle button with correct aria-expanded when content overflows', () => {
    // Force the component to think content overflows by mocking scrollHeight
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() { return 500 }, // Much taller than maxHeight (3 * 21 = 63)
    })

    render(
      <Expandable expandLabel="Voir plus" collapseLabel="Voir moins">
        <p>Very long content</p>
      </Expandable>
    )

    // Toggle button should appear
    const toggleBtn = screen.getByRole('button')
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
    expect(toggleBtn).toHaveAttribute('type', 'button')

    // Default expand label shown
    expect(screen.getByText('Voir plus')).toBeInTheDocument()

    // Chevron icon rendered
    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument()

    // Click to expand
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Voir moins')).toBeInTheDocument()

    // Click to collapse again
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Voir plus')).toBeInTheDocument()

    // Restore
    if (originalDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalDescriptor)
    }
  })

  // STRICT: custom labels are used when provided
  it('uses custom expand and collapse labels', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() { return 500 },
    })

    render(
      <Expandable expandLabel="Show more" collapseLabel="Show less">
        <p>Content</p>
      </Expandable>
    )

    expect(screen.getByText('Show more')).toBeInTheDocument()

    const toggleBtn = screen.getByRole('button')
    fireEvent.click(toggleBtn)
    expect(screen.getByText('Show less')).toBeInTheDocument()

    if (originalDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalDescriptor)
    }
  })
})
