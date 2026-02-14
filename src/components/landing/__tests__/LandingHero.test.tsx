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

vi.mock('../../icons', () => ({
  ArrowRight: (props: any) => createElement('span', props, 'arrow'),
  Sparkles: (props: any) => createElement('span', props, 'sparkles'),
}))

vi.mock('../../../utils/animations', () => ({ springTap: {} }))

vi.mock('../HeroMockup', () => ({
  HeroMockup: () => createElement('div', null, 'HeroMockup'),
}))

import { LandingHero } from '../LandingHero'

const mockMotionValue = { get: () => 0, set: vi.fn(), on: vi.fn(), destroy: vi.fn() } as any

describe('LandingHero', () => {
  it('renders without crash (logged out)', () => {
    render(
      <LandingHero
        isLoggedIn={false}
        isDesktop={true}
        mouseRotateX={mockMotionValue}
        mouseRotateY={mockMotionValue}
        heroRotateX={mockMotionValue}
        heroRotateY={mockMotionValue}
      />
    )
    expect(screen.getByText('Créer ma squad gratuitement')).toBeInTheDocument()
  })

  it('shows dashboard link when logged in', () => {
    render(
      <LandingHero
        isLoggedIn={true}
        isDesktop={true}
        mouseRotateX={mockMotionValue}
        mouseRotateY={mockMotionValue}
        heroRotateX={mockMotionValue}
        heroRotateY={mockMotionValue}
      />
    )
    expect(screen.getByText('Accéder à mes squads')).toBeInTheDocument()
  })

  it('renders hero stats', () => {
    render(
      <LandingHero
        isLoggedIn={false}
        isDesktop={false}
        mouseRotateX={mockMotionValue}
        mouseRotateY={mockMotionValue}
        heroRotateX={mockMotionValue}
        heroRotateY={mockMotionValue}
      />
    )
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('30s')).toBeInTheDocument()
  })
})
