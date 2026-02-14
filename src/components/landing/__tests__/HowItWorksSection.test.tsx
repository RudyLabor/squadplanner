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

vi.mock('../AnimatedDemo', () => ({
  AnimatedDemo: () => createElement('div', null, 'AnimatedDemo'),
  demoSteps: [
    { id: 'create', color: 'blue', duration: 3000 },
    { id: 'invite', color: 'green', duration: 2500 },
    { id: 'rsvp', color: 'yellow', duration: 2500 },
    { id: 'play', color: 'purple', duration: 3000 },
  ],
}))

import { HowItWorksSection } from '../HowItWorksSection'

describe('HowItWorksSection', () => {
  it('renders without crash', () => {
    render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    expect(screen.getByText('Comment ça marche')).toBeInTheDocument()
  })

  it('renders all step titles', () => {
    render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    expect(screen.getByText('Crée ta Squad')).toBeInTheDocument()
    expect(screen.getByText('Invite tes potes')).toBeInTheDocument()
  })
})
