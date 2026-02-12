import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom, mockRpc, mockChannel, mockRemoveChannel } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockChannel: vi.fn(),
  mockRemoveChannel: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    rpc: mockRpc,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}))

vi.mock('../useRingtone', () => ({
  playNotificationSound: vi.fn(),
}))

vi.mock('../useUnreadCount', () => ({
  useUnreadCountStore: {
    getState: () => ({ fetchCounts: vi.fn().mockResolvedValue(undefined) }),
  },
}))

vi.mock('../../lib/toast', () => ({
  showError: vi.fn(),
}))

vi.mock('../../utils/optimisticUpdate', () => ({
  optimisticId: () => 'optimistic-123',
}))

import { useMessagesStore } from '../useMessages'

describe('useMessagesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useMessagesStore.setState({
        messages: [],
        conversations: [],
        activeConversation: null,
        isLoading: false,
        realtimeChannel: null,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useMessagesStore.getState()
    expect(state.messages).toEqual([])
    expect(state.conversations).toEqual([])
    expect(state.activeConversation).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.realtimeChannel).toBeNull()
  })

  describe('fetchMessages', () => {
    it('fetches messages for a squad', async () => {
      const mockMessages = [
        { id: '1', content: 'Hello', squad_id: 'squad-1', sender: { username: 'user1' } },
        { id: '2', content: 'World', squad_id: 'squad-1', sender: { username: 'user2' } },
      ]

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1')
      })

      const state = useMessagesStore.getState()
      expect(state.messages).toEqual(mockMessages)
      expect(state.isLoading).toBe(false)
    })

    it('fetches messages for a session', async () => {
      const mockMessages = [
        { id: '1', content: 'Session msg', squad_id: 'squad-1', session_id: 'session-1' },
      ]

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1', 'session-1')
      })

      expect(useMessagesStore.getState().messages).toEqual(mockMessages)
    })

    it('handles fetch error gracefully', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1')
      })

      expect(useMessagesStore.getState().isLoading).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().sendMessage('Hello', 'squad-1')
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Not authenticated')
    })

    it('adds optimistic message and sends', async () => {
      const mockUser = { id: 'user-1' }
      const mockSession = { user: mockUser }

      mockGetSession.mockResolvedValue({ data: { session: mockSession } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { username: 'testuser', avatar_url: null } }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().sendMessage('Hello world', 'squad-1')
      })

      expect(result.error).toBeNull()
    })
  })

  describe('dismissFailedMessage', () => {
    it('removes failed message from state', () => {
      act(() => {
        useMessagesStore.setState({
          messages: [
            { id: '1', content: 'Ok', _optimisticId: undefined } as any,
            { id: '2', content: 'Failed', _optimisticId: 'opt-1', _sendFailed: true } as any,
          ],
        })
      })

      act(() => {
        useMessagesStore.getState().dismissFailedMessage('opt-1')
      })

      expect(useMessagesStore.getState().messages).toHaveLength(1)
      expect(useMessagesStore.getState().messages[0].id).toBe('1')
    })
  })

  describe('setActiveConversation', () => {
    it('sets active conversation to null', () => {
      act(() => {
        useMessagesStore.getState().setActiveConversation(null)
      })

      expect(useMessagesStore.getState().activeConversation).toBeNull()
    })
  })

  describe('unsubscribe', () => {
    it('removes realtime channel', () => {
      const mockCh = { id: 'test-channel' }
      act(() => {
        useMessagesStore.setState({ realtimeChannel: mockCh as any })
      })

      act(() => {
        useMessagesStore.getState().unsubscribe()
      })

      expect(mockRemoveChannel).toHaveBeenCalledWith(mockCh)
      expect(useMessagesStore.getState().realtimeChannel).toBeNull()
    })

    it('does nothing when no channel exists', () => {
      act(() => {
        useMessagesStore.setState({ realtimeChannel: null })
      })

      act(() => {
        useMessagesStore.getState().unsubscribe()
      })

      expect(mockRemoveChannel).not.toHaveBeenCalled()
    })
  })

  describe('editMessage', () => {
    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().editMessage('msg-1', 'new content')
      })

      expect(result.error?.message).toBe('Not authenticated')
    })
  })

  describe('deleteMessage', () => {
    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().deleteMessage('msg-1')
      })

      expect(result.error?.message).toBe('Not authenticated')
    })
  })

  describe('pinMessage', () => {
    it('pins a message and updates local state', async () => {
      act(() => {
        useMessagesStore.setState({
          messages: [{ id: 'msg-1', content: 'test', is_pinned: false } as any],
        })
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().pinMessage('msg-1', true)
      })

      expect(result.error).toBeNull()
      expect(useMessagesStore.getState().messages[0].is_pinned).toBe(true)
    })
  })
})
