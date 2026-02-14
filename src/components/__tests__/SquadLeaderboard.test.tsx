import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock framer-motion
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

// Mock icons
vi.mock('../icons', () => ({
  Trophy: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-trophy' }),
}))

// Mock ui
vi.mock('../ui', () => ({
  Card: ({ children, className }: any) => createElement('div', { className }, children),
}))

// Mock leaderboard sub-components
vi.mock('../leaderboard/leaderboardConfig', () => ({
  // Export type is handled by typescript
}))
vi.mock('../leaderboard/PodiumCard', () => ({
  PodiumCard: ({ entry }: any) => createElement('div', { 'data-testid': `podium-${entry.rank}` }, entry.username),
}))
vi.mock('../leaderboard/LeaderboardListItem', () => ({
  LeaderboardListItem: ({ entry }: any) => createElement('div', { 'data-testid': `list-${entry.rank}` }, entry.username),
}))

import { SquadLeaderboard } from '../SquadLeaderboard'

describe('SquadLeaderboard', () => {
  const mockEntries = [
    { user_id: 'u1', username: 'Alice', rank: 1, xp: 1000, avatar_url: null },
    { user_id: 'u2', username: 'Bob', rank: 2, xp: 800, avatar_url: null },
    { user_id: 'u3', username: 'Charlie', rank: 3, xp: 600, avatar_url: null },
    { user_id: 'u4', username: 'Dave', rank: 4, xp: 400, avatar_url: null },
  ]

  it('renders header', () => {
    render(createElement(SquadLeaderboard, {
      entries: mockEntries,
      currentUserId: 'u1',
    }))
    expect(screen.getByText('Classement Squad')).toBeDefined()
  })

  it('renders podium for top 3', () => {
    render(createElement(SquadLeaderboard, {
      entries: mockEntries,
      currentUserId: 'u1',
    }))
    expect(screen.getByTestId('podium-1')).toBeDefined()
    expect(screen.getByTestId('podium-2')).toBeDefined()
    expect(screen.getByTestId('podium-3')).toBeDefined()
  })

  it('renders list items for ranks 4+', () => {
    render(createElement(SquadLeaderboard, {
      entries: mockEntries,
      currentUserId: 'u1',
    }))
    expect(screen.getByTestId('list-4')).toBeDefined()
  })

  it('shows empty state when no entries', () => {
    render(createElement(SquadLeaderboard, {
      entries: [],
      currentUserId: 'u1',
    }))
    expect(screen.getByText('Aucun classement disponible')).toBeDefined()
  })
})
