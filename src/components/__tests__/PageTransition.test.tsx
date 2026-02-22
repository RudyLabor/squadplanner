import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock framer-motion
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

// Mock motionTokens
vi.mock('../../utils/motionTokens', () => ({
  transitions: {
    pageTransition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}))

import { PageTransition, pageTransitionVariants, pageTransitionConfig } from '../PageTransition'

describe('PageTransition', () => {
  it('renders children', () => {
    render(createElement(PageTransition, {}, createElement('p', {}, 'Hello World')))
    expect(screen.getByText('Hello World')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(
      createElement(PageTransition, { className: 'my-class' }, 'Content')
    )
    expect(container.firstChild).toBeDefined()
  })

  it('supports slide variant', () => {
    render(createElement(PageTransition, { variant: 'slide' }, 'Slide'))
    expect(screen.getByText('Slide')).toBeDefined()
  })

  it('supports fade variant', () => {
    render(createElement(PageTransition, { variant: 'fade' }, 'Fade'))
    expect(screen.getByText('Fade')).toBeDefined()
  })

  it('supports scale variant', () => {
    render(createElement(PageTransition, { variant: 'scale' }, 'Scale'))
    expect(screen.getByText('Scale')).toBeDefined()
  })

  it('exports pageTransitionVariants with all variants', () => {
    expect(pageTransitionVariants).toHaveProperty('slide')
    expect(pageTransitionVariants).toHaveProperty('fade')
    expect(pageTransitionVariants).toHaveProperty('scale')
  })

  it('exports pageTransitionConfig', () => {
    expect(pageTransitionConfig).toHaveProperty('duration')
    expect(pageTransitionConfig).toHaveProperty('ease')
  })
})
