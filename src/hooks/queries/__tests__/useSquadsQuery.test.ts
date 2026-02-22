import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const mockGetSession = vi
    .fn()
    .mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi
      .fn()
      .mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }),
    removeChannel: vi.fn(),
  }
  return { mockSupabase, mockFrom }
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
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
    {
      getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
    }
  ),
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
  })

  it('renders without error and starts loading', () => {
    // Mock the squad_members select -> eq chain for fetchSquads
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('returns empty array when no memberships', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })

    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('returns empty array when memberships is null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('fetches squads from memberships and sorts by created_at descending', async () => {
    const memberships = [
      {
        squad_id: 'sq-1',
        squads: {
          id: 'sq-1',
          name: 'Alpha',
          game: 'Valorant',
          invite_code: 'ABC',
          owner_id: 'u1',
          total_members: 3,
          created_at: '2026-01-01T00:00:00Z',
        },
      },
      {
        squad_id: 'sq-2',
        squads: {
          id: 'sq-2',
          name: 'Beta',
          game: 'LoL',
          invite_code: 'DEF',
          owner_id: 'u2',
          total_members: 5,
          created_at: '2026-02-01T00:00:00Z',
        },
      },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: memberships, error: null }),
      }),
    })

    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    // Should be sorted by created_at descending (Beta first because 2026-02 > 2026-01)
    expect(result.current.data![0].name).toBe('Beta')
    expect(result.current.data![1].name).toBe('Alpha')
    // member_count should come from total_members
    expect(result.current.data![0].member_count).toBe(5)
    expect(result.current.data![1].member_count).toBe(3)
  })

  it('deduplicates squad_ids', async () => {
    const memberships = [
      {
        squad_id: 'sq-1',
        squads: {
          id: 'sq-1',
          name: 'Alpha',
          game: 'V',
          invite_code: 'A',
          owner_id: 'u1',
          total_members: 2,
          created_at: '2026-01-01T00:00:00Z',
        },
      },
      {
        squad_id: 'sq-1', // duplicate
        squads: {
          id: 'sq-1',
          name: 'Alpha',
          game: 'V',
          invite_code: 'A',
          owner_id: 'u1',
          total_members: 2,
          created_at: '2026-01-01T00:00:00Z',
        },
      },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: memberships, error: null }),
      }),
    })

    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Should be deduplicated
    expect(result.current.data).toHaveLength(1)
  })

  it('handles query error from squad_members', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
    })

    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })

  it('defaults member_count to 1 when total_members is undefined', async () => {
    const memberships = [
      {
        squad_id: 'sq-1',
        squads: {
          id: 'sq-1',
          name: 'Solo',
          game: 'V',
          invite_code: 'A',
          owner_id: 'u1',
          total_members: undefined,
          created_at: '2026-01-01T00:00:00Z',
        },
      },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: memberships, error: null }),
      }),
    })

    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data![0].member_count).toBe(1)
  })

  it('has error and data properties', () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
    const { result } = renderHook(() => useSquadsQuery(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('error')
  })
})

describe('useSquadQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    const { result } = renderHook(() => useSquadQuery('squad-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('is disabled when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches squad by id with members', async () => {
    const squad = {
      id: 'sq-1',
      name: 'Alpha',
      game: 'V',
      invite_code: 'A',
      owner_id: 'u1',
      created_at: '2026-01-01T00:00:00Z',
    }
    const members = [
      {
        id: 'm1',
        user_id: 'u1',
        squad_id: 'sq-1',
        profiles: { username: 'alice', avatar_url: null, reliability_score: 0.9 },
      },
      {
        id: 'm2',
        user_id: 'u2',
        squad_id: 'sq-1',
        profiles: { username: 'bob', avatar_url: 'bob.png', reliability_score: 0.8 },
      },
    ]

    const callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'squads') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: squad, error: null }),
            }),
          }),
        }
      }
      if (table === 'squad_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: members, error: null }),
          }),
        }
      }
      return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
    })

    const { result } = renderHook(() => useSquadQuery('sq-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.name).toBe('Alpha')
    expect(result.current.data?.members).toHaveLength(2)
    expect(result.current.data?.member_count).toBe(2)
    expect(result.current.data?.members![0].profiles?.username).toBe('alice')
  })

  it('handles members being null', async () => {
    const squad = {
      id: 'sq-1',
      name: 'Alpha',
      game: 'V',
      invite_code: 'A',
      owner_id: 'u1',
      created_at: '2026-01-01T00:00:00Z',
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'squads') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: squad, error: null }),
            }),
          }),
        }
      }
      if (table === 'squad_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useSquadQuery('sq-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.members).toEqual([])
    expect(result.current.data?.member_count).toBe(0)
  })

  it('handles squad fetch error', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'squads') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useSquadQuery('sq-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })
})
