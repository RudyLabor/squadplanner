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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  CardContent: ({ children, ...props }: any) => createElement('div', props, children),
}))

import { SquadCard } from '../SquadCard'

describe('SquadCard', () => {
  const defaultProps = {
    squad: { id: 's1', name: 'Les Ranked', game: 'Valorant', invite_code: 'ABC123', member_count: 5 },
    isOwner: false,
    hasActiveParty: false,
    copiedCode: null,
    onCopyCode: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<SquadCard {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows squad name', () => {
    render(<SquadCard {...defaultProps} />)
    expect(screen.getByText('Les Ranked')).toBeTruthy()
  })

  it('shows game and member count', () => {
    render(<SquadCard {...defaultProps} />)
    expect(screen.getByText(/Valorant · 5 membres/)).toBeTruthy()
  })

  it('shows party indicator when active', () => {
    render(<SquadCard {...defaultProps} hasActiveParty={true} />)
    expect(screen.getByText('Party en cours')).toBeTruthy()
  })
})
