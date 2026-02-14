import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { TourGuide } from '../TourGuide'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/other', hash: '', search: '' }),
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

vi.mock('../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

vi.mock('../tour/TourOverlay', () => ({
  TourOverlay: ({ onSkip }: any) => createElement('div', { 'data-testid': 'tour-overlay', onClick: onSkip }),
}))

vi.mock('../tour/TourTooltip', () => ({
  TourTooltip: (props: any) => createElement('div', { 'data-testid': 'tour-tooltip' }, props.title),
}))

describe('TourGuide', () => {
  it('renders nothing when not on /home or /squads', () => {
    const { container } = render(<TourGuide />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing initially even on /home (waits for timer)', () => {
    const { useLocation } = require('react-router')
    useLocation.mockReturnValue({ pathname: '/home', hash: '', search: '' })

    const { container } = render(<TourGuide />)
    // Tour starts after 3s delay, so initially renders nothing
    expect(container.innerHTML).toBe('')
  })
})
