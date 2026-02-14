import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

vi.mock('../../icons', () => ({
  ArrowRight: (props: any) => createElement('span', props, 'arrow'),
  Menu: (props: any) => createElement('span', props, 'menu'),
  X: (props: any) => createElement('span', props, 'x'),
}))

vi.mock('../../SquadPlannerLogo', () => ({
  SquadPlannerLogo: () => createElement('span', null, 'Logo'),
}))

import { LandingNavbar } from '../LandingNavbar'

describe('LandingNavbar', () => {
  it('renders without crash (logged out)', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByText('Créer ma squad')).toBeInTheDocument()
  })

  it('shows app link when logged in', () => {
    render(<LandingNavbar isLoggedIn={true} />)
    expect(screen.getByText("Aller à l'app")).toBeInTheDocument()
  })

  it('has mobile menu toggle', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const menuBtn = screen.getByLabelText('Ouvrir le menu')
    expect(menuBtn).toBeInTheDocument()
  })
})
