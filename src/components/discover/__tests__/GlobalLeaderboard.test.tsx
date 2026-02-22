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
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, name) =>
          typeof name === 'string'
            ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
            : undefined,
      }
    )
)

const mockUseGlobalLeaderboardQuery = vi.fn()
vi.mock('../../../hooks/queries', () => ({
  useGlobalLeaderboardQuery: (...args: any[]) => mockUseGlobalLeaderboardQuery(...args),
}))

describe('GlobalLeaderboard', () => {
  // STRICT: verifies loading state renders exactly 5 skeleton placeholders with correct classes
  it('renders loading skeletons while loading', () => {
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = render(<GlobalLeaderboard />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBe(5)
    pulseElements.forEach((el) => {
      expect(el.classList.contains('rounded-lg')).toBe(true)
      expect(el.classList.contains('bg-overlay-faint')).toBe(true)
      expect(el.classList.contains('h-14')).toBe(true)
    })
    expect(screen.queryByText('Pas encore de classement')).toBeNull()
    expect(container.querySelectorAll('a').length).toBe(0)
  })

  // STRICT: verifies empty state shows trophy icon, primary + secondary text, no links
  it('renders empty state when no entries', () => {
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: [], isLoading: false })
    const { container } = render(<GlobalLeaderboard />)
    expect(screen.getByText('Pas encore de classement')).toBeDefined()
    expect(screen.getByText(/Les joueurs avec 3\+ sessions apparaitront ici/)).toBeDefined()
    expect(container.querySelector('[data-testid="icon-Trophy"]')).toBeTruthy()
    expect(container.querySelectorAll('.animate-pulse').length).toBe(0)
    expect(container.querySelectorAll('a').length).toBe(0)
    const centerDiv = screen.getByText('Pas encore de classement').closest('div')
    expect(centerDiv?.classList.contains('text-center')).toBe(true)
  })

  // STRICT: verifies podium (top 3) renders as cards with medal icons & links, rest renders as rows with rank/stats
  it('renders leaderboard entries with podium and rows', () => {
    const entries = [
      {
        user_id: 'u1',
        username: 'player1',
        avatar_url: null,
        xp: 1000,
        level: 10,
        reliability_score: 95,
        streak_days: 5,
        rank: 1,
      },
      {
        user_id: 'u2',
        username: 'player2',
        avatar_url: 'https://img.test/p2.jpg',
        xp: 800,
        level: 8,
        reliability_score: 90,
        streak_days: 3,
        rank: 2,
      },
      {
        user_id: 'u3',
        username: 'player3',
        avatar_url: null,
        xp: 600,
        level: 6,
        reliability_score: 85,
        streak_days: 0,
        rank: 3,
      },
      {
        user_id: 'u4',
        username: 'player4',
        avatar_url: null,
        xp: 400,
        level: 4,
        reliability_score: 80,
        streak_days: 0,
        rank: 4,
      },
    ]
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: entries, isLoading: false })
    const { container } = render(<GlobalLeaderboard />)

    // All 4 usernames visible
    expect(screen.getByText('player1')).toBeDefined()
    expect(screen.getByText('player2')).toBeDefined()
    expect(screen.getByText('player3')).toBeDefined()
    expect(screen.getByText('player4')).toBeDefined()

    // Links point to user profiles
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(4)
    expect(links[0].getAttribute('href')).toBe('/u/player1')
    expect(links[3].getAttribute('href')).toBe('/u/player4')

    // XP values displayed with toLocaleString formatting
    expect(screen.getByText('1,000 XP')).toBeDefined()

    // Level displayed for podium entries
    expect(screen.getByText('Nv.10')).toBeDefined()
    expect(screen.getByText('Nv.8')).toBeDefined()

    // Rank displayed for non-podium rows
    expect(screen.getByText('#4')).toBeDefined()

    // Avatar image rendered for player2
    const img = container.querySelector('img[src="https://img.test/p2.jpg"]')
    expect(img).toBeTruthy()

    // Fallback initial letter for player1 (no avatar)
    expect(screen.getByText('P')).toBeDefined()

    // Reliability score for row entries
    expect(screen.getByText('95%')).toBeDefined()

    // Streak for player with streak_days > 0
    expect(container.querySelector('[data-testid="icon-Flame"]')).toBeTruthy()
  })

  // STRICT: verifies props are forwarded to query hook with correct defaults and overrides
  it('passes correct arguments to the query', () => {
    mockUseGlobalLeaderboardQuery.mockReturnValue({ data: [], isLoading: false })

    // With explicit props
    render(<GlobalLeaderboard game="Valorant" region="EU" limit={25} />)
    expect(mockUseGlobalLeaderboardQuery).toHaveBeenCalledWith('Valorant', 'EU', 25)

    mockUseGlobalLeaderboardQuery.mockClear()

    // With defaults
    render(<GlobalLeaderboard />)
    expect(mockUseGlobalLeaderboardQuery).toHaveBeenCalledWith(undefined, undefined, 50)

    mockUseGlobalLeaderboardQuery.mockClear()

    // With partial props
    render(<GlobalLeaderboard game="CS2" />)
    expect(mockUseGlobalLeaderboardQuery).toHaveBeenCalledWith('CS2', undefined, 50)
  })
})
