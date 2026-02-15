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

import { ShieldIllustration } from '../ShieldIllustration'

describe('ShieldIllustration', () => {
  // STRICT: verifies SVG renders with correct default size 64, viewBox, themed wrapper, shield outline path, inner glow path, checkmark path, and sparkle path
  it('renders complete shield illustration with all elements', () => {
    const { container } = render(<ShieldIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('width')).toBe('64')
    expect(svg!.getAttribute('height')).toBe('64')
    expect(svg!.getAttribute('viewBox')).toBe('0 0 64 64')
    expect(svg!.getAttribute('fill')).toBe('none')

    // Wrapped in illustration-themed div
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('illustration-themed')).toBe(true)

    // Shield outline + inner glow + checkmark + sparkle = 4 paths
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBe(4)

    // No rects, circles, or lines in this illustration
    expect(container.querySelectorAll('rect').length).toBe(0)
    expect(container.querySelectorAll('circle').length).toBe(0)
    expect(container.querySelectorAll('line').length).toBe(0)

    // Custom size and className
    const { container: c2 } = render(<ShieldIllustration size={100} className="shield-test" />)
    const svg2 = c2.querySelector('svg')
    expect(svg2!.getAttribute('width')).toBe('100')
    expect(svg2!.getAttribute('height')).toBe('100')
    expect(c2.firstElementChild?.classList.contains('shield-test')).toBe(true)
    expect(c2.firstElementChild?.classList.contains('illustration-themed')).toBe(true)
  })
})
