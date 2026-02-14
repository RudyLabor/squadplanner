import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
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
    squads: {
      all: ['squads'],
      lists: () => ['squads', 'list'],
      list: () => ['squads', 'list'],
      details: () => ['squads', 'detail'],
      detail: (id: string) => ['squads', 'detail', id],
      members: (squadId: string) => ['squads', 'detail', squadId, 'members'],
    },
  },
}))

// Mock squad mutations (re-exported by useSquadsQuery)
vi.mock('../useSquadsMutations', () => ({
  useCreateSquadMutation: vi.fn(),
  useJoinSquadMutation: vi.fn(),
  useUpdateSquadMutation: vi.fn(),
  useLeaveSquadMutation: vi.fn(),
  useDeleteSquadMutation: vi.fn(),
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

import { useSquadsQuery, useSquadQuery } from '../useSquadsQuery'

describe('useSquadsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      in: vi.fn().mockReturnThis(),
    })
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns data property', () => {
    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('data')
  })

  it('has error property', () => {
    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('error')
  })
})

describe('useSquadQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useSquadQuery('squad-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('is disabled when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
