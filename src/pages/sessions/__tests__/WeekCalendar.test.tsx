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

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

import { WeekCalendar } from '../WeekCalendar'

describe('WeekCalendar', () => {
  it('renders without crashing', () => {
    const { container } = render(<WeekCalendar sessions={[]} />)
    expect(container).toBeTruthy()
  })

  it('renders week header', () => {
    render(<WeekCalendar sessions={[]} />)
    expect(screen.getByText('Cette semaine')).toBeTruthy()
  })

  it('renders day abbreviations', () => {
    render(<WeekCalendar sessions={[]} />)
    expect(screen.getByText('Lun')).toBeTruthy()
    expect(screen.getByText('Dim')).toBeTruthy()
  })

  it('renders legend', () => {
    render(<WeekCalendar sessions={[]} />)
    expect(screen.getByText('En attente')).toBeTruthy()
    expect(screen.getByText('Confirmée')).toBeTruthy()
  })

  it('renders navigation buttons', () => {
    render(<WeekCalendar sessions={[]} />)
    expect(screen.getByLabelText('Semaine précédente')).toBeTruthy()
    expect(screen.getByLabelText('Semaine suivante')).toBeTruthy()
  })
})
