import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const { mockSupabase, mockRpc, mockFrom } = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockFrom = vi.fn()
  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      }),
    },
    rpc: mockRpc,
    from: mockFrom,
  }
  return { mockSupabase, mockRpc, mockFrom }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../useAuth', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' } }), {
    getState: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
  }),
}))

import { useMessageSearch } from '../useMessageSearch'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useMessageSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: [], error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial state with empty query', () => {
    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    expect(result.current.query).toBe('')
    expect(result.current.squadResults).toEqual([])
    expect(result.current.dmResults).toEqual([])
    expect(result.current.totalResults).toBe(0)
    expect(result.current.hasResults).toBe(false)
  })

  it('setQuery updates query state', () => {
    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('test search')
    })

    expect(result.current.query).toBe('test search')
  })

  it('clearSearch resets query to empty string', () => {
    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('some query')
    })

    expect(result.current.query).toBe('some query')

    act(() => {
      result.current.clearSearch()
    })

    expect(result.current.query).toBe('')
  })

  it('returns empty results when query is too short (< 2 chars)', async () => {
    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('a')
    })

    // Wait for the debounce (300ms) plus some buffer, wrapped in act for state updates
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400))
    })

    expect(result.current.squadResults).toEqual([])
    expect(result.current.dmResults).toEqual([])
    expect(result.current.totalResults).toBe(0)
    // RPC should not be called for queries shorter than 2 chars
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns hasResults false when no results', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('no matches here')
    })

    await waitFor(
      () => {
        expect(mockRpc).toHaveBeenCalled()
      },
      { timeout: 2000 }
    )

    await waitFor(() => {
      expect(result.current.hasResults).toBe(false)
    })

    expect(result.current.totalResults).toBe(0)
  })

  it('totalResults is sum of squad + dm results', async () => {
    const squadData = [
      {
        message_id: 'msg-1',
        content: 'hello world',
        sender_id: 'user-2',
        sender_username: 'player2',
        sender_avatar: null,
        squad_id: 'squad-1',
        squad_name: 'Squad Alpha',
        channel_id: null,
        created_at: '2026-02-14T10:00:00Z',
        relevance: 1,
      },
      {
        message_id: 'msg-2',
        content: 'hello again',
        sender_id: 'user-3',
        sender_username: 'player3',
        sender_avatar: null,
        squad_id: 'squad-1',
        squad_name: 'Squad Alpha',
        channel_id: null,
        created_at: '2026-02-14T11:00:00Z',
        relevance: 1,
      },
    ]

    const dmData = [
      {
        message_id: 'dm-1',
        content: 'hello dm',
        sender_id: 'user-2',
        sender_username: 'player2',
        sender_avatar: null,
        other_user_id: 'user-2',
        other_username: 'player2',
        created_at: '2026-02-14T12:00:00Z',
        relevance: 1,
      },
    ]

    mockRpc.mockImplementation((rpcName: string) => {
      if (rpcName === 'search_messages') {
        return Promise.resolve({ data: squadData, error: null })
      }
      if (rpcName === 'search_direct_messages') {
        return Promise.resolve({ data: dmData, error: null })
      }
      return Promise.resolve({ data: [], error: null })
    })

    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('hello')
    })

    await waitFor(
      () => {
        expect(result.current.totalResults).toBe(3)
      },
      { timeout: 2000 }
    )

    expect(result.current.squadResults).toHaveLength(2)
    expect(result.current.dmResults).toHaveLength(1)
    expect(result.current.hasResults).toBe(true)
  })

  it('squad search calls RPC search_messages when query >= 2 chars', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useMessageSearch({ squadId: 'squad-1' }), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('he')
    })

    await waitFor(
      () => {
        expect(mockRpc).toHaveBeenCalledWith(
          'search_messages',
          expect.objectContaining({
            p_user_id: 'user-1',
            p_query: 'he',
            p_squad_id: 'squad-1',
          })
        )
      },
      { timeout: 2000 }
    )
  })

  it('squad search falls back to ILIKE when RPC fails', async () => {
    // RPC fails
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc error' } })

    // ILIKE fallback chain
    const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEqSystem = vi.fn().mockReturnValue({ order: mockOrder })
    const mockIlike = vi.fn().mockReturnValue({ eq: mockEqSystem })
    const mockSelect = vi.fn().mockReturnValue({ ilike: mockIlike })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'messages') {
        return { select: mockSelect }
      }
      return {}
    })

    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('hello world')
    })

    await waitFor(
      () => {
        expect(mockFrom).toHaveBeenCalledWith('messages')
      },
      { timeout: 2000 }
    )

    expect(mockIlike).toHaveBeenCalledWith('content', '%hello world%')
  })

  it('dm search calls RPC search_direct_messages', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useMessageSearch({ otherUserId: 'user-2' }), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('hello')
    })

    await waitFor(
      () => {
        expect(mockRpc).toHaveBeenCalledWith(
          'search_direct_messages',
          expect.objectContaining({
            p_user_id: 'user-1',
            p_query: 'hello',
            p_other_user_id: 'user-2',
          })
        )
      },
      { timeout: 2000 }
    )
  })

  it('isLoading reflects loading state', () => {
    const { result } = renderHook(() => useMessageSearch(), {
      wrapper: createWrapper(),
    })

    // Initially not loading (no query, queries disabled)
    expect(result.current.isLoading).toBeDefined()
    expect(typeof result.current.isLoading).toBe('boolean')
  })
})
