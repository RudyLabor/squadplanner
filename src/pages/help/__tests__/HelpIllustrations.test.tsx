import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
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

import { FAQIllustration } from '../HelpIllustrations'

describe('FAQIllustration', () => {
  it('renders without crashing', () => {
    const { container } = render(<FAQIllustration type="create-squad" />)
    expect(container).toBeTruthy()
  })

  it('returns null when type is undefined', () => {
    const { container } = render(<FAQIllustration type={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders create-squad illustration', () => {
    const { container } = render(<FAQIllustration type="create-squad" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders reliability-score illustration', () => {
    const { container } = render(<FAQIllustration type="reliability-score" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders plan-session illustration', () => {
    const { container } = render(<FAQIllustration type="plan-session" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders join-voice illustration', () => {
    const { container } = render(<FAQIllustration type="join-voice" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
