import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockGte = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    gte: mockGte,
    order: mockOrder,
    limit: mockLimit,
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
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
    sessions: {
      all: ['sessions'],
      lists: () => ['sessions', 'list'],
      list: (squadId?: string) => squadId ? ['sessions', 'list', { squadId }] : ['sessions', 'list'],
      upcoming: () => ['sessions', 'upcoming'],
      details: () => ['sessions', 'detail'],
      detail: (id: string) => ['sessions', 'detail', id],
    },
  },
}))

vi.mock('../../../lib/systemMessages', () => ({
  sendRsvpMessage: vi.fn(),
  sendSessionConfirmedMessage: vi.fn(),
}))

vi.mock('../../../utils/optimisticUpdate', () => ({
  createOptimisticMutation: vi.fn().mockReturnValue({
    onMutate: vi.fn(),
    onError: vi.fn(),
    onSettled: vi.fn(),
  }),
  optimisticId: vi.fn().mockReturnValue('optimistic-id'),
}))

vi.mock('../../../lib/challengeTracker', () => ({
  trackChallengeProgress: vi.fn().mockResolvedValue(undefined),
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

import { useSquadSessionsQuery, useUpcomingSessionsQuery, useSessionQuery } from '../useSessionsQuery'

describe('useSquadSessionsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useSquadSessionsQuery('squad-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useSquadSessionsQuery('squad-1'), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBeDefined()
  })

  it('is disabled when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadSessionsQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns data property', () => {
    const { result } = renderHook(() => useSquadSessionsQuery('squad-1'), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('data')
  })
})

describe('useUpcomingSessionsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useUpcomingSessionsQuery('user-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useUpcomingSessionsQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useSessionQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useSessionQuery('session-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('is disabled when sessionId is undefined', () => {
    const { result } = renderHook(() => useSessionQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
