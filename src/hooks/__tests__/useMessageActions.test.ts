import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockGetSession,
  mockFrom,
  mockChannel,
  mockRemoveChannel,
  mockRpc,
  mockSupabase,
  mockIsSupabaseReady,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockFrom = vi.fn()
  const mockChannel = vi.fn()
  const mockRemoveChannel = vi.fn()
  const mockRpc = vi.fn()
  const mockIsSupabaseReady = vi.fn().mockReturnValue(true)
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
    rpc: mockRpc,
  }
  return {
    mockGetSession,
    mockFrom,
    mockChannel,
    mockRemoveChannel,
    mockRpc,
    mockSupabase,
    mockIsSupabaseReady,
  }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: mockIsSupabaseReady,
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../useRingtone', () => ({
  playNotificationSound: vi.fn(),
}))

vi.mock('../useUnreadCount', () => ({
  useUnreadCountStore: {
    getState: vi.fn().mockReturnValue({
      fetchCounts: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))

import {
  createRealtimeSubscription,
  markMessagesAsRead,
  markMessagesAsReadFallback,
} from '../useMessageActions'
import { playNotificationSound } from '../useRingtone'

describe('useMessageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseReady.mockReturnValue(true)
  })

  describe('createRealtimeSubscription', () => {
    let mockOn: ReturnType<typeof vi.fn>
    let mockSubscribe: ReturnType<typeof vi.fn>
    let mockChannelInstance: any

    beforeEach(() => {
      mockSubscribe = vi.fn().mockReturnValue('channel-instance')
      mockOn = vi.fn()
      mockChannelInstance = {
        on: mockOn,
        subscribe: mockSubscribe,
      }
      mockOn.mockReturnValue(mockChannelInstance)
      mockChannel.mockReturnValue(mockChannelInstance)
    })

    it('creates channel with correct name for squad', () => {
      const setState = vi.fn()
      createRealtimeSubscription('squad-1', undefined, setState)

      expect(mockChannel).toHaveBeenCalledWith('messages:squad:squad-1')
    })

    it('creates channel with session-specific name when sessionId provided', () => {
      const setState = vi.fn()
      createRealtimeSubscription('squad-1', 'session-1', setState)

      expect(mockChannel).toHaveBeenCalledWith('messages:session:session-1')
    })

    it('INSERT handler adds message with sender profile', async () => {
      let insertHandler: (payload: any) => Promise<void>
      mockOn.mockImplementation((_event: string, config: any, callback: any) => {
        if (config.event === 'INSERT') {
          insertHandler = callback
        }
        return mockChannelInstance
      })

      const mockUser = { id: 'current-user' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { username: 'SenderName', avatar_url: 'sender-avatar.png' },
              error: null,
            }),
          }),
        }),
      })

      const setState = vi.fn()
      createRealtimeSubscription('squad-1', undefined, setState)

      await insertHandler!({
        new: {
          id: 'msg-1',
          sender_id: 'other-user',
          content: 'Hello',
          squad_id: 'squad-1',
        },
      })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(setState).toHaveBeenCalledWith(expect.any(Function))
      // Notification should play for messages from other users
      expect(playNotificationSound).toHaveBeenCalled()
    })

    it('INSERT handler removes matching optimistic message', async () => {
      let insertHandler: (payload: any) => Promise<void>
      mockOn.mockImplementation((_event: string, config: any, callback: any) => {
        if (config.event === 'INSERT') {
          insertHandler = callback
        }
        return mockChannelInstance
      })

      const mockUser = { id: 'current-user' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { username: 'Me', avatar_url: null },
              error: null,
            }),
          }),
        }),
      })

      const setState = vi.fn()
      createRealtimeSubscription('squad-1', undefined, setState)

      await insertHandler!({
        new: {
          id: 'msg-real',
          sender_id: 'current-user',
          content: 'My message',
          squad_id: 'squad-1',
        },
      })

      // Verify setState was called with a function
      expect(setState).toHaveBeenCalledWith(expect.any(Function))

      // Execute the setState function to verify filtering logic
      const setStateFn = setState.mock.calls[0][0]
      const existingState = {
        messages: [
          { id: 'opt-1', _optimisticId: 'opt-1', sender_id: 'current-user', content: 'My message' },
          { id: 'msg-other', sender_id: 'other-user', content: 'Other' },
        ],
      }
      const result = setStateFn(existingState)

      // The optimistic message with matching sender_id and content should be removed
      expect(result.messages.some((m: any) => m._optimisticId === 'opt-1')).toBe(false)
      // The real message should be added
      expect(result.messages.some((m: any) => m.id === 'msg-real')).toBe(true)
    })

    it('UPDATE handler updates message content', () => {
      let updateHandler: (payload: any) => void
      mockOn.mockImplementation((_event: string, config: any, callback: any) => {
        if (config.event === 'UPDATE') {
          updateHandler = callback
        }
        return mockChannelInstance
      })

      const setState = vi.fn()
      createRealtimeSubscription('squad-1', undefined, setState)

      updateHandler!({
        new: {
          id: 'msg-1',
          content: 'Updated content',
          edited_at: '2026-01-01T00:00:00Z',
          is_pinned: false,
          read_by: ['user-1'],
        },
      })

      expect(setState).toHaveBeenCalledWith(expect.any(Function))

      // Execute the setState function with an existing message
      const setStateFn = setState.mock.calls[0][0]
      const existingState = {
        messages: [
          {
            id: 'msg-1',
            content: 'Original content',
            edited_at: null,
            is_pinned: false,
            read_by: [],
          },
        ],
      }
      const result = setStateFn(existingState)

      expect(result.messages[0].content).toBe('Updated content')
      expect(result.messages[0].edited_at).toBe('2026-01-01T00:00:00Z')
    })

    it('UPDATE handler skips update when only read_by changed', () => {
      let updateHandler: (payload: any) => void
      mockOn.mockImplementation((_event: string, config: any, callback: any) => {
        if (config.event === 'UPDATE') {
          updateHandler = callback
        }
        return mockChannelInstance
      })

      const setState = vi.fn()
      createRealtimeSubscription('squad-1', undefined, setState)

      updateHandler!({
        new: {
          id: 'msg-1',
          content: 'Same content',
          edited_at: null,
          is_pinned: false,
          read_by: ['user-1'], // Same length as existing
        },
      })

      expect(setState).toHaveBeenCalledWith(expect.any(Function))

      // Execute the setState function - should return original state when nothing visible changed
      const setStateFn = setState.mock.calls[0][0]
      const existingState = {
        messages: [
          {
            id: 'msg-1',
            content: 'Same content',
            edited_at: null,
            is_pinned: false,
            read_by: ['user-1'],
          },
        ],
      }
      const result = setStateFn(existingState)

      // Should return the same state object reference (no update)
      expect(result).toBe(existingState)
    })

    it('DELETE handler removes message by id', () => {
      let deleteHandler: (payload: any) => void
      mockOn.mockImplementation((_event: string, config: any, callback: any) => {
        if (config.event === 'DELETE') {
          deleteHandler = callback
        }
        return mockChannelInstance
      })

      const setState = vi.fn()
      createRealtimeSubscription('squad-1', undefined, setState)

      deleteHandler!({
        old: { id: 'msg-to-delete' },
      })

      expect(setState).toHaveBeenCalledWith(expect.any(Function))

      const setStateFn = setState.mock.calls[0][0]
      const existingState = {
        messages: [
          { id: 'msg-to-delete', content: 'Delete me' },
          { id: 'msg-keep', content: 'Keep me' },
        ],
      }
      const result = setStateFn(existingState)

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].id).toBe('msg-keep')
    })
  })

  describe('markMessagesAsRead', () => {
    it('uses batch_mark_messages_read RPC', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockRpc.mockResolvedValue({ error: null })

      const setConversations = vi.fn()
      await markMessagesAsRead('squad-1', undefined, setConversations)

      expect(mockRpc).toHaveBeenCalledWith('batch_mark_messages_read', {
        p_user_id: 'user-1',
        p_squad_id: 'squad-1',
        p_session_id: null,
      })
      expect(setConversations).toHaveBeenCalledWith(expect.any(Function))
    })

    it('falls back to markMessagesAsReadFallback on RPC error', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockRpc.mockResolvedValue({ error: { message: 'RPC not available' } })

      // Mock for fallback: messages query
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      })

      const setConversations = vi.fn()
      await markMessagesAsRead('squad-1', undefined, setConversations)

      // The fallback should have been called (which also calls setConversations)
      expect(setConversations).toHaveBeenCalled()
    })
  })

  describe('markMessagesAsReadFallback', () => {
    it('updates read_by for unread messages', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [
                      { id: 'msg-1', read_by: [] },
                      { id: 'msg-2', read_by: ['other-user'] },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdate,
          }
        }
        return {}
      })

      const setConversations = vi.fn()
      await markMessagesAsReadFallback('squad-1', undefined, setConversations)

      // Should update each unread message
      expect(mockUpdate).toHaveBeenCalledTimes(2)
      expect(mockUpdate).toHaveBeenCalledWith({ read_by: ['user-1'] })
      expect(mockUpdate).toHaveBeenCalledWith({ read_by: ['other-user', 'user-1'] })
      expect(setConversations).toHaveBeenCalledWith(expect.any(Function))
    })
  })
})
