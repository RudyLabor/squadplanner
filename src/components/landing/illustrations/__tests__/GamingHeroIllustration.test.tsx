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

import { GamingHeroIllustration } from '../GamingHeroIllustration'

describe('GamingHeroIllustration', () => {
  // STRICT: verifies SVG renders with default 300px size, correct viewBox, themed wrapper, gradients defs, 4 avatar groups, controller, sparkles, and SQUAD text
  it('renders complete hero illustration with all visual elements', () => {
    const { container } = render(<GamingHeroIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('width')).toBe('300')
    expect(svg!.getAttribute('height')).toBe('300')
    expect(svg!.getAttribute('viewBox')).toBe('0 0 300 300')
    expect(svg!.getAttribute('fill')).toBe('none')

    // Wrapped in illustration-themed div
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('illustration-themed')).toBe(true)

    // Contains gradient definitions
    expect(container.querySelector('defs')).toBeTruthy()
    expect(container.querySelector('#heroGlow')).toBeTruthy()
    expect(container.querySelector('#lineGrad')).toBeTruthy()

    // Multiple circles for avatars, glow rings, sparkles (at least 4 avatar groups + sparkles)
    expect(container.querySelectorAll('circle').length).toBeGreaterThanOrEqual(15)

    // Connection lines between avatars (6 paths for connections)
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(6)

    // Controller rects (D-pad + buttons)
    expect(container.querySelectorAll('rect').length).toBeGreaterThanOrEqual(3)

    // Text elements: "21H" time label and "SQUAD" badge
    const textEls = container.querySelectorAll('text')
    expect(textEls.length).toBe(2)
    const textContents = Array.from(textEls).map((el) => el.textContent)
    expect(textContents).toContain('21H')
    expect(textContents).toContain('SQUAD')

    // Custom size prop works
    const { container: c2 } = render(<GamingHeroIllustration size={200} className="hero-test" />)
    const svg2 = c2.querySelector('svg')
    expect(svg2!.getAttribute('width')).toBe('200')
    expect(svg2!.getAttribute('height')).toBe('200')
    expect(c2.firstElementChild?.classList.contains('hero-test')).toBe(true)
  })
})
