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

vi.mock('../useUnreadCount', () => ({
  useUnreadCountStore: {
    getState: vi.fn().mockReturnValue({
      fetchCounts: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))

vi.mock('../useRingtone', () => ({
  playNotificationSound: vi.fn(),
}))

vi.mock('../../lib/notifyOnMessage', () => ({
  notifyDirectMessage: vi.fn().mockResolvedValue(undefined),
}))

import { createDMActions } from '../useDMActions'

describe('createDMActions', () => {
  let mockSet: ReturnType<typeof vi.fn>
  let mockGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSet = vi.fn()
    mockGet = vi.fn()
    mockIsSupabaseReady.mockReturnValue(true)
  })

  describe('sendMessage', () => {
    it('successful send with authenticated user', async () => {
      const mockUser = { id: 'user-1' }
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
                single: vi.fn().mockResolvedValue({ data: { username: 'User1' } }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const actions = createDMActions(mockSet, mockGet)
      const result = await actions.sendMessage('Hello!', 'receiver-1')

      expect(result).toEqual({ error: null })
      expect(mockFrom).toHaveBeenCalledWith('direct_messages')
      expect(mockInsert).toHaveBeenCalledWith({
        content: 'Hello!',
        sender_id: 'user-1',
        receiver_id: 'receiver-1',
      })
    })

    it('returns error when supabase not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)

      const actions = createDMActions(mockSet, mockGet)
      const result = await actions.sendMessage('Hello!', 'receiver-1')

      expect(result).toEqual({ error: expect.any(Error) })
      expect((result as any).error.message).toBe('Supabase not ready')
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      const actions = createDMActions(mockSet, mockGet)
      const result = await actions.sendMessage('Hello!', 'receiver-1')

      expect(result).toEqual({ error: expect.any(Error) })
      expect((result as any).error.message).toBe('Not authenticated')
    })

    it('returns error on supabase insert failure', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      const insertError = { message: 'Insert failed', code: '42000' }
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: insertError }),
      })

      const actions = createDMActions(mockSet, mockGet)
      const result = await actions.sendMessage('Hello!', 'receiver-1')

      expect(result.error).toBeTruthy()
    })
  })

  describe('setActiveConversation', () => {
    it('sets conversation and triggers fetch/subscribe/markAsRead', () => {
      const mockFetchMessages = vi.fn()
      const mockSubscribeToMessages = vi.fn()
      const mockMarkAsRead = vi.fn()
      mockGet.mockReturnValue({
        fetchMessages: mockFetchMessages,
        subscribeToMessages: mockSubscribeToMessages,
        markAsRead: mockMarkAsRead,
      })

      const conversation = {
        other_user_id: 'other-1',
        other_user_username: 'OtherUser',
        other_user_avatar_url: null,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 0,
      }

      const actions = createDMActions(mockSet, mockGet)
      actions.setActiveConversation(conversation)

      expect(mockSet).toHaveBeenCalledWith({ activeConversation: conversation })
      expect(mockFetchMessages).toHaveBeenCalledWith('other-1')
      expect(mockSubscribeToMessages).toHaveBeenCalledWith('other-1')
      expect(mockMarkAsRead).toHaveBeenCalledWith('other-1')
    })

    it('with null clears active conversation', () => {
      const actions = createDMActions(mockSet, mockGet)
      actions.setActiveConversation(null)

      expect(mockSet).toHaveBeenCalledWith({ activeConversation: null })
      // get() should not be called for any further actions
      expect(mockGet).not.toHaveBeenCalled()
    })
  })

  describe('subscribeToMessages', () => {
    it('unsubscribes from existing channel first', () => {
      const existingChannel = { id: 'existing-channel' }
      const mockUnsubscribe = vi.fn()
      mockGet.mockReturnValue({
        realtimeChannel: existingChannel,
        unsubscribe: mockUnsubscribe,
      })

      // Make getSession async to allow subscription flow
      mockGetSession.mockResolvedValue({ data: { session: null } })

      const actions = createDMActions(mockSet, mockGet)
      actions.subscribeToMessages('other-1')

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('does nothing when supabase not ready', () => {
      mockIsSupabaseReady.mockReturnValue(false)

      const actions = createDMActions(mockSet, mockGet)
      actions.subscribeToMessages('other-1')

      expect(mockGet).not.toHaveBeenCalled()
    })
  })

  describe('markAsRead', () => {
    it('uses batch_mark_dms_read RPC', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockRpc.mockResolvedValue({ error: null })

      const actions = createDMActions(mockSet, mockGet)
      await actions.markAsRead('other-1')

      expect(mockRpc).toHaveBeenCalledWith('batch_mark_dms_read', {
        p_user_id: 'user-1',
        p_other_user_id: 'other-1',
      })
    })

    it('falls back to direct update when RPC fails', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockRpc.mockResolvedValue({ error: { message: 'RPC not found' } })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })
      mockFrom.mockReturnValue({ update: mockUpdate })

      const actions = createDMActions(mockSet, mockGet)
      await actions.markAsRead('other-1')

      expect(mockFrom).toHaveBeenCalledWith('direct_messages')
      expect(mockUpdate).toHaveBeenCalledWith({ read_at: expect.any(String) })
    })
  })

  describe('startConversation', () => {
    it('returns existing conversation if found', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const existingConv = {
        other_user_id: 'target-1',
        other_user_username: 'TargetUser',
        other_user_avatar_url: null,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 0,
      }

      mockGet.mockReturnValue({
        conversations: [existingConv],
      })

      const actions = createDMActions(mockSet, mockGet)
      const result = await actions.startConversation('target-1')

      expect(result).toEqual(existingConv)
      // Should not call profiles since existing conversation was found
      expect(mockFrom).not.toHaveBeenCalledWith('profiles')
    })
  })

  describe('getTotalUnread', () => {
    it('sums up unread_count from all conversations', () => {
      mockGet.mockReturnValue({
        conversations: [
          { other_user_id: 'a', unread_count: 3 },
          { other_user_id: 'b', unread_count: 5 },
          { other_user_id: 'c', unread_count: 0 },
        ],
      })

      const actions = createDMActions(mockSet, mockGet)
      const total = actions.getTotalUnread()

      expect(total).toBe(8)
    })
  })
})
