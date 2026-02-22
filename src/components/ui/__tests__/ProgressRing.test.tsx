import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressRing } from '../ProgressRing'
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

describe('ProgressRing', () => {
  it('renders with role=progressbar', () => {
    render(<ProgressRing value={75} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('sets aria-valuenow', () => {
    render(<ProgressRing value={75} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
  })

  it('sets aria-valuemin and aria-valuemax', () => {
    render(<ProgressRing value={50} />)
    const ring = screen.getByRole('progressbar')
    expect(ring).toHaveAttribute('aria-valuemin', '0')
    expect(ring).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps value to 0-100', () => {
    render(<ProgressRing value={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('shows percentage text by default', () => {
    render(<ProgressRing value={42} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('hides percentage when showValue=false', () => {
    render(<ProgressRing value={42} showValue={false} />)
    expect(screen.queryByText('42%')).not.toBeInTheDocument()
  })

  it('renders label', () => {
    render(<ProgressRing value={50} label="Score" />)
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('uses label for aria-label', () => {
    render(<ProgressRing value={50} label="Score" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Score')
  })

  it('uses percentage for aria-label when no label', () => {
    render(<ProgressRing value={75} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '75%')
  })

  it('renders svg as aria-hidden', () => {
    const { container } = render(<ProgressRing value={50} />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
