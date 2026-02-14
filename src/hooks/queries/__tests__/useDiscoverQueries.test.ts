import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
  })
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

vi.mock('../../../lib/queryClient', () => ({
  queryKeys: {
    discover: {
      all: ['discover'],
      publicSquads: (game?: string, region?: string) => ['discover', 'squads', { game, region }],
      globalLeaderboard: (game?: string, region?: string) => ['discover', 'leaderboard', { game, region }],
      matchmaking: (game?: string, region?: string) => ['discover', 'matchmaking', { game, region }],
      publicProfile: (username: string) => ['discover', 'profile', username],
    },
  },
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

import { useBrowseSquadsQuery, useGlobalLeaderboardQuery, usePublicProfileQuery } from '../useDiscoverQueries'

describe('useBrowseSquadsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useBrowseSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useBrowseSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('has data property', () => {
    const { result } = renderHook(() => useBrowseSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('data')
  })
})

describe('useGlobalLeaderboardQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useGlobalLeaderboardQuery(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useGlobalLeaderboardQuery(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })
})

describe('usePublicProfileQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => usePublicProfileQuery('testuser'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('is disabled when username is undefined', () => {
    const { result } = renderHook(() => usePublicProfileQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
