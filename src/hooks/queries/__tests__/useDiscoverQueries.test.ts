import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// --- Supabase mock ---
const { mockSupabase, mockFrom, mockRpc, mockSelect, mockEq, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()

  const mockSupabase = {
    auth: { getUser: vi.fn(), getSession: vi.fn() },
    from: mockFrom,
    rpc: mockRpc,
  }

  return { mockSupabase, mockFrom, mockRpc, mockSelect, mockEq, mockSingle }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

vi.mock('../../../lib/queryClient', () => ({
  queryKeys: {
    discover: {
      all: ['discover'],
      publicSquads: (game?: string, region?: string) => ['discover', 'squads', { game, region }],
      globalLeaderboard: (game?: string, region?: string) => [
        'discover',
        'leaderboard',
        { game, region },
      ],
      matchmaking: (game?: string, region?: string) => [
        'discover',
        'matchmaking',
        { game, region },
      ],
      publicProfile: (username: string) => ['discover', 'profile', username],
    },
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import {
  useBrowseSquadsQuery,
  useGlobalLeaderboardQuery,
  useMatchmakingQuery,
  usePublicProfileQuery,
} from '../useDiscoverQueries'

describe('useBrowseSquadsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches public squads via RPC and returns data', async () => {
    const mockSquads = [
      {
        id: 'squad-pub-1',
        name: 'Public Alpha',
        description: 'A great squad',
        game: 'Valorant',
        region: 'EU',
        member_count: 5,
        avg_reliability: 88,
        owner_username: 'Leader1',
        owner_avatar: 'avatar1.png',
        tags: ['competitive'],
      },
      {
        id: 'squad-pub-2',
        name: 'Public Beta',
        description: null,
        game: 'Apex',
        region: 'NA',
        member_count: 3,
        avg_reliability: 92,
        owner_username: 'Leader2',
        owner_avatar: null,
        tags: [],
      },
    ]
    mockRpc.mockResolvedValue({ data: mockSquads, error: null })

    const { result } = renderHook(() => useBrowseSquadsQuery('Valorant', 'EU'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: data flows through correctly
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].name).toBe('Public Alpha')
    expect(result.current.data![0].game).toBe('Valorant')
    expect(result.current.data![0].member_count).toBe(5)
    expect(result.current.data![0].avg_reliability).toBe(88)
    expect(result.current.data![0].tags).toEqual(['competitive'])

    expect(result.current.data![1].name).toBe('Public Beta')
    expect(result.current.data![1].description).toBeNull()
    expect(result.current.data![1].owner_avatar).toBeNull()

    // STRICT: RPC called with correct function name and parameters
    expect(mockRpc).toHaveBeenCalledWith('browse_public_squads', {
      p_game: 'Valorant',
      p_region: 'EU',
      p_limit: 20,
      p_offset: 0,
    })
  })

  it('filters out test/debug/audit squads from results', async () => {
    const mockSquads = [
      {
        id: 'squad-real',
        name: 'Real Squad',
        description: null,
        game: 'CS2',
        region: null,
        member_count: 4,
        avg_reliability: 90,
        owner_username: 'user1',
        owner_avatar: null,
        tags: [],
      },
      {
        id: 'squad-test',
        name: 'Test Squad',
        description: null,
        game: 'CS2',
        region: null,
        member_count: 1,
        avg_reliability: 0,
        owner_username: 'tester',
        owner_avatar: null,
        tags: [],
      },
      {
        id: 'squad-debug',
        name: 'Debug Session',
        description: null,
        game: 'CS2',
        region: null,
        member_count: 1,
        avg_reliability: 0,
        owner_username: 'dev',
        owner_avatar: null,
        tags: [],
      },
      {
        id: 'squad-audit',
        name: 'Audit Review Squad',
        description: null,
        game: 'CS2',
        region: null,
        member_count: 2,
        avg_reliability: 50,
        owner_username: 'auditor',
        owner_avatar: null,
        tags: [],
      },
    ]
    mockRpc.mockResolvedValue({ data: mockSquads, error: null })

    const { result } = renderHook(() => useBrowseSquadsQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: test/debug/audit squads are filtered out
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('Real Squad')
  })

  it('returns empty array on RPC error (graceful degradation)', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'function not found' },
    })

    const { result } = renderHook(() => useBrowseSquadsQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: error is swallowed, returns empty array (not thrown)
    expect(result.current.data).toEqual([])
    expect(result.current.isError).toBe(false)
  })

  it('passes null for game and region when not provided', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useBrowseSquadsQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: undefined params converted to null in RPC call
    expect(mockRpc).toHaveBeenCalledWith('browse_public_squads', {
      p_game: null,
      p_region: null,
      p_limit: 20,
      p_offset: 0,
    })
  })
})

