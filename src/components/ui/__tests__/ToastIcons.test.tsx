import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AnimatedCheckmark, AnimatedXMark, AnimatedWarning, AnimatedInfo } from '../ToastIcons'
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

describe('AnimatedCheckmark', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedCheckmark />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts custom size', () => {
    const { container } = render(<AnimatedCheckmark size={32} />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '32')
  })
})

describe('AnimatedXMark', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedXMark />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('AnimatedWarning', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedWarning />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('AnimatedInfo', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedInfo />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
