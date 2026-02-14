import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockIn = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    in: mockIn,
    order: mockOrder,
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

import { useSquadMembersQuery, useUserSquadIdsQuery, useMemberCountsQuery } from '../useSquadMembers'

describe('useSquadMembersQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useSquadMembersQuery('squad-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useSquadMembersQuery('squad-1'), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('is disabled when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadMembersQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useUserSquadIdsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useUserSquadIdsQuery('user-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useUserSquadIdsQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useMemberCountsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useMemberCountsQuery(['squad-1']), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('is disabled when squadIds array is empty', () => {
    const { result } = renderHook(() => useMemberCountsQuery([]), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
