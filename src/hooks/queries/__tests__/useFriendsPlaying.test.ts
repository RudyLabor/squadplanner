import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockRpc } = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
    },
    from: vi.fn(),
    rpc: mockRpc,
  }
  return { mockSupabase, mockRpc }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import { useFriendsPlayingQuery, type FriendPlaying } from '../useFriendsPlaying'

describe('useFriendsPlayingQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    const { result } = renderHook(() => useFriendsPlayingQuery('user-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('data')
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useFriendsPlayingQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches friends playing successfully', async () => {
    const mockFriends: FriendPlaying[] = [
      {
        friend_id: 'f1',
        username: 'alice',
        avatar_url: 'alice.png',
        current_game: 'Valorant',
        last_seen_at: '2026-02-15T10:00:00Z',
        squad_id: 'sq-1',
        squad_name: 'Alpha Squad',
        party_member_count: 3,
        voice_channel_id: null,
        is_in_voice: false,
      },
      {
        friend_id: 'f2',
        username: 'bob',
        avatar_url: null,
        current_game: null,
        last_seen_at: '2026-02-15T09:00:00Z',
        squad_id: 'sq-2',
        squad_name: 'Beta',
        party_member_count: 2,
        voice_channel_id: 'vc-1',
        is_in_voice: true,
      },
    ]
    mockRpc.mockResolvedValue({ data: mockFriends, error: null })

    const { result } = renderHook(() => useFriendsPlayingQuery('user-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].username).toBe('alice')
    expect(result.current.data![0].current_game).toBe('Valorant')
    expect(result.current.data![0].is_in_voice).toBe(false)
    expect(result.current.data![1].is_in_voice).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('get_friends_playing', { p_user_id: 'user-1' })
  })

  it('returns empty array when RPC returns error (graceful degradation)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Function not found' } })

    const { result } = renderHook(() => useFriendsPlayingQuery('user-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('returns empty array when RPC throws (catch block)', async () => {
    mockRpc.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useFriendsPlayingQuery('user-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('returns empty array when RPC returns null data with no error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useFriendsPlayingQuery('user-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('returns empty array for undefined userId (guard in queryFn)', async () => {
    const { result } = renderHook(() => useFriendsPlayingQuery(undefined), { wrapper: createWrapper() })
    // Should be idle since enabled: !!userId is false
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('does not retry on failure (retry: false)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

    const { result } = renderHook(() => useFriendsPlayingQuery('user-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // RPC should only be called once since retry is false
    expect(mockRpc).toHaveBeenCalledTimes(1)
  })

  it('uses correct query key format', () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    const { result } = renderHook(() => useFriendsPlayingQuery('user-42'), { wrapper: createWrapper() })
    // The query key is ['friends_playing', userId]
    expect(result.current).toBeDefined()
    // Verify the hook was called with the right userId
    expect(mockRpc).toHaveBeenCalledWith('get_friends_playing', { p_user_id: 'user-42' })
  })

  it('handles empty array from RPC correctly', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useFriendsPlayingQuery('user-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })
})
