import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { StreakHeatmap } from '../StreakHeatmap'

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

describe('StreakHeatmap', () => {
  const flameColors = {
    primary: 'var(--color-orange)',
    secondary: 'var(--color-warning)',
    glow: 'var(--color-orange-30)',
  }

  it('renders the heatmap grid', () => {
    const { container } = render(<StreakHeatmap streakDays={10} flameColors={flameColors} />)
    // 7 day labels
    expect(screen.getByText('L')).toBeDefined()
    expect(screen.getByText('D')).toBeDefined()
    // Should have grid cells
    const cells = container.querySelectorAll('.aspect-square')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('renders day labels', () => {
    render(<StreakHeatmap streakDays={5} flameColors={flameColors} />)
    const labels = ['L', 'M', 'J', 'V', 'S', 'D']
    for (const label of labels) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('renders "28 derniers jours" title', () => {
    render(<StreakHeatmap streakDays={5} flameColors={flameColors} />)
    expect(screen.getByText('28 derniers jours')).toBeDefined()
  })

  it('renders weekly activity section', () => {
    render(<StreakHeatmap streakDays={14} flameColors={flameColors} />)
    expect(screen.getByText('4 dernières semaines')).toBeDefined()
    expect(screen.getByText('S1')).toBeDefined()
    expect(screen.getByText('S4')).toBeDefined()
  })

  it('handles zero streak days', () => {
    const { container } = render(<StreakHeatmap streakDays={0} flameColors={flameColors} />)
    expect(container.querySelector('.aspect-square')).toBeTruthy()
  })
})
