import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

import { EmptyStateIllustration } from '../EmptyStateIllustration'

describe('EmptyStateIllustration', () => {
  // ---- Common structure ----
  describe('common structure', () => {
    it('wraps illustration in a flex centered container', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper?.className).toContain('flex')
      expect(wrapper?.className).toContain('items-center')
      expect(wrapper?.className).toContain('justify-center')
    })

    it('renders an SVG element for every type', () => {
      const types = ['sessions', 'squads', 'friends', 'messages'] as const
      for (const type of types) {
        const { container, unmount } = render(<EmptyStateIllustration type={type} />)
        expect(container.querySelector('svg')).toBeTruthy()
        unmount()
      }
    })

    it('applies custom className to wrapper', () => {
      const { container } = render(
        <EmptyStateIllustration type="sessions" className="my-custom" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper?.className).toContain('my-custom')
    })

    it('defaults className to empty string', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      const wrapper = container.firstChild as HTMLElement
      // Should not have 'undefined' in the className
      expect(wrapper?.className).not.toContain('undefined')
    })

    it('sets maxWidth 200px on SVG', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      const svg = container.querySelector('svg')
      expect(svg?.style.maxWidth).toBe('200px')
    })

    it('sets viewBox 0 0 200 200 on SVG', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('viewBox')).toBe('0 0 200 200')
    })
  })

  // ---- Sessions illustration ----
  describe('sessions type', () => {
    it('renders SVG', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      expect(container.querySelector('svg')).toBeTruthy()
    })

    it('renders calendar background rectangle', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBeGreaterThanOrEqual(2) // background + header
    })

    it('renders calendar dots (8 circles for 2 rows of 4)', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      const circles = container.querySelectorAll('circle')
      // 8 calendar dots + 1 plus-sign circle = 9
      expect(circles.length).toBeGreaterThanOrEqual(9)
    })

    it('renders plus sign (circle + 2 lines)', () => {
      const { container } = render(<EmptyStateIllustration type="sessions" />)
      const lines = container.querySelectorAll('line')
      // 2 lines in the plus sign
      expect(lines.length).toBeGreaterThanOrEqual(2)
    })

    it('passes className to SVG', () => {
      const { container } = render(
        <EmptyStateIllustration type="sessions" className="test-svg" />
      )
      const svg = container.querySelector('svg')
      expect(svg?.className?.baseVal || svg?.getAttribute('class')).toContain('test-svg')
    })
  })

  // ---- Squads illustration ----
  describe('squads type', () => {
    it('renders SVG', () => {
      const { container } = render(<EmptyStateIllustration type="squads" />)
      expect(container.querySelector('svg')).toBeTruthy()
    })

    it('renders group circle background with dashed stroke', () => {
      const { container } = render(<EmptyStateIllustration type="squads" />)
      const circles = container.querySelectorAll('circle')
      // 1 background dashed circle + 3 avatar outer circles + 3 avatar inner circles + 1 plus circle = 8
      expect(circles.length).toBeGreaterThanOrEqual(7)
    })

    it('renders 3 avatar groups (head + body path for each)', () => {
      const { container } = render(<EmptyStateIllustration type="squads" />)
      const paths = container.querySelectorAll('path')
      // 3 body paths for the avatars
      expect(paths.length).toBeGreaterThanOrEqual(3)
    })

    it('renders plus sign with lines', () => {
      const { container } = render(<EmptyStateIllustration type="squads" />)
      const lines = container.querySelectorAll('line')
      expect(lines.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ---- Friends illustration ----
  describe('friends type', () => {
    it('renders SVG', () => {
      const { container } = render(<EmptyStateIllustration type="friends" />)
      expect(container.querySelector('svg')).toBeTruthy()
    })

    it('renders two person figures (circles for heads + body paths)', () => {
      const { container } = render(<EmptyStateIllustration type="friends" />)
      const circles = container.querySelectorAll('circle')
      // 2 outer circles + 2 head circles = 4
      expect(circles.length).toBeGreaterThanOrEqual(4)
    })

    it('renders connection line between the two people', () => {
      const { container } = render(<EmptyStateIllustration type="friends" />)
      const lines = container.querySelectorAll('line')
      // 1 dashed connection line
      expect(lines.length).toBeGreaterThanOrEqual(1)
    })

    it('renders a heart shape (path element)', () => {
      const { container } = render(<EmptyStateIllustration type="friends" />)
      const paths = container.querySelectorAll('path')
      // 2 body paths + 1 heart path = at least 3
      expect(paths.length).toBeGreaterThanOrEqual(3)
    })

    it('uses primary and success colors for two figures', () => {
      const { container } = render(<EmptyStateIllustration type="friends" />)
      const circles = container.querySelectorAll('circle')
      const fills = Array.from(circles).map((c) => c.getAttribute('fill'))
      expect(fills.some((f) => f?.includes('primary'))).toBe(true)
      expect(fills.some((f) => f?.includes('success'))).toBe(true)
    })

    it('uses error color for heart', () => {
      const { container } = render(<EmptyStateIllustration type="friends" />)
      const paths = container.querySelectorAll('path')
      const fills = Array.from(paths).map((p) => p.getAttribute('fill'))
      expect(fills.some((f) => f?.includes('error'))).toBe(true)
    })
  })

  // ---- Messages illustration ----
  describe('messages type', () => {
    it('renders SVG', () => {
      const { container } = render(<EmptyStateIllustration type="messages" />)
      expect(container.querySelector('svg')).toBeTruthy()
    })

    it('renders two chat bubble rectangles', () => {
      const { container } = render(<EmptyStateIllustration type="messages" />)
      const rects = container.querySelectorAll('rect')
      // 2 chat bubble rects
      expect(rects.length).toBeGreaterThanOrEqual(2)
    })

    it('renders chat bubble tails (path elements)', () => {
      const { container } = render(<EmptyStateIllustration type="messages" />)
      const paths = container.querySelectorAll('path')
      // 2 tail paths
      expect(paths.length).toBeGreaterThanOrEqual(2)
    })

    it('renders text lines (line elements)', () => {
      const { container } = render(<EmptyStateIllustration type="messages" />)
      const lines = container.querySelectorAll('line')
      // 4 text lines (2 per bubble)
      expect(lines.length).toBeGreaterThanOrEqual(4)
    })

    it('renders 3 animated dots', () => {
      const { container } = render(<EmptyStateIllustration type="messages" />)
      const circles = container.querySelectorAll('circle')
      // 3 bouncing dots
      expect(circles.length).toBeGreaterThanOrEqual(3)
    })

    it('uses primary and success colors for bubbles', () => {
      const { container } = render(<EmptyStateIllustration type="messages" />)
      const rects = container.querySelectorAll('rect')
      const fills = Array.from(rects).map((r) => r.getAttribute('fill'))
      expect(fills.some((f) => f?.includes('primary'))).toBe(true)
      expect(fills.some((f) => f?.includes('success'))).toBe(true)
    })
  })

  // ---- className propagation ----
  describe('className propagation', () => {
    it('applies className to both wrapper div and SVG for sessions', () => {
      const { container } = render(
        <EmptyStateIllustration type="sessions" className="test-class" />
      )
      const wrapper = container.firstChild as HTMLElement
      const svg = container.querySelector('svg')
      expect(wrapper?.className).toContain('test-class')
      // className is also passed to the SVG element
      expect(svg?.className?.baseVal || svg?.getAttribute('class')).toContain('test-class')
    })

    it('applies className to wrapper for all types', () => {
      const types = ['sessions', 'squads', 'friends', 'messages'] as const
      for (const type of types) {
        const { container, unmount } = render(
          <EmptyStateIllustration type={type} className={`class-${type}`} />
        )
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper?.className).toContain(`class-${type}`)
        unmount()
      }
    })
  })
})
