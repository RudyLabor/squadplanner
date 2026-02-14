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

vi.mock('../DemoSteps', () => ({
  demoSteps: [
    { id: 'create', title: 'Crée ta Squad', subtitle: 'Test', duration: 3000, icon: () => null, color: 'blue' },
    { id: 'invite', title: 'Invite', subtitle: 'Test2', duration: 2500, icon: () => null, color: 'green' },
  ],
  stepComponents: {
    create: () => createElement('div', null, 'CreateStep'),
    invite: () => createElement('div', null, 'InviteStep'),
  },
  PhoneFrame: ({ children }: any) => createElement('div', { 'data-testid': 'phone-frame' }, children),
}))

import { AnimatedDemo } from '../AnimatedDemo'

describe('AnimatedDemo', () => {
  it('renders without crash', () => {
    render(<AnimatedDemo />)
    expect(screen.getByText('CreateStep')).toBeInTheDocument()
  })

  it('renders with controlled step', () => {
    render(<AnimatedDemo currentStep={1} onStepChange={vi.fn()} />)
    expect(screen.getByText('InviteStep')).toBeInTheDocument()
  })
})
