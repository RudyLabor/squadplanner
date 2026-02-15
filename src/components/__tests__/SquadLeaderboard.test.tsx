import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  Card: ({ children, className }: any) => createElement('div', { className, 'data-testid': 'card' }, children),
}))

// Mock leaderboard sub-components — capture props
const mockPodiumCard = vi.fn()
const mockLeaderboardListItem = vi.fn()
vi.mock('../leaderboard/leaderboardConfig', () => ({}))
vi.mock('../leaderboard/PodiumCard', () => ({
  PodiumCard: (props: any) => {
    mockPodiumCard(props)
    return createElement('div', { 'data-testid': `podium-${props.entry.rank}` }, props.entry.username)
  },
}))
vi.mock('../leaderboard/LeaderboardListItem', () => ({
  LeaderboardListItem: (props: any) => {
    mockLeaderboardListItem(props)
    return createElement('div', { 'data-testid': `list-${props.entry.rank}` }, props.entry.username)
  },
}))

import { SquadLeaderboard } from '../SquadLeaderboard'

describe('SquadLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies header text, subtitle, trophy icon, top 3 podium cards, correct props passed to PodiumCard
  it('renders header, trophy icon, and podium cards for top 3 entries', () => {
    const entries = [
      { user_id: 'u1', username: 'Alice', rank: 1, xp: 1000, avatar_url: null },
      { user_id: 'u2', username: 'Bob', rank: 2, xp: 800, avatar_url: null },
      { user_id: 'u3', username: 'Charlie', rank: 3, xp: 600, avatar_url: null },
    ]

    render(createElement(SquadLeaderboard, { entries, currentUserId: 'u1' }))

    // 1. Header title
    expect(screen.getByText('Classement Squad')).toBeInTheDocument()
    // 2. Subtitle
    expect(screen.getByText('Top joueurs cette semaine')).toBeInTheDocument()
    // 3. Trophy icon
    expect(screen.getAllByTestId('icon-trophy').length).toBeGreaterThanOrEqual(1)
    // 4. All 3 podium cards rendered
    expect(screen.getByTestId('podium-1')).toBeInTheDocument()
    expect(screen.getByTestId('podium-2')).toBeInTheDocument()
    expect(screen.getByTestId('podium-3')).toBeInTheDocument()
    // 5. PodiumCard called 3 times
    expect(mockPodiumCard).toHaveBeenCalledTimes(3)
    // 6. Current user (u1) gets isCurrentUser=true
    const aliceCall = mockPodiumCard.mock.calls.find((c: any) => c[0].entry.user_id === 'u1')
    expect(aliceCall[0].isCurrentUser).toBe(true)
    // 7. Other users get isCurrentUser=false
    const bobCall = mockPodiumCard.mock.calls.find((c: any) => c[0].entry.user_id === 'u2')
    expect(bobCall[0].isCurrentUser).toBe(false)
    // 8. No empty state
    expect(screen.queryByText('Aucun classement disponible')).not.toBeInTheDocument()
  })

  // STRICT: Verifies entries with rank 4+ go to list items, podium and list coexist, correct component usage
  it('renders list items for ranks 4+ alongside podium for top 3', () => {
    const entries = [
      { user_id: 'u1', username: 'Alice', rank: 1, xp: 1000, avatar_url: null },
      { user_id: 'u2', username: 'Bob', rank: 2, xp: 800, avatar_url: null },
      { user_id: 'u3', username: 'Charlie', rank: 3, xp: 600, avatar_url: null },
      { user_id: 'u4', username: 'Dave', rank: 4, xp: 400, avatar_url: null },
      { user_id: 'u5', username: 'Eve', rank: 5, xp: 300, avatar_url: null },
    ]

    render(createElement(SquadLeaderboard, { entries, currentUserId: 'u4' }))

    // 1. Podium cards for top 3
    expect(screen.getByTestId('podium-1')).toBeInTheDocument()
    expect(screen.getByTestId('podium-2')).toBeInTheDocument()
    expect(screen.getByTestId('podium-3')).toBeInTheDocument()
    // 2. List items for ranks 4-5
    expect(screen.getByTestId('list-4')).toBeInTheDocument()
    expect(screen.getByTestId('list-5')).toBeInTheDocument()
    // 3. Card container present for list items
    expect(screen.getByTestId('card')).toBeInTheDocument()
    // 4. LeaderboardListItem called twice
    expect(mockLeaderboardListItem).toHaveBeenCalledTimes(2)
    // 5. Dave (u4) is current user in list items
    const daveCall = mockLeaderboardListItem.mock.calls.find((c: any) => c[0].entry.user_id === 'u4')
    expect(daveCall[0].isCurrentUser).toBe(true)
    // 6. Eve (u5) is NOT current user
    const eveCall = mockLeaderboardListItem.mock.calls.find((c: any) => c[0].entry.user_id === 'u5')
    expect(eveCall[0].isCurrentUser).toBe(false)
  })

  // STRICT: Verifies empty state — no entries shows trophy icon, message text, no podium or list
  it('shows empty state with trophy icon and message when no entries provided', () => {
    render(createElement(SquadLeaderboard, { entries: [], currentUserId: 'u1' }))

    // 1. Empty state message
    expect(screen.getByText('Aucun classement disponible')).toBeInTheDocument()
    // 2. Encouragement text
    expect(screen.getByText('Participe a des sessions pour apparaitre ici !')).toBeInTheDocument()
    // 3. Trophy icon is present (both header and empty state)
    expect(screen.getAllByTestId('icon-trophy').length).toBeGreaterThanOrEqual(1)
    // 4. No podium cards
    expect(screen.queryByTestId('podium-1')).not.toBeInTheDocument()
    // 5. No list items
    expect(screen.queryByTestId('list-4')).not.toBeInTheDocument()
    // 6. PodiumCard never called
    expect(mockPodiumCard).not.toHaveBeenCalled()
    // 7. LeaderboardListItem never called
    expect(mockLeaderboardListItem).not.toHaveBeenCalled()
  })

  // STRICT: Verifies sorting — entries given out of order are sorted by rank, podium and list split correctly
  it('sorts entries by rank regardless of input order', () => {
    const entries = [
      { user_id: 'u4', username: 'Dave', rank: 4, xp: 400, avatar_url: null },
      { user_id: 'u1', username: 'Alice', rank: 1, xp: 1000, avatar_url: null },
      { user_id: 'u3', username: 'Charlie', rank: 3, xp: 600, avatar_url: null },
      { user_id: 'u2', username: 'Bob', rank: 2, xp: 800, avatar_url: null },
    ]

    render(createElement(SquadLeaderboard, { entries, currentUserId: 'u1' }))

    // 1. All podium positions rendered
    expect(screen.getByTestId('podium-1')).toBeInTheDocument()
    expect(screen.getByTestId('podium-2')).toBeInTheDocument()
    expect(screen.getByTestId('podium-3')).toBeInTheDocument()
    // 2. Rank 4 in list
    expect(screen.getByTestId('list-4')).toBeInTheDocument()
    // 3. Alice is in podium with rank 1
    expect(screen.getByText('Alice')).toBeInTheDocument()
    // 4. Bob rank 2
    expect(screen.getByText('Bob')).toBeInTheDocument()
    // 5. Charlie rank 3
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    // 6. Dave rank 4 in list
    expect(screen.getByText('Dave')).toBeInTheDocument()
  })
})
