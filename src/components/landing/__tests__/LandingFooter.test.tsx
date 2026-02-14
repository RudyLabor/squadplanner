import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

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

import { LandingFooter } from '../LandingFooter'

describe('LandingFooter', () => {
  it('renders without crash', () => {
    render(<LandingFooter />)
    expect(screen.getByText('Squad Planner')).toBeInTheDocument()
  })

  it('renders footer sections', () => {
    render(<LandingFooter />)
    expect(screen.getByText('Produit')).toBeInTheDocument()
    expect(screen.getByText('Ressources')).toBeInTheDocument()
    expect(screen.getByText('Légal')).toBeInTheDocument()
    expect(screen.getByText('Communauté')).toBeInTheDocument()
  })

  it('renders newsletter form', () => {
    render(<LandingFooter />)
    expect(screen.getByPlaceholderText('Reçois les updates Squad Planner')).toBeInTheDocument()
    expect(screen.getByText("S'abonner")).toBeInTheDocument()
  })

  it('renders trust badges', () => {
    render(<LandingFooter />)
    expect(screen.getByText(/Hébergé en France/)).toBeInTheDocument()
    expect(screen.getByText(/RGPD compliant/)).toBeInTheDocument()
  })
})
