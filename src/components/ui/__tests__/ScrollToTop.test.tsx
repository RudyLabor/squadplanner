import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ScrollToTop } from '../ScrollToTop'
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

describe('ScrollToTop', () => {
  it('renders without crash', () => {
    const { container } = render(<ScrollToTop />)
    expect(container).toBeInTheDocument()
  })

  it('is hidden by default (scrollY = 0)', () => {
    render(<ScrollToTop />)
    expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument()
  })

  it('shows button when scrolled past 300px', () => {
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
  })

  it('calls scrollTo when clicked', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo as any
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
      window.dispatchEvent(new Event('scroll'))
    })
    screen.getByLabelText('Scroll to top').click()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
