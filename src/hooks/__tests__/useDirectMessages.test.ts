import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom, mockRpc, mockChannel, mockRemoveChannel, mockSupabase } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockChannel = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    send: vi.fn(),
    unsubscribe: vi.fn(),
  })
  const mockRemoveChannel = vi.fn()
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    rpc: mockRpc,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }
  return { mockGetSession, mockFrom, mockRpc, mockChannel, mockRemoveChannel, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../useRingtone', () => ({
  playNotificationSound: vi.fn(),
}))

vi.mock('../useUnreadCount', () => ({
  useUnreadCountStore: {
    getState: () => ({ fetchCounts: vi.fn().mockResolvedValue(undefined) }),
  },
}))

import { useDirectMessagesStore } from '../useDirectMessages'

describe('useDirectMessagesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useDirectMessagesStore.setState({
        messages: [],
        conversations: [],
        activeConversation: null,
        isLoading: false,
        realtimeChannel: null,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useDirectMessagesStore.getState()
    expect(state.messages).toEqual([])
    expect(state.conversations).toEqual([])
    expect(state.activeConversation).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.realtimeChannel).toBeNull()
  })

  describe('fetchConversations', () => {
    it('returns empty when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchConversations()
      })

      expect(useDirectMessagesStore.getState().conversations).toEqual([])
    })

    it('fetches conversations via RPC', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockRpc.mockResolvedValue({
        data: [
          {
            other_user_id: 'user-2',
            other_username: 'Alice',
            other_avatar_url: null,
            last_message_id: 'msg-1',
            last_message_content: 'Hello',
            last_message_created_at: '2026-02-10T10:00:00Z',
            last_message_sender_id: 'user-2',
            unread_count: 1,
          },
        ],
        error: null,
      })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchConversations()
      })

      const convos = useDirectMessagesStore.getState().conversations
      expect(convos).toHaveLength(1)
      expect(convos[0].other_user_username).toBe('Alice')
      expect(convos[0].unread_count).toBe(1)
    })
  })

  describe('fetchMessages', () => {
    it('fetches messages between two users', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockMessages = [
        {
          id: 'dm-1',
          sender_id: 'user-1',
          receiver_id: 'user-2',
          content: 'Hi',
          created_at: '2026-02-10T10:00:00Z',
        },
        {
          id: 'dm-2',
          sender_id: 'user-2',
          receiver_id: 'user-1',
          content: 'Hey',
          created_at: '2026-02-10T10:01:00Z',
        },
      ]

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchMessages('user-2')
      })

      expect(useDirectMessagesStore.getState().messages).toEqual(mockMessages)
      expect(useDirectMessagesStore.getState().isLoading).toBe(false)
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchMessages('user-2')
      })

      expect(useDirectMessagesStore.getState().messages).toEqual([])
    })
  })

  describe('sendMessage', () => {
    it('sends a direct message', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useDirectMessagesStore.getState().sendMessage('Hello!', 'user-2')
      })

      expect(result.error).toBeNull()
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useDirectMessagesStore.getState().sendMessage('Hello!', 'user-2')
      })

      expect(result.error?.message).toBe('Not authenticated')
    })
  })

  describe('unsubscribe', () => {
    it('removes realtime channel', () => {
      const mockCh = { id: 'test-channel' }
      act(() => {
        useDirectMessagesStore.setState({ realtimeChannel: mockCh as any })
      })

      act(() => {
        useDirectMessagesStore.getState().unsubscribe()
      })

      expect(mockRemoveChannel).toHaveBeenCalledWith(mockCh)
      expect(useDirectMessagesStore.getState().realtimeChannel).toBeNull()
    })
  })

  describe('getTotalUnread', () => {
    it('returns sum of unread counts', () => {
      act(() => {
        useDirectMessagesStore.setState({
          conversations: [
            { other_user_id: 'u1', unread_count: 3 } as any,
            { other_user_id: 'u2', unread_count: 5 } as any,
            { other_user_id: 'u3', unread_count: 0 } as any,
          ],
        })
      })

      expect(useDirectMessagesStore.getState().getTotalUnread()).toBe(8)
    })

    it('returns 0 when no conversations', () => {
      expect(useDirectMessagesStore.getState().getTotalUnread()).toBe(0)
    })
  })

  describe('startConversation', () => {
    it('returns existing conversation if found', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const existingConv = {
        other_user_id: 'user-2',
        other_user_username: 'Alice',
        other_user_avatar_url: null,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 0,
      }

      act(() => {
        useDirectMessagesStore.setState({ conversations: [existingConv] })
      })

      let result: any = null
      await act(async () => {
        result = await useDirectMessagesStore.getState().startConversation('user-2')
      })

      expect(result).toEqual(existingConv)
    })

    it('creates new conversation for unknown user', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-3', username: 'Bob', avatar_url: null },
              error: null,
            }),
          }),
        }),
      })

      let result: any = null
      await act(async () => {
        result = await useDirectMessagesStore.getState().startConversation('user-3')
      })

      expect(result).toBeTruthy()
      expect(result.other_user_id).toBe('user-3')
      expect(result.other_user_username).toBe('Bob')
    })
  })

  describe('markAsRead', () => {
    it('updates local unread count', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockRpc.mockResolvedValue({ error: null })

      act(() => {
        useDirectMessagesStore.setState({
          conversations: [{ other_user_id: 'user-2', unread_count: 5 } as any],
        })
      })

      await act(async () => {
        await useDirectMessagesStore.getState().markAsRead('user-2')
      })

      expect(useDirectMessagesStore.getState().conversations[0].unread_count).toBe(0)
    })
  })
})
