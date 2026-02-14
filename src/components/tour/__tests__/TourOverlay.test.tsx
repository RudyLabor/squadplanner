import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { TourOverlay } from '../TourOverlay'

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

describe('TourOverlay', () => {
  it('renders overlay element', () => {
    const { container } = render(<TourOverlay targetRect={null} onSkip={vi.fn()} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('calls onSkip when overlay is clicked', () => {
    const onSkip = vi.fn()
    const { container } = render(<TourOverlay targetRect={null} onSkip={onSkip} />)
    const overlay = container.firstChild
    if (overlay) fireEvent.click(overlay as Element)
    expect(onSkip).toHaveBeenCalled()
  })

  it('renders cutout rectangle when targetRect is provided', () => {
    const rect = new DOMRect(100, 200, 300, 50)
    const { container } = render(<TourOverlay targetRect={rect} onSkip={vi.fn()} />)
    const rects = container.querySelectorAll('rect')
    // Should have mask rect and overlay rect plus cutout
    expect(rects.length).toBeGreaterThanOrEqual(2)
  })

  it('renders highlight ring when targetRect is provided', () => {
    const rect = new DOMRect(100, 200, 300, 50)
    const { container } = render(<TourOverlay targetRect={rect} onSkip={vi.fn()} />)
    const highlightRing = container.querySelector('.border-primary')
    expect(highlightRing).toBeTruthy()
  })

  it('does not render highlight ring when targetRect is null', () => {
    const { container } = render(<TourOverlay targetRect={null} onSkip={vi.fn()} />)
    const highlightRing = container.querySelector('.border-primary')
    expect(highlightRing).toBeNull()
  })
})
