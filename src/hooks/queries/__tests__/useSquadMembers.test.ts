import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// --- Supabase mock with chainable builder ---
const { mockSupabase, mockFrom, mockSelect, mockEq, mockIn, mockOrder } = vi.hoisted(() => {
  const mockOrder = vi.fn()
  const mockIn = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  const mockSupabase = {
    auth: { getUser: vi.fn(), getSession: vi.fn() },
    from: mockFrom,
  }

  return { mockSupabase, mockFrom, mockSelect, mockEq, mockIn, mockOrder }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import {
  useSquadMembersQuery,
  useUserSquadIdsQuery,
  useMemberCountsQuery,
} from '../useSquadMembers'

describe('useSquadMembersQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches squad members with profiles and returns full data', async () => {
    const mockMembers = [
      {
        id: 'mem-1',
        squad_id: 'squad-1',
        user_id: 'user-a',
        role: 'leader',
        joined_at: '2025-01-01T00:00:00Z',
        profiles: { username: 'Alice', avatar_url: 'alice.png', reliability_score: 95 },
      },
      {
        id: 'mem-2',
        squad_id: 'squad-1',
        user_id: 'user-b',
        role: 'member',
        joined_at: '2025-02-15T00:00:00Z',
        profiles: { username: 'Bob', avatar_url: null, reliability_score: 72 },
      },
    ]
    mockOrder.mockResolvedValue({ data: mockMembers, error: null })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadMembersQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: returned data has correct length
    expect(result.current.data).toHaveLength(2)

    // STRICT: first member data flows through correctly
    expect(result.current.data![0].id).toBe('mem-1')
    expect(result.current.data![0].role).toBe('leader')
    expect(result.current.data![0].user_id).toBe('user-a')
    expect(result.current.data![0].profiles!.username).toBe('Alice')
    expect(result.current.data![0].profiles!.reliability_score).toBe(95)

    // STRICT: second member data flows through correctly
    expect(result.current.data![1].id).toBe('mem-2')
    expect(result.current.data![1].role).toBe('member')
    expect(result.current.data![1].profiles!.username).toBe('Bob')
    expect(result.current.data![1].profiles!.avatar_url).toBeNull()

    // STRICT: correct table, select, filter, and ordering
    expect(mockFrom).toHaveBeenCalledWith('squad_members')
    expect(mockSelect).toHaveBeenCalledWith('*, profiles(username, avatar_url, reliability_score)')
    expect(mockEq).toHaveBeenCalledWith('squad_id', 'squad-1')
    expect(mockOrder).toHaveBeenCalledWith('joined_at', { ascending: true })
  })

  it('returns empty array when squad has no members', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadMembersQuery('empty-squad'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: empty array, not null or undefined
    expect(result.current.data).toEqual([])
    expect(result.current.data).toHaveLength(0)
  })

  it('returns empty array when data is null from Supabase', async () => {
    // Source code: return data || []
    mockOrder.mockResolvedValue({ data: null, error: null })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadMembersQuery('squad-null'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: null data is coerced to empty array via `data || []`
    expect(result.current.data).toEqual([])
  })

  it('propagates DB error to query error state', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'permission denied', code: '42501' },
    })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadMembersQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // STRICT: error state is set, data is undefined
    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled and idle when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadMembersQuery(undefined), {
      wrapper: createWrapper(),
    })

    // STRICT: query does not execute
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('useUserSquadIdsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches squad IDs for a user and maps them correctly', async () => {
    const mockData = [
      { squad_id: 'squad-aaa' },
      { squad_id: 'squad-bbb' },
      { squad_id: 'squad-ccc' },
    ]
    mockEq.mockResolvedValue({ data: mockData, error: null })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useUserSquadIdsQuery('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: returns array of squad_id strings, not the raw objects
    expect(result.current.data).toEqual(['squad-aaa', 'squad-bbb', 'squad-ccc'])
    expect(result.current.data).toHaveLength(3)

    // STRICT: correct table and filters
    expect(mockFrom).toHaveBeenCalledWith('squad_members')
    expect(mockSelect).toHaveBeenCalledWith('squad_id')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns empty array when user has no squads', async () => {
    mockEq.mockResolvedValue({ data: [], error: null })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useUserSquadIdsQuery('lonely-user'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: empty array, not null
    expect(result.current.data).toEqual([])
  })

  it('returns empty array when data is null', async () => {
    mockEq.mockResolvedValue({ data: null, error: null })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useUserSquadIdsQuery('user-null'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: null coerced to empty array via `data?.map(...) || []`
    expect(result.current.data).toEqual([])
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useUserSquadIdsQuery(undefined), {
      wrapper: createWrapper(),
    })

    // STRICT: query idle, no Supabase call
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('propagates DB errors', async () => {
    mockEq.mockResolvedValue({
      data: null,
      error: { message: 'connection refused' },
    })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useUserSquadIdsQuery('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // STRICT: error propagated
    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })
})

describe('useMemberCountsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches member counts and aggregates by squad_id', async () => {
    // 3 members in squad-1, 2 in squad-2
    const mockData = [
      { squad_id: 'squad-1' },
      { squad_id: 'squad-1' },
      { squad_id: 'squad-1' },
      { squad_id: 'squad-2' },
      { squad_id: 'squad-2' },
    ]
    mockIn.mockResolvedValue({ data: mockData, error: null })
    mockSelect.mockReturnValue({ in: mockIn })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(
      () => useMemberCountsQuery(['squad-1', 'squad-2']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: counts aggregated correctly
    expect(result.current.data).toEqual({ 'squad-1': 3, 'squad-2': 2 })
    expect(result.current.data!['squad-1']).toBe(3)
    expect(result.current.data!['squad-2']).toBe(2)

    // STRICT: correct Supabase call
    expect(mockFrom).toHaveBeenCalledWith('squad_members')
    expect(mockSelect).toHaveBeenCalledWith('squad_id')
    expect(mockIn).toHaveBeenCalledWith('squad_id', ['squad-1', 'squad-2'])
  })

  it('is disabled when squadIds array is empty', () => {
    const { result } = renderHook(() => useMemberCountsQuery([]), {
      wrapper: createWrapper(),
    })

    // STRICT: query idle, no fetch
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns empty object when no members exist', async () => {
    mockIn.mockResolvedValue({ data: [], error: null })
    mockSelect.mockReturnValue({ in: mockIn })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(
      () => useMemberCountsQuery(['squad-empty']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: empty object when no rows returned
    expect(result.current.data).toEqual({})
  })

  it('propagates DB errors', async () => {
    mockIn.mockResolvedValue({
      data: null,
      error: { message: 'timeout exceeded' },
    })
    mockSelect.mockReturnValue({ in: mockIn })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(
      () => useMemberCountsQuery(['squad-1']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    // STRICT: error propagated, no data
    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })
})
