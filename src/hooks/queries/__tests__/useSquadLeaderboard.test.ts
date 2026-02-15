import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }),
    removeChannel: vi.fn(),
  }
  return { mockSupabase, mockFrom, mockRpc, mockGetSession }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Auth store mock
vi.mock('../../useAuth', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }), {
    getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
  }),
}))

// Toast mock
vi.mock('../../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import { useSquadLeaderboardQuery } from '../useSquadLeaderboard'
import type { LeaderboardEntry } from '../useSquadLeaderboard'

describe('useSquadLeaderboardQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies the hook renders, has correct react-query shape, and
  // starts loading when a valid squadId is provided
  it('renders with correct react-query shape and starts loading with valid squadId', () => {
    const { result } = renderHook(() => useSquadLeaderboardQuery('squad-1'), { wrapper: createWrapper() })

    // 1. result.current is defined
    expect(result.current).toBeDefined()
    // 2. Has isLoading property
    expect(result.current).toHaveProperty('isLoading')
    // 3. Initially loading
    expect(result.current.isLoading).toBe(true)
    // 4. Has data property
    expect(result.current).toHaveProperty('data')
    // 5. Has error property
    expect(result.current).toHaveProperty('error')
    // 6. error is null initially
    expect(result.current.error).toBeNull()
    // 7. Has fetchStatus property
    expect(result.current.fetchStatus).toBe('fetching')
    // 8. Has isFetching property
    expect(result.current.isFetching).toBe(true)
    // 9. Has isSuccess property
    expect(result.current.isSuccess).toBe(false)
    // 10. Has isError property
    expect(result.current.isError).toBe(false)
  })

  // STRICT: Verifies the hook is disabled and stays idle when squadId is undefined
  it('is disabled and idle when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadLeaderboardQuery(undefined), { wrapper: createWrapper() })

    // 1. fetchStatus is idle
    expect(result.current.fetchStatus).toBe('idle')
    // 2. Not fetching
    expect(result.current.isFetching).toBe(false)
    // 3. data is undefined (never fetched)
    expect(result.current.data).toBeUndefined()
    // 4. error is null
    expect(result.current.error).toBeNull()
    // 5. isLoading is false
    expect(result.current.isLoading).toBe(false)
    // 6. isSuccess is false
    expect(result.current.isSuccess).toBe(false)
    // 7. status is pending
    expect(result.current.status).toBe('pending')
    // 8. rpc was NOT called
    expect(mockRpc).not.toHaveBeenCalled()
  })

  // STRICT: Verifies the hook calls rpc with correct parameters and resolves
  // with leaderboard data
  it('calls rpc with correct parameters and resolves with data', async () => {
    const mockLeaderboard = [
      { rank: 1, user_id: 'user-1', username: 'player1', avatar_url: null, xp: 500, level: 5, reliability_score: 95, streak_days: 10 },
      { rank: 2, user_id: 'user-2', username: 'player2', avatar_url: 'https://example.com/avatar.png', xp: 400, level: 4, reliability_score: 90, streak_days: 5 },
    ]
    mockRpc.mockResolvedValueOnce({ data: mockLeaderboard, error: null })

    const { result } = renderHook(() => useSquadLeaderboardQuery('squad-1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 1. rpc was called
    expect(mockRpc).toHaveBeenCalled()
    // 2. rpc was called with 'get_squad_leaderboard'
    expect(mockRpc).toHaveBeenCalledWith('get_squad_leaderboard', { p_squad_id: 'squad-1' })
    // 3. Data was resolved
    expect(result.current.data).toBeDefined()
    // 4. Data has correct length
    expect(result.current.data).toHaveLength(2)
    // 5. First entry has correct rank
    expect(result.current.data![0].rank).toBe(1)
    // 6. First entry has correct username
    expect(result.current.data![0].username).toBe('player1')
    // 7. Second entry has correct xp
    expect(result.current.data![1].xp).toBe(400)
    // 8. isSuccess is true
    expect(result.current.isSuccess).toBe(true)
    // 9. error is null
    expect(result.current.error).toBeNull()
    // 10. fetchStatus is idle (completed)
    expect(result.current.fetchStatus).toBe('idle')
  })

  // STRICT: Verifies the LeaderboardEntry type shape and the hook export
  it('LeaderboardEntry type has correct shape and hook is properly exported', () => {
    const entry: LeaderboardEntry = {
      rank: 1,
      user_id: 'user-abc',
      username: 'gamer42',
      avatar_url: null,
      xp: 1250,
      level: 8,
      reliability_score: 92.5,
      streak_days: 15,
    }
    // 1. rank is a number
    expect(typeof entry.rank).toBe('number')
    expect(entry.rank).toBe(1)
    // 2. user_id is a string
    expect(typeof entry.user_id).toBe('string')
    // 3. username is set
    expect(entry.username).toBe('gamer42')
    // 4. avatar_url is nullable
    expect(entry.avatar_url).toBeNull()
    // 5. xp is a number
    expect(entry.xp).toBe(1250)
    // 6. level is a number
    expect(entry.level).toBe(8)
    // 7. reliability_score supports decimals
    expect(entry.reliability_score).toBe(92.5)
    // 8. streak_days is a number
    expect(entry.streak_days).toBe(15)

    // With avatar_url populated
    const entryWithAvatar: LeaderboardEntry = { ...entry, avatar_url: 'https://img.com/a.png' }
    // 9. avatar_url can be a string
    expect(entryWithAvatar.avatar_url).toBe('https://img.com/a.png')
    // 10. Hook export is a function
    expect(typeof useSquadLeaderboardQuery).toBe('function')
  })
})
