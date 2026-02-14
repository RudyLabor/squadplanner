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

vi.mock('../MockupShared', () => ({
  mockMembers: [
    { name: 'Max', initial: 'M', color: 'blue', score: 94 },
    { name: 'Luna', initial: 'L', color: 'green', score: 100 },
    { name: 'Kira', initial: 'K', color: 'yellow', score: 87 },
    { name: 'Jay', initial: 'J', color: 'purple', score: 92 },
  ],
  MockNavbar: ({ active }: any) => createElement('nav', null, `Nav:${active}`),
}))

import { PartyScreen, ProfileScreen } from '../MockupScreensParty'

describe('MockupScreensParty', () => {
  it('PartyScreen renders without crash', () => {
    render(<PartyScreen />)
    expect(screen.getByText('Party vocale en cours')).toBeInTheDocument()
  })

  it('ProfileScreen renders without crash', () => {
    render(<ProfileScreen />)
    expect(screen.getByText('MaxGamer_94')).toBeInTheDocument()
  })
})
