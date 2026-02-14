import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

vi.mock('../../icons', () => new Proxy({}, {
  get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', props, String(p)) : undefined,
}))

vi.mock('../illustrations/HeadphonesIllustration', () => ({ HeadphonesIllustration: () => createElement('span', null, 'headphones') }))
vi.mock('../illustrations/CalendarIllustration', () => ({ CalendarIllustration: () => createElement('span', null, 'calendar') }))
vi.mock('../illustrations/ShieldIllustration', () => ({ ShieldIllustration: () => createElement('span', null, 'shield') }))

import { FeaturesSection } from '../FeaturesSection'

describe('FeaturesSection', () => {
  it('renders without crash', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('Les 3 piliers de Squad Planner')).toBeInTheDocument()
  })

  it('renders pillar tabs', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('Party vocale 24/7')).toBeInTheDocument()
    expect(screen.getByText('Planning avec décision')).toBeInTheDocument()
    expect(screen.getByText('Fiabilité mesurée')).toBeInTheDocument()
  })

  it('switches active pillar on click', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning avec décision'))
    expect(screen.getByText(/RSVP OUI ou NON/)).toBeInTheDocument()
  })
})
