import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { LeaderboardListItem } from '../LeaderboardListItem'

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

vi.mock('../../../utils/avatarUrl', () => ({
  getOptimizedAvatarUrl: (url: string) => url,
}))

describe('LeaderboardListItem', () => {
  const baseEntry = {
    rank: 4,
    user_id: 'user-1',
    username: 'TestPlayer',
    avatar_url: null,
    xp: 5000,
    level: 15,
    reliability_score: 92,
    streak_days: 7,
  }

  it('renders username', () => {
    render(<LeaderboardListItem entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('TestPlayer')).toBeDefined()
  })

  it('renders rank', () => {
    render(<LeaderboardListItem entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('4')).toBeDefined()
  })

  it('renders XP with locale formatting', () => {
    render(<LeaderboardListItem entry={baseEntry} isCurrentUser={false} index={0} />)
    // 5000 or 5,000 or 5 000 depending on locale
    expect(screen.getByText((_, el) => el?.textContent?.includes('5') ?? false)).toBeDefined()
  })

  it('renders level badge', () => {
    render(<LeaderboardListItem entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('Niv. 15')).toBeDefined()
  })

  it('renders reliability score', () => {
    render(<LeaderboardListItem entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('92%')).toBeDefined()
  })

  it('renders streak days', () => {
    render(<LeaderboardListItem entry={baseEntry} isCurrentUser={false} index={0} />)
    expect(screen.getByText('7j')).toBeDefined()
  })

  it('shows "Toi" badge when isCurrentUser', () => {
    render(<LeaderboardListItem entry={baseEntry} isCurrentUser={true} index={0} />)
    expect(screen.getByText('Toi')).toBeDefined()
  })

  it('does not show streak when streak_days is 0', () => {
    const entryNoStreak = { ...baseEntry, streak_days: 0 }
    render(<LeaderboardListItem entry={entryNoStreak} isCurrentUser={false} index={0} />)
    expect(screen.queryByText('0j')).toBeNull()
  })

  it('links to user profile', () => {
    const { container } = render(
      <LeaderboardListItem entry={baseEntry} isCurrentUser={false} index={0} />
    )
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/profile/user-1')
  })
})