describe('useGlobalLeaderboardQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches global leaderboard and returns ranked entries', async () => {
    const mockEntries = [
      {
        rank: 1,
        user_id: 'user-top',
        username: 'ProPlayer',
        avatar_url: 'pro.png',
        xp: 5000,
        level: 25,
        reliability_score: 99,
        streak_days: 30,
        total_sessions: 200,
        region: 'EU',
      },
      {
        rank: 2,
        user_id: 'user-second',
        username: 'GoodPlayer',
        avatar_url: null,
        xp: 3500,
        level: 18,
        reliability_score: 95,
        streak_days: 15,
        total_sessions: 120,
        region: 'NA',
      },
    ]
    mockRpc.mockResolvedValue({ data: mockEntries, error: null })

    const { result } = renderHook(() => useGlobalLeaderboardQuery('Valorant', 'EU'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: leaderboard entries flow through correctly
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].rank).toBe(1)
    expect(result.current.data![0].username).toBe('ProPlayer')
    expect(result.current.data![0].xp).toBe(5000)
    expect(result.current.data![0].level).toBe(25)
    expect(result.current.data![0].streak_days).toBe(30)

    expect(result.current.data![1].rank).toBe(2)
    expect(result.current.data![1].username).toBe('GoodPlayer')
    expect(result.current.data![1].avatar_url).toBeNull()

    // STRICT: correct RPC call
    expect(mockRpc).toHaveBeenCalledWith('get_global_leaderboard', {
      p_game: 'Valorant',
      p_region: 'EU',
      p_limit: 50,
    })
  })

  it('returns empty array on RPC error (graceful degradation)', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'timeout' },
    })

    const { result } = renderHook(() => useGlobalLeaderboardQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: error swallowed, returns empty array
    expect(result.current.data).toEqual([])
    expect(result.current.isError).toBe(false)
  })

  it('passes null params when game/region are undefined', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    renderHook(() => useGlobalLeaderboardQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled()
    })

    // STRICT: undefined converted to null
    expect(mockRpc).toHaveBeenCalledWith('get_global_leaderboard', {
      p_game: null,
      p_region: null,
      p_limit: 50,
    })
  })

  it('uses custom limit when provided', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    renderHook(() => useGlobalLeaderboardQuery('CS2', 'NA', 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled()
    })

    // STRICT: custom limit passed through
    expect(mockRpc).toHaveBeenCalledWith('get_global_leaderboard', {
      p_game: 'CS2',
      p_region: 'NA',
      p_limit: 10,
    })
  })
})

describe('useMatchmakingQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches matchmaking players and returns data', async () => {
    const mockPlayers = [
      {
        user_id: 'user-match-1',
        username: 'MatchAlice',
        avatar_url: 'alice.png',
        reliability_score: 90,
        level: 15,
        xp: 2000,
        preferred_games: ['Valorant', 'CS2'],
        region: 'EU',
        total_sessions: 80,
        playstyle: 'aggressive',
      },
      {
        user_id: 'user-match-2',
        username: 'MatchBob',
        avatar_url: null,
        reliability_score: 85,
        level: 10,
        xp: 1200,
        preferred_games: ['Apex'],
        region: 'NA',
        total_sessions: 40,
        playstyle: null,
      },
    ]
    mockRpc.mockResolvedValue({ data: mockPlayers, error: null })

    const { result } = renderHook(() => useMatchmakingQuery('Valorant', 'EU'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: player data flows through
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].username).toBe('MatchAlice')
    expect(result.current.data![0].preferred_games).toEqual(['Valorant', 'CS2'])
    expect(result.current.data![0].playstyle).toBe('aggressive')
    expect(result.current.data![0].reliability_score).toBe(90)

    expect(result.current.data![1].username).toBe('MatchBob')
    expect(result.current.data![1].playstyle).toBeNull()

    // STRICT: correct RPC call
    expect(mockRpc).toHaveBeenCalledWith('find_players_for_squad', {
      p_game: 'Valorant',
      p_region: 'EU',
      p_limit: 20,
    })
  })

  it('returns empty array on RPC error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    })

    const { result } = renderHook(() => useMatchmakingQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: graceful degradation
    expect(result.current.data).toEqual([])
    expect(result.current.isError).toBe(false)
  })
})

describe('usePublicProfileQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches a public profile by username', async () => {
    const mockProfile = {
      id: 'user-profile-1',
      username: 'CoolGamer',
      avatar_url: 'cool.png',
      bio: 'I love gaming',
      reliability_score: 95,
      total_sessions: 150,
      total_checkins: 140,
      total_noshow: 5,
      total_late: 5,
      xp: 4000,
      level: 20,
      streak_days: 14,
      region: 'EU',
      preferred_games: ['Valorant', 'Apex'],
      playstyle: 'tactical',
      twitch_username: 'coolgamer_tv',
      discord_username: 'CoolGamer#1234',
      created_at: '2024-06-01T00:00:00Z',
    }
    mockSingle.mockResolvedValue({ data: mockProfile, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => usePublicProfileQuery('CoolGamer'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: profile data flows through completely
    expect(result.current.data!.id).toBe('user-profile-1')
    expect(result.current.data!.username).toBe('CoolGamer')
    expect(result.current.data!.bio).toBe('I love gaming')
    expect(result.current.data!.xp).toBe(4000)
    expect(result.current.data!.level).toBe(20)
    expect(result.current.data!.reliability_score).toBe(95)
    expect(result.current.data!.streak_days).toBe(14)
    expect(result.current.data!.twitch_username).toBe('coolgamer_tv')
    expect(result.current.data!.playstyle).toBe('tactical')

    // STRICT: correct Supabase query
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockSelect).toHaveBeenCalledWith(
      'id, username, avatar_url, bio, reliability_score, total_sessions, total_checkins, total_noshow, total_late, xp, level, streak_days, region, preferred_games, playstyle, twitch_username, discord_username, created_at'
    )
    expect(mockEq).toHaveBeenCalledWith('username', 'CoolGamer')
    expect(mockSingle).toHaveBeenCalled()
  })

  it('returns null when profile is not found', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Row not found' },
    })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => usePublicProfileQuery('nonexistent_user'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: error is swallowed, returns null (source returns null on any error)
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('is disabled when username is undefined', () => {
    const { result } = renderHook(() => usePublicProfileQuery(undefined), {
      wrapper: createWrapper(),
    })

    // STRICT: query does not fire
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns null on any DB error (graceful)', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'connection timeout' },
    })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => usePublicProfileQuery('someuser'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: any error returns null, no throw
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })
})
