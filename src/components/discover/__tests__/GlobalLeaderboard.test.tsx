import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { GlobalLeaderboard } from '../GlobalLeaderboard'

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

const mockUseGlobalLeaderboardQuery = vi.fn()
vi.mock('../../../hooks/queries', () => ({
  useGlobalLeaderboardQuery: (...args: any[]) => mockUseGlobalLeaderboardQuery(...args),
}))

describe('GlobalLeaderboard', () => {
  it('renders loading skeletons while loading', () => {
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = render(<GlobalLeaderboard />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it('renders empty state when no entries', () => {
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: [], isLoading: false })
    render(<GlobalLeaderboard />)
    expect(screen.getByText('Pas encore de classement')).toBeDefined()
  })

  it('renders leaderboard entries', () => {
    const entries = [
      { user_id: 'u1', username: 'player1', avatar_url: null, xp: 1000, level: 10, reliability_score: 95, streak_days: 5, rank: 1 },
      { user_id: 'u2', username: 'player2', avatar_url: null, xp: 800, level: 8, reliability_score: 90, streak_days: 3, rank: 2 },
      { user_id: 'u3', username: 'player3', avatar_url: null, xp: 600, level: 6, reliability_score: 85, streak_days: 0, rank: 3 },
      { user_id: 'u4', username: 'player4', avatar_url: null, xp: 400, level: 4, reliability_score: 80, streak_days: 0, rank: 4 },
    ]
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: entries, isLoading: false })
    render(<GlobalLeaderboard />)
    expect(screen.getByText('player1')).toBeDefined()
    expect(screen.getByText('player2')).toBeDefined()
    expect(screen.getByText('player3')).toBeDefined()
    expect(screen.getByText('player4')).toBeDefined()
  })

  it('passes correct arguments to the query', () => {
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: [], isLoading: false })
    render(<GlobalLeaderboard game="Valorant" region="EU" limit={25} />)
    expect(mockUseGlobalLeaderboardQuery).toHaveBeenCalledWith('Valorant', 'EU', 25)
  })
})
