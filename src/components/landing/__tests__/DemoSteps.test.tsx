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

import { demoSteps, stepComponents, PhoneFrame } from '../DemoSteps'

describe('DemoSteps', () => {
  it('exports demoSteps with 4 steps', () => {
    expect(demoSteps).toHaveLength(4)
    expect(demoSteps[0].id).toBe('create')
    expect(demoSteps[3].id).toBe('play')
  })

  it('exports stepComponents for each step', () => {
    expect(stepComponents.create).toBeDefined()
    expect(stepComponents.invite).toBeDefined()
    expect(stepComponents.rsvp).toBeDefined()
    expect(stepComponents.play).toBeDefined()
  })

  it('PhoneFrame renders children', () => {
    render(<PhoneFrame><span>Test Child</span></PhoneFrame>)
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('renders CreateStep without crash', () => {
    const Create = stepComponents.create
    render(<Create />)
    expect(screen.getByText('Les Invaincus')).toBeInTheDocument()
  })
})
