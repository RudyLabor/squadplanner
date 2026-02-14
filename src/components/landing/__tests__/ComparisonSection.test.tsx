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

vi.mock('../../SquadPlannerLogo', () => ({
  SquadPlannerLogo: () => createElement('span', null, 'Logo'),
}))

vi.mock('../../../utils/animations', () => ({
  scrollReveal: { hidden: {}, visible: {} },
}))

import { ComparisonSection } from '../ComparisonSection'

describe('ComparisonSection', () => {
  it('renders without crash', () => {
    render(<ComparisonSection />)
    expect(screen.getByText("Plus qu'un Discord pour gamers")).toBeInTheDocument()
  })

  it('renders all comparison features', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Planning de sessions avec RSVP')).toBeInTheDocument()
    expect(screen.getByText('Score de fiabilité par joueur')).toBeInTheDocument()
  })

  it('has accessible table caption', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Comparaison des fonctionnalités entre Discord et Squad Planner')).toBeInTheDocument()
  })
})
