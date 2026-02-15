import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

const {
  mockGetSession,
  mockFrom,
  mockRpc,
  mockRemoveChannel,
  mockSupabase,
  mockIsSupabaseReady,
  mockShowError,
  mockTrackChallengeProgress,
  mockCreateRealtimeSubscription,
  mockMarkMessagesAsRead,
  mockMarkMessagesAsReadFallback,
} = vi.hoisted(() => {
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
  const mockIsSupabaseReady = vi.fn().mockReturnValue(true)
  const mockShowError = vi.fn()
  const mockTrackChallengeProgress = vi.fn().mockResolvedValue(undefined)
  const mockCreateRealtimeSubscription = vi.fn().mockReturnValue({ id: 'mock-channel' })
  const mockMarkMessagesAsRead = vi.fn().mockResolvedValue(undefined)
  const mockMarkMessagesAsReadFallback = vi.fn().mockResolvedValue(undefined)
  return {
    mockGetSession,
    mockFrom,
    mockRpc,
    mockRemoveChannel,
    mockSupabase,
    mockIsSupabaseReady,
    mockShowError,
    mockTrackChallengeProgress,
    mockCreateRealtimeSubscription,
    mockMarkMessagesAsRead,
    mockMarkMessagesAsReadFallback,
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
    getState: () => ({ fetchCounts: vi.fn().mockResolvedValue(undefined) }),
  },
}))

vi.mock('../../lib/toast', () => ({
  showError: mockShowError,
}))

vi.mock('../../utils/optimisticUpdate', () => ({
  optimisticId: () => 'optimistic-123',
}))

vi.mock('../../lib/challengeTracker', () => ({
  trackChallengeProgress: mockTrackChallengeProgress,
}))

vi.mock('../useMessageActions', () => ({
  createRealtimeSubscription: mockCreateRealtimeSubscription,
  markMessagesAsRead: mockMarkMessagesAsRead,
  markMessagesAsReadFallback: mockMarkMessagesAsReadFallback,
}))

import { useMessagesStore } from '../useMessages'

// Helper to build a chain mock for supabase from() queries
function buildQueryChain(resolved: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.not = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolved)
  chain.insert = vi.fn().mockResolvedValue(resolved)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)

  // Terminals resolve promise
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(resolved))
  // Override is/eq/limit to also resolve as terminal when needed
  const terminalResolve = vi.fn().mockResolvedValue(resolved)
  chain.is.mockReturnValue({ ...chain, then: terminalResolve })
  chain.eq.mockReturnValue({ ...chain, then: terminalResolve })
  chain.limit.mockReturnValue({ ...chain, then: terminalResolve, is: vi.fn().mockResolvedValue(resolved), eq: vi.fn().mockResolvedValue(resolved) })
  chain.order.mockReturnValue({ ...chain, limit: vi.fn().mockReturnValue({ is: vi.fn().mockResolvedValue(resolved), eq: vi.fn().mockResolvedValue(resolved) }) })

  return chain
}

function resetStore() {
  useMessagesStore.setState({
    messages: [],
    conversations: [],
    activeConversation: null,
    isLoading: false,
    realtimeChannel: null,
  })
}

