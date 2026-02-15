import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// --- Supabase mock with chainable builder ---
const { mockSupabase, mockFrom, mockSelect, mockEq, mockIn, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockIn = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  // Default chain: from -> select -> eq -> single
  // Reset builds the chain fresh each time
  function setupChain(resolvedValue: { data: unknown; error: unknown }) {
    mockSingle.mockResolvedValue(resolvedValue)
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq, in: mockIn })
    mockFrom.mockReturnValue({ select: mockSelect })
  }

  const mockSupabase = {
    auth: { getUser: vi.fn(), getSession: vi.fn() },
    from: mockFrom,
  }

  return { mockSupabase, mockFrom, mockSelect, mockEq, mockIn, mockSingle, setupChain }
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

import { useSquadDetailsQuery, useSquadsPremiumStatusQuery } from '../useSquadDetails'

describe('useSquadDetailsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches squad details and returns all fields', async () => {
    const mockSquad = {
      id: 'squad-1',
      name: 'Alpha Squad',
      game: 'Valorant',
      invite_code: 'INV-ABC',
      owner_id: 'user-owner',
      is_premium: true,
      created_at: '2025-06-01T00:00:00Z',
      total_sessions: 42,
      total_members: 5,
    }
    mockSingle.mockResolvedValue({ data: mockSquad, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadDetailsQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: all fields from the mock data flow through correctly
    expect(result.current.data!.id).toBe('squad-1')
    expect(result.current.data!.name).toBe('Alpha Squad')
    expect(result.current.data!.game).toBe('Valorant')
    expect(result.current.data!.invite_code).toBe('INV-ABC')
    expect(result.current.data!.owner_id).toBe('user-owner')
    expect(result.current.data!.is_premium).toBe(true)
    expect(result.current.data!.total_sessions).toBe(42)
    expect(result.current.data!.total_members).toBe(5)

    // STRICT: Supabase was called with correct table
    expect(mockFrom).toHaveBeenCalledWith('squads')
    // STRICT: eq filter was called with correct column and value
    expect(mockEq).toHaveBeenCalledWith('id', 'squad-1')
    // STRICT: .single() was called
    expect(mockSingle).toHaveBeenCalled()
  })

  it('returns null when squad is not found (PGRST116)', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Row not found' },
    })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadDetailsQuery('nonexistent-squad'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: PGRST116 error is handled gracefully, returns null (not throw)
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('throws and becomes error state on non-PGRST116 DB errors', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "squads" does not exist' },
    })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadDetailsQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // STRICT: non-PGRST116 error propagates as query error
    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled and idle when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadDetailsQuery(undefined), {
      wrapper: createWrapper(),
    })

    // STRICT: query does not fire at all
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('selects the correct columns in the query', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'squad-1' }, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadDetailsQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: select was called with the exact column list from the source
    expect(mockSelect).toHaveBeenCalledWith(
      'id, name, game, invite_code, owner_id, is_premium, created_at, total_sessions, total_members'
    )
  })

  it('returns a non-premium squad correctly', async () => {
    const mockSquad = {
      id: 'squad-free',
      name: 'Free Squad',
      game: 'League of Legends',
      invite_code: 'INV-FREE',
      owner_id: 'user-2',
      is_premium: false,
      created_at: '2026-01-01T00:00:00Z',
      total_sessions: 0,
      total_members: 1,
    }
    mockSingle.mockResolvedValue({ data: mockSquad, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadDetailsQuery('squad-free'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: is_premium is explicitly false, not just falsy
    expect(result.current.data!.is_premium).toBe(false)
    expect(result.current.data!.name).toBe('Free Squad')
    expect(result.current.data!.total_sessions).toBe(0)
  })
})

describe('useSquadsPremiumStatusQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches premium status for multiple squads and builds correct map', async () => {
    const mockData = [
      { id: 'squad-1', is_premium: true },
      { id: 'squad-2', is_premium: false },
      { id: 'squad-3', is_premium: true },
    ]
    mockIn.mockResolvedValue({ data: mockData, error: null })
    mockSelect.mockReturnValue({ in: mockIn })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(
      () => useSquadsPremiumStatusQuery(['squad-1', 'squad-2', 'squad-3']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: returned map has correct boolean values per squad ID
    expect(result.current.data).toEqual({
      'squad-1': true,
      'squad-2': false,
      'squad-3': true,
    })

    // STRICT: correct table and column selection
    expect(mockFrom).toHaveBeenCalledWith('squads')
    expect(mockSelect).toHaveBeenCalledWith('id, is_premium')
    expect(mockIn).toHaveBeenCalledWith('id', ['squad-1', 'squad-2', 'squad-3'])
  })

  it('is disabled when squadIds array is empty', () => {
    const { result } = renderHook(() => useSquadsPremiumStatusQuery([]), {
      wrapper: createWrapper(),
    })

    // STRICT: query is idle, never fetches
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('propagates DB errors to query error state', async () => {
    mockIn.mockResolvedValue({
      data: null,
      error: { message: 'permission denied for table squads' },
    })
    mockSelect.mockReturnValue({ in: mockIn })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useSquadsPremiumStatusQuery(['squad-1']), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // STRICT: error propagated, data undefined
    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })

  it('treats missing is_premium as false in the result map', async () => {
    // Supabase may return null/undefined for is_premium
    const mockData = [
      { id: 'squad-1', is_premium: null },
      { id: 'squad-2', is_premium: undefined },
    ]
    mockIn.mockResolvedValue({ data: mockData, error: null })
    mockSelect.mockReturnValue({ in: mockIn })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(
      () => useSquadsPremiumStatusQuery(['squad-1', 'squad-2']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: falsy is_premium values become false via `|| false`
    expect(result.current.data!['squad-1']).toBe(false)
    expect(result.current.data!['squad-2']).toBe(false)
  })
})
