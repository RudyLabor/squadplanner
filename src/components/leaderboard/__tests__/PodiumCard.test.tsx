import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { PodiumCard } from '../PodiumCard'

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

vi.mock('../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

vi.mock('../../ui', () => ({
  Card: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card' }, children),
}))

vi.mock('../../../utils/avatarUrl', () => ({
  getOptimizedAvatarUrl: (url: string) => url,
}))

describe('PodiumCard', () => {
  const baseEntry = {
    rank: 1,
    user_id: 'user-1',
    username: 'Champion',
    avatar_url: null,
    xp: 10000,
    level: 25,
    reliability_score: 98,
    streak_days: 14,
  }

  it('renders username', () => {
    render(<PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('Champion')).toBeDefined()
  })

  it('renders rank number', () => {
    render(<PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />)
    const rankElements = screen.getAllByText('1')
    expect(rankElements.length).toBeGreaterThan(0)
  })

  it('renders level badge', () => {
    render(<PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('Niv. 25')).toBeDefined()
  })

  it('renders XP', () => {
    render(<PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('XP')).toBeDefined()
  })

  it('renders reliability score', () => {
    render(<PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('98%')).toBeDefined()
  })

  it('renders streak days when > 0', () => {
    render(<PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('14')).toBeDefined()
  })

  it('links to user profile', () => {
    const { container } = render(
      <PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />
    )
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/profile/user-1')
  })

  it('renders crown icon for first place', () => {
    render(<PodiumCard entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByTestId('icon-Crown')).toBeDefined()
  })

  it('does not render crown for second place', () => {
    const secondPlace = { ...baseEntry, rank: 2 }
    render(<PodiumCard entry={secondPlace} isCurrentUser={false} index={1} />)
    expect(screen.queryByTestId('icon-Crown')).toBeNull()
  })
})
