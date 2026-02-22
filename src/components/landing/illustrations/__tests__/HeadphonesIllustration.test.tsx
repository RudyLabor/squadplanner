import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
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

import { HeadphonesIllustration } from '../HeadphonesIllustration'

describe('HeadphonesIllustration', () => {
  // STRICT: verifies SVG renders with correct default size 64, viewBox, themed wrapper, headband path, 2 ear cup rects, sound wave paths, mic boom path, and mic tip circle
  it('renders complete headphones illustration with all elements', () => {
    const { container } = render(<HeadphonesIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('width')).toBe('64')
    expect(svg!.getAttribute('height')).toBe('64')
    expect(svg!.getAttribute('viewBox')).toBe('0 0 64 64')
    expect(svg!.getAttribute('fill')).toBe('none')

    // Wrapped in illustration-themed div
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('illustration-themed')).toBe(true)

    // Headband arc + sound waves + mic boom = at least 4 paths
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(4)

    // Left + right ear cup rects
    expect(container.querySelectorAll('rect').length).toBe(2)

    // Mic tip circle
    expect(container.querySelectorAll('circle').length).toBe(1)

    // Custom size and className
    const { container: c2 } = render(<HeadphonesIllustration size={96} className="hp-test" />)
    const svg2 = c2.querySelector('svg')
    expect(svg2!.getAttribute('width')).toBe('96')
    expect(svg2!.getAttribute('height')).toBe('96')
    expect(c2.firstElementChild?.classList.contains('hp-test')).toBe(true)
    expect(c2.firstElementChild?.classList.contains('illustration-themed')).toBe(true)
  })
})
