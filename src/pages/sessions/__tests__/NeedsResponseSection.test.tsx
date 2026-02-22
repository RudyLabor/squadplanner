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
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../types', () => ({
  formatDate: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
}))

import { NeedsResponseSection, AllCaughtUp } from '../NeedsResponseSection'

describe('NeedsResponseSection', () => {
  it('returns null when no pending sessions', () => {
    const { container } = render(<NeedsResponseSection needsResponse={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders pending sessions', () => {
    const sessions = [{ id: 's1', title: 'Session Ranked', scheduled_at: '2026-02-15T21:00:00Z' }]
    render(<NeedsResponseSection needsResponse={sessions} />)
    expect(screen.getByText(/Ta squad t'attend/)).toBeTruthy()
    expect(screen.getByText('Session Ranked')).toBeTruthy()
  })
})

describe('AllCaughtUp', () => {
  it('returns null when needs response > 0', () => {
    const { container } = render(<AllCaughtUp needsResponse={1} confirmed={1} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when confirmed is 0', () => {
    const { container } = render(<AllCaughtUp needsResponse={0} confirmed={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows caught up message', () => {
    render(<AllCaughtUp needsResponse={0} confirmed={1} />)
    expect(screen.getByText(/T'es à jour/)).toBeTruthy()
  })
})
