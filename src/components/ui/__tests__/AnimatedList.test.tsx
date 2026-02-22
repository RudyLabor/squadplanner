import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimatedList, AnimatedListItem } from '../AnimatedList'
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

describe('AnimatedList', () => {
  // STRICT: renders multiple children, each accessible in DOM, correct order, wrapper has className
  it('renders multiple items in correct order with className on wrapper', () => {
    const { container } = render(
      <AnimatedList className="my-list">
        <AnimatedListItem key="a">
          <span data-testid="item-a">Alpha</span>
        </AnimatedListItem>
        <AnimatedListItem key="b">
          <span data-testid="item-b">Beta</span>
        </AnimatedListItem>
        <AnimatedListItem key="c">
          <span data-testid="item-c">Gamma</span>
        </AnimatedListItem>
      </AnimatedList>
    )

    // All items rendered
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()

    // Wrapper forwards the className prop
    expect((container.firstChild as HTMLElement).className).toContain('my-list')

    // Items are in correct DOM order (use testids for precise checks)
    const itemA = screen.getByTestId('item-a')
    const itemB = screen.getByTestId('item-b')
    const itemC = screen.getByTestId('item-c')
    expect(itemA.textContent).toBe('Alpha')
    expect(itemB.textContent).toBe('Beta')
    expect(itemC.textContent).toBe('Gamma')

    // All three are siblings within the wrapper structure
    expect(itemA.compareDocumentPosition(itemB) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(itemB.compareDocumentPosition(itemC) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  // STRICT: AnimatedListItem passes className to wrapper div, children render correctly
  it('AnimatedListItem applies className and renders children', () => {
    render(
      <AnimatedList>
        <AnimatedListItem className="custom-item">
          <span data-testid="inner">Inner content</span>
        </AnimatedListItem>
      </AnimatedList>
    )

    const inner = screen.getByTestId('inner')
    expect(inner).toBeInTheDocument()
    expect(inner.textContent).toBe('Inner content')

    // className forwarded to the item wrapper
    const itemWrapper = inner.closest('div')
    expect(itemWrapper).not.toBeNull()
    expect(itemWrapper!.className).toContain('custom-item')
  })

  // STRICT: empty list renders wrapper only, rerender with items works, dynamic add
  it('handles empty list, single item, and dynamic changes', () => {
    // Empty list
    const { container, rerender } = render(
      <AnimatedList className="empty-list">{null}</AnimatedList>
    )
    expect((container.firstChild as HTMLElement).className).toContain('empty-list')

    // Single item
    rerender(
      <AnimatedList className="single-list">
        <AnimatedListItem key="only">
          <span>Only item</span>
        </AnimatedListItem>
      </AnimatedList>
    )
    expect(screen.getByText('Only item')).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).className).toContain('single-list')

    // Add more items
    rerender(
      <AnimatedList className="multi-list">
        <AnimatedListItem key="only">
          <span>Only item</span>
        </AnimatedListItem>
        <AnimatedListItem key="new">
          <span>New item</span>
        </AnimatedListItem>
      </AnimatedList>
    )
    expect(screen.getByText('Only item')).toBeInTheDocument()
    expect(screen.getByText('New item')).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).className).toContain('multi-list')
  })

  // STRICT: wrapper without className has no extra class, structure is just div > AnimatePresence > items
  it('renders without className prop correctly', () => {
    const { container } = render(
      <AnimatedList>
        <AnimatedListItem>Item A</AnimatedListItem>
      </AnimatedList>
    )

    expect(screen.getByText('Item A')).toBeInTheDocument()
    // Wrapper div exists but has no className attribute set
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    // No class set when className is undefined
    expect(wrapper.className).toBe('')
  })
})