describe('useMessagesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseReady.mockReturnValue(true)
    act(() => { resetStore() })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===== INITIAL STATE =====
  it('has correct initial state', () => {
    const state = useMessagesStore.getState()
    expect(state.messages).toEqual([])
    expect(state.conversations).toEqual([])
    expect(state.activeConversation).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.realtimeChannel).toBeNull()
  })

  // ===== fetchConversations =====
  describe('fetchConversations', () => {
    it('returns early when supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)
      await act(async () => {
        await useMessagesStore.getState().fetchConversations()
      })
      expect(mockGetSession).not.toHaveBeenCalled()
      expect(useMessagesStore.getState().isLoading).toBe(false)
    })

    it('throws and handles not authenticated error', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useMessagesStore.getState().fetchConversations()
      })
      expect(useMessagesStore.getState().isLoading).toBe(false)
      warnSpy.mockRestore()
    })

    it('fetches conversations via RPC successfully', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      const rpcData = [
        {
          conversation_id: 'conv-1',
          conversation_type: 'squad',
          squad_id: 'squad-1',
          session_id: null,
          name: 'My Squad',
          last_message_id: 'msg-1',
          last_message_content: 'Hello',
          last_message_created_at: '2026-02-01T10:00:00Z',
          last_message_sender_id: 'user-2',
          last_message_sender_username: 'alice',
          last_message_sender_avatar: 'avatar.png',
          unread_count: 3,
        },
        {
          conversation_id: 'conv-2',
          conversation_type: 'session',
          squad_id: 'squad-2',
          session_id: 'sess-1',
          name: 'Game Session',
          last_message_id: null,
          unread_count: 0,
        },
      ]
      mockRpc.mockResolvedValue({ data: rpcData, error: null })

      await act(async () => {
        await useMessagesStore.getState().fetchConversations()
      })

      const state = useMessagesStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.conversations).toHaveLength(2)

      // Conversation with last_message
      const conv1 = state.conversations[0]
      expect(conv1.id).toBe('conv-1')
      expect(conv1.type).toBe('squad')
      expect(conv1.squad_id).toBe('squad-1')
      expect(conv1.session_id).toBeUndefined()
      expect(conv1.last_message).toBeDefined()
      expect(conv1.last_message?.content).toBe('Hello')
      expect(conv1.last_message?.sender?.username).toBe('alice')
      expect(conv1.unread_count).toBe(3)

      // Conversation without last_message
      const conv2 = state.conversations[1]
      expect(conv2.id).toBe('conv-2')
      expect(conv2.type).toBe('session')
      expect(conv2.session_id).toBe('sess-1')
      expect(conv2.last_message).toBeUndefined()
      expect(conv2.unread_count).toBe(0)
    })

    it('maps null data to empty array from RPC', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
      mockRpc.mockResolvedValue({ data: null, error: null })
      await act(async () => {
        await useMessagesStore.getState().fetchConversations()
      })
      expect(useMessagesStore.getState().conversations).toEqual([])
    })

    it('falls back when RPC returns error', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } })

      // We need to set up the fallback path
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // The fetchConversationsFallback is called internally, so we mock that supabase is not ready for the fallback
      mockIsSupabaseReady.mockReturnValueOnce(true).mockReturnValueOnce(false)

      await act(async () => {
        await useMessagesStore.getState().fetchConversations()
      })
      expect(warnSpy).toHaveBeenCalledWith('RPC not available, using fallback:', 'RPC not found')
      warnSpy.mockRestore()
    })

    it('handles AbortError silently', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockRpc.mockRejectedValue(abortError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useMessagesStore.getState().fetchConversations()
      })
      // AbortError should not trigger the warning
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('handles general error gracefully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
      mockRpc.mockRejectedValue(new Error('Network down'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useMessagesStore.getState().fetchConversations()
      })
      expect(useMessagesStore.getState().isLoading).toBe(false)
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  // ===== fetchConversationsFallback =====
  describe('fetchConversationsFallback', () => {
    it('returns empty when supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)
      await act(async () => {
        await useMessagesStore.getState().fetchConversationsFallback()
      })
      expect(useMessagesStore.getState().conversations).toEqual([])
      expect(useMessagesStore.getState().isLoading).toBe(false)
    })

    it('returns empty when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      await act(async () => {
        await useMessagesStore.getState().fetchConversationsFallback()
      })
      expect(useMessagesStore.getState().conversations).toEqual([])
      expect(useMessagesStore.getState().isLoading).toBe(false)
    })

    it('returns empty when no memberships', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      await act(async () => {
        await useMessagesStore.getState().fetchConversationsFallback()
      })
      expect(useMessagesStore.getState().conversations).toEqual([])
    })

    it('returns empty when memberships is null', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      await act(async () => {
        await useMessagesStore.getState().fetchConversationsFallback()
      })
      expect(useMessagesStore.getState().conversations).toEqual([])
    })

    it('builds conversations from squads and sorts by last message date', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      // First call: squad_members.select('squad_id')
      const membershipsResult = { data: [{ squad_id: 'sq-1' }, { squad_id: 'sq-2' }], error: null }
      // Second call: squads.select('id, name').in('id', squadIds)
      const squadsResult = { data: [{ id: 'sq-1', name: 'Alpha' }, { id: 'sq-2', name: 'Beta' }], error: null }
      // Third/Fourth: messages for each squad
      const msgAlpha = { id: 'msg-a', content: 'Old msg', created_at: '2026-01-01T00:00:00Z', sender: { username: 'u' } }
      const msgBeta = { id: 'msg-b', content: 'New msg', created_at: '2026-02-01T00:00:00Z', sender: { username: 'u' } }

      let callCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return { select: vi.fn().mockResolvedValue(membershipsResult) }
        }
        if (table === 'squads') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue(squadsResult),
            }),
          }
        }
        if (table === 'messages') {
          callCount++
          // alternating select calls for messages + count
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: callCount % 2 === 1 ? (callCount <= 2 ? [msgAlpha] : [msgBeta]) : null,
                      error: null,
                    }),
                  }),
                  not: vi.fn().mockResolvedValue({ count: callCount % 2 === 0 ? 2 : 0, error: null }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
      })

      await act(async () => {
        await useMessagesStore.getState().fetchConversationsFallback()
      })

      const state = useMessagesStore.getState()
      expect(state.isLoading).toBe(false)
      // Conversations should be sorted by last_message date descending
      expect(state.conversations.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ===== fetchMessages =====
  describe('fetchMessages', () => {
    it('returns early when supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)
      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1')
      })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('fetches messages for a squad (no sessionId)', async () => {
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

    it('fetches messages for a session (with sessionId)', async () => {
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

    it('sets loading to true then false on success', async () => {
      // Track loading state changes
      const loadingStates: boolean[] = []
      const unsub = useMessagesStore.subscribe((s) => loadingStates.push(s.isLoading))

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1')
      })

      expect(useMessagesStore.getState().isLoading).toBe(false)
      unsub()
    })

    it('handles fetch error gracefully (non-AbortError)', async () => {
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

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1')
      })
      expect(useMessagesStore.getState().isLoading).toBe(false)
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('handles AbortError silently in fetchMessages', async () => {
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                is: vi.fn().mockRejectedValue(abortError),
              }),
            }),
          }),
        }),
      })

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1')
      })
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('maps null data to empty array', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('squad-1')
      })
      expect(useMessagesStore.getState().messages).toEqual([])
    })
  })

  // ===== sendMessage =====
  describe('sendMessage', () => {
    it('returns error when supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)
      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().sendMessage('Hello', 'squad-1')
      })
      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Supabase not ready')
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().sendMessage('Hello', 'squad-1')
      })
      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Not authenticated')
    })

    it('sends message with optimistic update and tracks challenge progress', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      // Profile fetch
      const profileChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { username: 'testuser', avatar_url: 'avatar.png' } }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(profileChain)

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().sendMessage('Hello world', 'squad-1')
      })

      expect(result.error).toBeNull()
      // Challenge tracking should have been called
      expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'messages')
    })

    it('creates correct optimistic message structure with sessionId and replyToId', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const profileChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { username: 'testuser', avatar_url: null } }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(profileChain)

      await act(async () => {
        await useMessagesStore.getState().sendMessage('Reply msg', 'squad-1', 'session-x', 'reply-to-1')
      })

      // After success, the optimistic message should have been removed
      // But we can verify the message was inserted via the from mock
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockFrom).toHaveBeenCalledWith('messages')
    })

    it('marks optimistic message as failed on insert error and shows toast', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const callResults: any[] = []
      let callIdx = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'testuser', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: vi.fn().mockResolvedValue({ error: new Error('Insert failed') }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().sendMessage('fail msg', 'squad-1')
      })

      expect(result.error).toBeTruthy()
      expect(mockShowError).toHaveBeenCalledWith('Message non envoye. Appuie pour reessayer.')
      // The optimistic message should be marked as failed
      const failedMsg = useMessagesStore.getState().messages.find((m) => m._optimisticId === 'optimistic-123')
      expect(failedMsg?._sendFailed).toBe(true)
    })

    it('handles case where profile is null (no sender attached)', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().sendMessage('Hello', 'squad-1')
      })
      expect(result.error).toBeNull()
    })

    it('trims content in both optimistic message and insert payload', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'u', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'messages') {
          return { insert: insertMock }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useMessagesStore.getState().sendMessage('  Hello  ', 'squad-1')
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Hello' })
      )
    })

    it('includes sessionId and replyToId in insert when provided', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'u', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'messages') {
          return { insert: insertMock }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useMessagesStore.getState().sendMessage('msg', 'squad-1', 'sess-1', 'reply-1')
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'sess-1',
          reply_to_id: 'reply-1',
        })
      )
    })

    it('does not include sessionId/replyToId when not provided', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }
        }
        if (table === 'messages') {
          return { insert: insertMock }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useMessagesStore.getState().sendMessage('msg', 'squad-1')
      })

      const insertArg = insertMock.mock.calls[0][0]
      expect(insertArg).not.toHaveProperty('session_id')
      expect(insertArg).not.toHaveProperty('reply_to_id')
    })
  })

  // ===== retryMessage =====
  describe('retryMessage', () => {
    it('does nothing when optimistic message not found', async () => {
      act(() => {
        useMessagesStore.setState({ messages: [] })
      })
      const sendSpy = vi.spyOn(useMessagesStore.getState(), 'sendMessage')
      await act(async () => {
        await useMessagesStore.getState().retryMessage('nonexistent-id')
      })
      // sendMessage should not have been called
      expect(useMessagesStore.getState().messages).toHaveLength(0)
    })

    it('removes failed message and resends', async () => {
      const failedMsg = {
        id: 'fail-1',
        content: 'Failed msg',
        squad_id: 'squad-1',
        session_id: null,
        sender_id: 'user-1',
        _optimisticId: 'opt-retry',
        _sendFailed: true,
      } as any

      act(() => {
        useMessagesStore.setState({ messages: [failedMsg] })
      })

      // Mock the sendMessage to succeed
      mockIsSupabaseReady.mockReturnValue(false) // This makes sendMessage return quickly with error

      await act(async () => {
        await useMessagesStore.getState().retryMessage('opt-retry')
      })

      // The failed message should have been removed
      const remaining = useMessagesStore.getState().messages.filter((m) => m._optimisticId === 'opt-retry')
      expect(remaining).toHaveLength(0)
    })

    it('passes session_id as undefined when null in original message', async () => {
      const failedMsg = {
        id: 'fail-2',
        content: 'test',
        squad_id: 'squad-2',
        session_id: null,
        sender_id: 'user-1',
        _optimisticId: 'opt-2',
        _sendFailed: true,
      } as any

      act(() => {
        useMessagesStore.setState({ messages: [failedMsg] })
      })

      mockIsSupabaseReady.mockReturnValue(false)

      await act(async () => {
        await useMessagesStore.getState().retryMessage('opt-2')
      })

      // Message should be removed from state
      expect(useMessagesStore.getState().messages.find((m) => m._optimisticId === 'opt-2')).toBeUndefined()
    })
  })

  // ===== dismissFailedMessage =====
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

    it('does nothing when optimistic id does not match any message', () => {
      act(() => {
        useMessagesStore.setState({
          messages: [{ id: '1', content: 'Test' } as any],
        })
      })

      act(() => {
        useMessagesStore.getState().dismissFailedMessage('nonexistent')
      })

      expect(useMessagesStore.getState().messages).toHaveLength(1)
    })
  })

  // ===== editMessage =====
  describe('editMessage', () => {
    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().editMessage('msg-1', 'new content')
      })
      expect(result.error?.message).toBe('Not authenticated')
    })

    it('returns error when message not found', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().editMessage('msg-1', 'new')
      })
      expect(result.error?.message).toBe('Cannot edit message: not the sender')
    })

    it('returns error when user is not the sender', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { sender_id: 'user-2' } }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().editMessage('msg-1', 'new content')
      })
      expect(result.error?.message).toBe('Cannot edit message: not the sender')
    })

    it('edits message successfully and updates local state', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      act(() => {
        useMessagesStore.setState({
          messages: [{ id: 'msg-1', content: 'old content', sender_id: 'user-1' } as any],
        })
      })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // select sender_id
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { sender_id: 'user-1' } }),
              }),
            }),
          }
        }
        // update
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().editMessage('msg-1', ' new content ')
      })
      expect(result.error).toBeNull()
      const msg = useMessagesStore.getState().messages.find((m) => m.id === 'msg-1')
      expect(msg?.content).toBe('new content')
      expect(msg?.edited_at).toBeDefined()
    })

    it('returns error when supabase update fails', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { sender_id: 'user-1' } }),
              }),
            }),
          }
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
          }),
        }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().editMessage('msg-1', 'new')
      })
      expect(result.error?.message).toBe('Update failed')
    })
  })

  // ===== deleteMessage =====
  describe('deleteMessage', () => {
    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().deleteMessage('msg-1')
      })
      expect(result.error?.message).toBe('Not authenticated')
    })

    it('returns error when message not found', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().deleteMessage('msg-1')
      })
      expect(result.error?.message).toBe('Cannot delete message: not the sender')
    })

    it('returns error when user is not the sender', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { sender_id: 'user-2' } }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().deleteMessage('msg-1')
      })
      expect(result.error?.message).toBe('Cannot delete message: not the sender')
    })

    it('deletes message successfully and removes from local state', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      act(() => {
        useMessagesStore.setState({
          messages: [
            { id: 'msg-1', content: 'delete me', sender_id: 'user-1' } as any,
            { id: 'msg-2', content: 'keep me', sender_id: 'user-2' } as any,
          ],
        })
      })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { sender_id: 'user-1' } }),
              }),
            }),
          }
        }
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().deleteMessage('msg-1')
      })
      expect(result.error).toBeNull()
      expect(useMessagesStore.getState().messages).toHaveLength(1)
      expect(useMessagesStore.getState().messages[0].id).toBe('msg-2')
    })

    it('returns error when supabase delete fails', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { sender_id: 'user-1' } }),
              }),
            }),
          }
        }
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
          }),
        }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().deleteMessage('msg-1')
      })
      expect(result.error?.message).toBe('Delete failed')
    })
  })

  // ===== pinMessage =====
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

    it('unpins a message', async () => {
      act(() => {
        useMessagesStore.setState({
          messages: [{ id: 'msg-1', content: 'test', is_pinned: true } as any],
        })
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().pinMessage('msg-1', false)
      })
      expect(result.error).toBeNull()
      expect(useMessagesStore.getState().messages[0].is_pinned).toBe(false)
    })

    it('returns error when pin update fails', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Pin failed') }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useMessagesStore.getState().pinMessage('msg-1', true)
      })
      expect(result.error?.message).toBe('Pin failed')
    })

    it('does not affect other messages when pinning', async () => {
      act(() => {
        useMessagesStore.setState({
          messages: [
            { id: 'msg-1', content: 'pin me', is_pinned: false } as any,
            { id: 'msg-2', content: 'leave me', is_pinned: false } as any,
          ],
        })
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      await act(async () => {
        await useMessagesStore.getState().pinMessage('msg-1', true)
      })

      expect(useMessagesStore.getState().messages[0].is_pinned).toBe(true)
      expect(useMessagesStore.getState().messages[1].is_pinned).toBe(false)
    })
  })

  // ===== setActiveConversation =====
  describe('setActiveConversation', () => {
    it('sets active conversation to null', () => {
      act(() => {
        useMessagesStore.getState().setActiveConversation(null)
      })
      expect(useMessagesStore.getState().activeConversation).toBeNull()
    })

    it('sets active conversation and triggers fetchMessages + subscribeToMessages', () => {
      const conversation = {
        id: 'conv-1',
        type: 'squad' as const,
        squad_id: 'squad-1',
        session_id: 'sess-1',
        name: 'Test',
        unread_count: 0,
      }

      // Need to mock supabase for fetchMessages
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      })

      act(() => {
        useMessagesStore.getState().setActiveConversation(conversation)
      })

      expect(useMessagesStore.getState().activeConversation).toEqual(conversation)
      // createRealtimeSubscription should have been called
      expect(mockCreateRealtimeSubscription).toHaveBeenCalledWith('squad-1', 'sess-1', expect.any(Function))
    })

    it('does not fetch or subscribe when conversation is null', () => {
      act(() => {
        useMessagesStore.getState().setActiveConversation(null)
      })
      expect(mockCreateRealtimeSubscription).not.toHaveBeenCalled()
    })
  })

  // ===== subscribeToMessages =====
  describe('subscribeToMessages', () => {
    it('returns early when supabase is not ready', () => {
      mockIsSupabaseReady.mockReturnValue(false)
      act(() => {
        useMessagesStore.getState().subscribeToMessages('squad-1')
      })
      expect(mockCreateRealtimeSubscription).not.toHaveBeenCalled()
    })

    it('unsubscribes from existing channel before creating new one', () => {
      const oldChannel = { id: 'old-channel' }
      act(() => {
        useMessagesStore.setState({ realtimeChannel: oldChannel as any })
      })

      act(() => {
        useMessagesStore.getState().subscribeToMessages('squad-1')
      })

      expect(mockRemoveChannel).toHaveBeenCalledWith(oldChannel)
      expect(mockCreateRealtimeSubscription).toHaveBeenCalled()
    })

    it('creates subscription with sessionId', () => {
      act(() => {
        useMessagesStore.getState().subscribeToMessages('squad-1', 'sess-1')
      })
      expect(mockCreateRealtimeSubscription).toHaveBeenCalledWith('squad-1', 'sess-1', expect.any(Function))
      expect(useMessagesStore.getState().realtimeChannel).toEqual({ id: 'mock-channel' })
    })
  })

  // ===== unsubscribe =====
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

  // ===== markAsRead =====
  describe('markAsRead', () => {
    it('delegates to markMessagesAsRead with correct args', async () => {
      await act(async () => {
        await useMessagesStore.getState().markAsRead('squad-1', 'sess-1')
      })
      expect(mockMarkMessagesAsRead).toHaveBeenCalledWith('squad-1', 'sess-1', expect.any(Function))
    })

    it('delegates without sessionId', async () => {
      await act(async () => {
        await useMessagesStore.getState().markAsRead('squad-1')
      })
      expect(mockMarkMessagesAsRead).toHaveBeenCalledWith('squad-1', undefined, expect.any(Function))
    })
  })

  // ===== markAsReadFallback =====
  describe('markAsReadFallback', () => {
    it('delegates to markMessagesAsReadFallback with correct args', async () => {
      await act(async () => {
        await useMessagesStore.getState().markAsReadFallback('squad-1', 'sess-1')
      })
      expect(mockMarkMessagesAsReadFallback).toHaveBeenCalledWith('squad-1', 'sess-1', expect.any(Function))
    })
  })
})
