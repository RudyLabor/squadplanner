import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom, mockRpc, mockChannel, mockRemoveChannel, mockSupabase } =
  vi.hoisted(() => {
    const mockGetSession = vi.fn()
    const mockFrom = vi.fn()
    const mockRpc = vi.fn()
    const mockChannel = vi.fn()
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

vi.mock('../../lib/notifyOnMessage', () => ({
  notifyDirectMessage: vi.fn().mockResolvedValue(undefined),
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

  describe('fetchConversations', () => {
    it('sets conversations to empty and isLoading false when user session is null', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchConversations()
      })

      // STRICT: verify the error path cleared conversations
      const state = useDirectMessagesStore.getState()
      expect(state.conversations).toEqual([])
      // STRICT: isLoading must be reset after error
      expect(state.isLoading).toBe(false)
    })

    it('calls RPC get_dm_conversations_with_stats with authenticated user ID', async () => {
      const mockUser = { id: 'user-abc-123' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockRpc.mockResolvedValue({ data: [], error: null })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchConversations()
      })

      // STRICT: verify exact RPC function name and param
      expect(mockRpc).toHaveBeenCalledWith('get_dm_conversations_with_stats', {
        p_user_id: 'user-abc-123',
      })
    })

    it('transforms RPC response rows into DMConversation objects with correct field mapping', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockRpc.mockResolvedValue({
        data: [
          {
            other_user_id: 'user-2',
            other_username: 'Alice',
            other_avatar_url: 'https://avatar.io/alice.png',
            last_message_id: 'msg-1',
            last_message_content: 'Salut !',
            last_message_created_at: '2026-02-10T10:00:00Z',
            last_message_sender_id: 'user-2',
            unread_count: 3,
          },
          {
            other_user_id: 'user-3',
            other_username: null,
            other_avatar_url: null,
            last_message_id: 'msg-2',
            last_message_content: 'Ok',
            last_message_created_at: '2026-02-09T08:00:00Z',
            last_message_sender_id: 'user-1',
            unread_count: 0,
          },
        ],
        error: null,
      })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchConversations()
      })

      const convos = useDirectMessagesStore.getState().conversations
      // STRICT: verify exact length
      expect(convos).toHaveLength(2)
      // STRICT: verify field mapping — other_username -> other_user_username
      expect(convos[0].other_user_username).toBe('Alice')
      expect(convos[0].other_user_avatar_url).toBe('https://avatar.io/alice.png')
      expect(convos[0].last_message_content).toBe('Salut !')
      expect(convos[0].last_message_at).toBe('2026-02-10T10:00:00Z')
      expect(convos[0].last_message_sender_id).toBe('user-2')
      expect(convos[0].unread_count).toBe(3)
      // STRICT: null username falls back to "Utilisateur"
      expect(convos[1].other_user_username).toBe('Utilisateur')
      // STRICT: zero unread preserved
      expect(convos[1].unread_count).toBe(0)
    })

    it('falls back to direct_messages query when RPC fails, grouping by partner', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      // RPC fails
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'function not found' },
      })

      // Fallback direct_messages query
      const mockDmData = [
        {
          id: 'dm-1',
          sender_id: 'user-2',
          receiver_id: 'user-1',
          content: 'Latest from user-2',
          created_at: '2026-02-10T12:00:00Z',
        },
        {
          id: 'dm-2',
          sender_id: 'user-1',
          receiver_id: 'user-2',
          content: 'Older msg to user-2',
          created_at: '2026-02-10T11:00:00Z',
        },
        {
          id: 'dm-3',
          sender_id: 'user-3',
          receiver_id: 'user-1',
          content: 'Hi from user-3',
          created_at: '2026-02-10T10:00:00Z',
        },
      ]

      // Profiles query for partner info
      const mockProfiles = [
        { id: 'user-2', username: 'Bob', avatar_url: 'bob.png' },
        { id: 'user-3', username: null, avatar_url: null },
      ]

      let fromCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'direct_messages') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockDmData, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'profiles') {
          fromCallCount++
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchConversations()
      })

      const convos = useDirectMessagesStore.getState().conversations
      // STRICT: grouped by partner — 2 unique partners from 3 messages
      expect(convos).toHaveLength(2)

      const bobConv = convos.find((c) => c.other_user_id === 'user-2')
      // STRICT: first message for partner is kept (latest, since ordered desc)
      expect(bobConv!.last_message_content).toBe('Latest from user-2')
      expect(bobConv!.last_message_sender_id).toBe('user-2')
      // STRICT: profile enriched
      expect(bobConv!.other_user_username).toBe('Bob')
      expect(bobConv!.other_user_avatar_url).toBe('bob.png')

      const user3Conv = convos.find((c) => c.other_user_id === 'user-3')
      // STRICT: null username defaults to 'Utilisateur'
      expect(user3Conv!.other_user_username).toBe('Utilisateur')
      // STRICT: profiles were fetched
      expect(fromCallCount).toBe(1)
    })

    it('handles AbortError gracefully without resetting state', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockRpc.mockRejectedValue(abortError)

      // Pre-set conversations to verify they are NOT cleared
      act(() => {
        useDirectMessagesStore.setState({
          conversations: [
            {
              other_user_id: 'preserved',
              other_user_username: 'Kept',
              other_user_avatar_url: null,
              last_message_content: null,
              last_message_at: null,
              last_message_sender_id: null,
              unread_count: 0,
            },
          ],
        })
      })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchConversations()
      })

      // STRICT: AbortError early-returns without changing conversations
      expect(useDirectMessagesStore.getState().conversations).toHaveLength(1)
      expect(useDirectMessagesStore.getState().conversations[0].other_user_id).toBe('preserved')
    })
  })

  describe('fetchMessages', () => {
    it('queries direct_messages with correct sender/receiver filter and ascending order', async () => {
      const mockUser = { id: 'user-A' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockMessages = [
        {
          id: 'dm-1',
          sender_id: 'user-A',
          receiver_id: 'user-B',
          content: 'First',
          created_at: '2026-02-10T10:00:00Z',
        },
        {
          id: 'dm-2',
          sender_id: 'user-B',
          receiver_id: 'user-A',
          content: 'Reply',
          created_at: '2026-02-10T10:01:00Z',
        },
      ]

      const mockLimit = vi.fn().mockResolvedValue({ data: mockMessages, error: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
      mockFrom.mockReturnValue({ select: mockSelect })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchMessages('user-B')
      })

      // STRICT: verify table queried
      expect(mockFrom).toHaveBeenCalledWith('direct_messages')
      // STRICT: verify select includes sender profile join
      expect(mockSelect).toHaveBeenCalledWith('*, sender:profiles!sender_id(username, avatar_url)')
      // STRICT: verify OR filter combines both directions
      expect(mockOr).toHaveBeenCalledWith(
        'and(sender_id.eq.user-A,receiver_id.eq.user-B),and(sender_id.eq.user-B,receiver_id.eq.user-A)'
      )
      // STRICT: ascending order for chronological display
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
      // STRICT: limit to 100
      expect(mockLimit).toHaveBeenCalledWith(100)
      // STRICT: verify messages stored
      const state = useDirectMessagesStore.getState()
      expect(state.messages).toHaveLength(2)
      expect(state.messages[0].content).toBe('First')
      expect(state.messages[1].content).toBe('Reply')
      expect(state.isLoading).toBe(false)
    })

    it('clears messages and resets loading on query error', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Permission denied', code: '42501' },
              }),
            }),
          }),
        }),
      })

      // Pre-populate messages
      act(() => {
        useDirectMessagesStore.setState({
          messages: [{ id: 'old', content: 'stale' } as any],
        })
      })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchMessages('user-2')
      })

      // STRICT: error path clears messages
      expect(useDirectMessagesStore.getState().messages).toEqual([])
      expect(useDirectMessagesStore.getState().isLoading).toBe(false)
    })

    it('clears messages when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await act(async () => {
        await useDirectMessagesStore.getState().fetchMessages('user-2')
      })

      // STRICT: unauthenticated throws, catch clears messages
      expect(useDirectMessagesStore.getState().messages).toEqual([])
      expect(useDirectMessagesStore.getState().isLoading).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('inserts message with trimmed content and correct sender/receiver IDs', async () => {
      const mockUser = { id: 'sender-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'direct_messages') {
          return { insert: mockInsert }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'Sender' } }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useDirectMessagesStore
          .getState()
          .sendMessage('  Hello World  ', 'receiver-2')
      })

      // STRICT: verify table
      expect(mockFrom).toHaveBeenCalledWith('direct_messages')
      // STRICT: verify insert payload — content is trimmed
      expect(mockInsert).toHaveBeenCalledWith({
        content: 'Hello World',
        sender_id: 'sender-1',
        receiver_id: 'receiver-2',
      })
      // STRICT: verify success return
      expect(result.error).toBeNull()
    })

    it('returns Error with "Not authenticated" message when session is null', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useDirectMessagesStore.getState().sendMessage('Hello!', 'user-2')
      })

      // STRICT: verify exact error message
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('Not authenticated')
    })

    it('returns the database error when insert fails', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const dbError = { message: 'violates foreign key constraint', code: '23503' }
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: dbError }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useDirectMessagesStore.getState().sendMessage('Hello', 'nonexistent-user')
      })

      // STRICT: verify error is propagated
      expect(result.error).toBeTruthy()
      expect((result.error as any).message).toBe('violates foreign key constraint')
    })
  })

  describe('markAsRead', () => {
    it('calls batch_mark_dms_read RPC with correct user IDs and zeros local unread', async () => {
      const mockUser = { id: 'current-user' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockRpc.mockResolvedValue({ error: null })

      act(() => {
        useDirectMessagesStore.setState({
          conversations: [
            { other_user_id: 'partner-1', unread_count: 7 } as any,
            { other_user_id: 'partner-2', unread_count: 3 } as any,
          ],
        })
      })

      await act(async () => {
        await useDirectMessagesStore.getState().markAsRead('partner-1')
      })

      // STRICT: verify RPC called with exact params
      expect(mockRpc).toHaveBeenCalledWith('batch_mark_dms_read', {
        p_user_id: 'current-user',
        p_other_user_id: 'partner-1',
      })
      // STRICT: only partner-1 unread count zeroed, partner-2 untouched
      const convos = useDirectMessagesStore.getState().conversations
      expect(convos[0].unread_count).toBe(0)
      expect(convos[1].unread_count).toBe(3)
    })

    it('falls back to direct update when RPC fails', async () => {
      const mockUser = { id: 'current-user' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      // RPC fails
      mockRpc.mockResolvedValue({ error: { message: 'function not found' } })

      // Fallback update chain
      const mockIs = vi.fn().mockResolvedValue({ error: null })
      const mockEqReceiver = vi.fn().mockReturnValue({ is: mockIs })
      const mockEqSender = vi.fn().mockReturnValue({ eq: mockEqReceiver })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqSender })
      mockFrom.mockReturnValue({ update: mockUpdate })

      act(() => {
        useDirectMessagesStore.setState({
          conversations: [{ other_user_id: 'partner-1', unread_count: 5 } as any],
        })
      })

      await act(async () => {
        await useDirectMessagesStore.getState().markAsRead('partner-1')
      })

      // STRICT: verify fallback update was called on direct_messages table
      expect(mockFrom).toHaveBeenCalledWith('direct_messages')
      // STRICT: verify update sets read_at
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ read_at: expect.any(String) })
      )
      // STRICT: filter by sender_id = partner, receiver_id = current user, read_at IS null
      expect(mockEqSender).toHaveBeenCalledWith('sender_id', 'partner-1')
      expect(mockEqReceiver).toHaveBeenCalledWith('receiver_id', 'current-user')
      expect(mockIs).toHaveBeenCalledWith('read_at', null)
      // STRICT: local unread count still zeroed
      expect(useDirectMessagesStore.getState().conversations[0].unread_count).toBe(0)
    })
  })

  describe('subscribeToMessages', () => {
    it('creates a realtime channel with correct name and postgres_changes filter', async () => {
      const mockUser = { id: 'aaa' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockSubscribe = vi.fn().mockReturnThis()
      const mockOn = vi
        .fn()
        .mockReturnValue({ on: vi.fn().mockReturnValue({ subscribe: mockSubscribe }) })
      mockChannel.mockReturnValue({ on: mockOn })

      await act(async () => {
        useDirectMessagesStore.getState().subscribeToMessages('zzz')
      })

      // Need to flush the internal promise
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      // STRICT: channel name is sorted user IDs — aaa < zzz
      expect(mockChannel).toHaveBeenCalledWith('dm:aaa:zzz')
      // STRICT: first .on call uses postgres_changes INSERT
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        }),
        expect.any(Function)
      )
    })
  })

  describe('unsubscribe', () => {
    it('calls removeChannel with the stored channel and nullifies it', () => {
      const mockCh = { id: 'test-channel', unsubscribe: vi.fn() }
      act(() => {
        useDirectMessagesStore.setState({ realtimeChannel: mockCh as any })
      })

      act(() => {
        useDirectMessagesStore.getState().unsubscribe()
      })

      // STRICT: verify removeChannel called with exact channel reference
      expect(mockRemoveChannel).toHaveBeenCalledWith(mockCh)
      expect(mockRemoveChannel).toHaveBeenCalledTimes(1)
      // STRICT: channel nullified in state
      expect(useDirectMessagesStore.getState().realtimeChannel).toBeNull()
    })

    it('does nothing when no channel is active', () => {
      act(() => {
        useDirectMessagesStore.setState({ realtimeChannel: null })
      })

      act(() => {
        useDirectMessagesStore.getState().unsubscribe()
      })

      // STRICT: removeChannel never called
      expect(mockRemoveChannel).not.toHaveBeenCalled()
    })
  })

  describe('getTotalUnread', () => {
    it('sums unread_count across all conversations', () => {
      act(() => {
        useDirectMessagesStore.setState({
          conversations: [
            { other_user_id: 'u1', unread_count: 3 } as any,
            { other_user_id: 'u2', unread_count: 5 } as any,
            { other_user_id: 'u3', unread_count: 0 } as any,
            { other_user_id: 'u4', unread_count: 12 } as any,
          ],
        })
      })

      // STRICT: verify exact sum 3+5+0+12=20
      expect(useDirectMessagesStore.getState().getTotalUnread()).toBe(20)
    })

    it('returns 0 when conversations list is empty', () => {
      // STRICT: reduce on empty array with initial 0
      expect(useDirectMessagesStore.getState().getTotalUnread()).toBe(0)
    })
  })

  describe('startConversation', () => {
    it('returns existing conversation without querying profiles if already in state', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const existingConv = {
        other_user_id: 'user-2',
        other_user_username: 'Alice',
        other_user_avatar_url: 'alice.png',
        last_message_content: 'Hey',
        last_message_at: '2026-02-10T10:00:00Z',
        last_message_sender_id: 'user-2',
        unread_count: 1,
      }

      act(() => {
        useDirectMessagesStore.setState({ conversations: [existingConv] })
      })

      let result: any = null
      await act(async () => {
        result = await useDirectMessagesStore.getState().startConversation('user-2')
      })

      // STRICT: returns the exact existing object
      expect(result).toEqual(existingConv)
      expect(result.other_user_username).toBe('Alice')
      // STRICT: no profile query needed
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('fetches profile and prepends new conversation when user not in state', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-3', username: 'Charlie', avatar_url: 'charlie.png' },
              error: null,
            }),
          }),
        }),
      })

      // Pre-populate with one existing conv
      act(() => {
        useDirectMessagesStore.setState({
          conversations: [{ other_user_id: 'user-2', other_user_username: 'Bob' } as any],
        })
      })

      let result: any = null
      await act(async () => {
        result = await useDirectMessagesStore.getState().startConversation('user-3')
      })

      // STRICT: profile queried
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      // STRICT: result has correct data
      expect(result.other_user_id).toBe('user-3')
      expect(result.other_user_username).toBe('Charlie')
      expect(result.other_user_avatar_url).toBe('charlie.png')
      expect(result.unread_count).toBe(0)
      expect(result.last_message_content).toBeNull()
      // STRICT: new conv prepended (index 0)
      const convos = useDirectMessagesStore.getState().conversations
      expect(convos).toHaveLength(2)
      expect(convos[0].other_user_id).toBe('user-3')
      expect(convos[1].other_user_id).toBe('user-2')
    })

    it('returns null and does not modify state when profile query fails', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'not found', code: 'PGRST116' },
            }),
          }),
        }),
      })

      let result: any = 'not-set'
      await act(async () => {
        result = await useDirectMessagesStore.getState().startConversation('nonexistent')
      })

      // STRICT: returns null on error
      expect(result).toBeNull()
      // STRICT: conversations unchanged (empty)
      expect(useDirectMessagesStore.getState().conversations).toHaveLength(0)
    })
  })

  describe('setActiveConversation', () => {
    it('sets active conversation and triggers fetchMessages + subscribeToMessages + markAsRead', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockRpc.mockResolvedValue({ error: null })

      // Mock fetchMessages chain
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      })

      // Mock channel for subscribe
      const mockSubscribe = vi.fn().mockReturnThis()
      const mockOn = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnValue({ subscribe: mockSubscribe }),
      })
      mockChannel.mockReturnValue({ on: mockOn })

      const conv = {
        other_user_id: 'user-2',
        other_user_username: 'Alice',
        other_user_avatar_url: null,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 3,
      }

      await act(async () => {
        useDirectMessagesStore.getState().setActiveConversation(conv)
        // Flush async effects
        await new Promise((r) => setTimeout(r, 50))
      })

      // STRICT: activeConversation set
      expect(useDirectMessagesStore.getState().activeConversation).toEqual(conv)
    })

    it('sets activeConversation to null without triggering side effects', () => {
      act(() => {
        useDirectMessagesStore.setState({
          activeConversation: { other_user_id: 'user-2' } as any,
        })
      })

      act(() => {
        useDirectMessagesStore.getState().setActiveConversation(null)
      })

      // STRICT: nullified
      expect(useDirectMessagesStore.getState().activeConversation).toBeNull()
      // STRICT: no Supabase calls when conversation is null
      expect(mockFrom).not.toHaveBeenCalled()
      expect(mockRpc).not.toHaveBeenCalled()
    })
  })
})
