import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SharedElement } from '../SharedElement'
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

describe('SharedElement', () => {
  it('renders children', () => {
    render(<SharedElement id="hero">Content</SharedElement>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('is aria-hidden', () => {
    const { container } = render(<SharedElement id="hero">Content</SharedElement>)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies className', () => {
    const { container } = render(
      <SharedElement id="hero" className="custom">
        Content
      </SharedElement>
    )
    expect(container.firstChild).toHaveClass('custom')
  })
})
