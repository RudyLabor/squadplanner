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

describe('AnimatedList', () => {
  it('renders children', () => {
    render(
      <AnimatedList>
        <AnimatedListItem>Item 1</AnimatedListItem>
        <AnimatedListItem>Item 2</AnimatedListItem>
      </AnimatedList>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('applies className to wrapper', () => {
    const { container } = render(
      <AnimatedList className="my-list">
        <AnimatedListItem>Item</AnimatedListItem>
      </AnimatedList>
    )
    expect(container.firstChild).toHaveClass('my-list')
  })

  it('applies className to list item', () => {
    render(
      <AnimatedList>
        <AnimatedListItem className="my-item">Item</AnimatedListItem>
      </AnimatedList>
    )
    expect(screen.getByText('Item').closest('div')).toHaveClass('my-item')
  })
})
