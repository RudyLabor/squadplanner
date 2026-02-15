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

import { CalendarIllustration } from '../CalendarIllustration'

describe('CalendarIllustration', () => {
  // STRICT: verifies default rendering produces SVG with correct viewBox, size, themed wrapper, and expected SVG child elements
  it('renders with default size and correct SVG structure', () => {
    const { container } = render(<CalendarIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('width')).toBe('64')
    expect(svg!.getAttribute('height')).toBe('64')
    expect(svg!.getAttribute('viewBox')).toBe('0 0 64 64')
    expect(svg!.getAttribute('fill')).toBe('none')

    // Wrapped in illustration-themed div
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('illustration-themed')).toBe(true)

    // Contains calendar body rect, top bar line, hooks, grid dots (circles), selected date rect, checkmark path
    expect(container.querySelectorAll('rect').length).toBeGreaterThanOrEqual(2)
    expect(container.querySelectorAll('line').length).toBeGreaterThanOrEqual(3)
    expect(container.querySelectorAll('circle').length).toBe(8)
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(1)
  })

  // STRICT: verifies custom size prop changes SVG dimensions and className is forwarded to wrapper
  it('accepts size and className props', () => {
    const { container } = render(<CalendarIllustration size={128} className="my-custom-class" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('width')).toBe('128')
    expect(svg!.getAttribute('height')).toBe('128')
    // viewBox stays the same (design space)
    expect(svg!.getAttribute('viewBox')).toBe('0 0 64 64')

    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('illustration-themed')).toBe(true)
    expect(wrapper?.classList.contains('my-custom-class')).toBe(true)
  })
})
