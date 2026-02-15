import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// ── Hoisted mocks ─────────────────────────────────────────────────────
const { mockSupabase, mockShowError, mockUseAuthStore } = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null })

  const chainMethods = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject)
    return chain
  }

  const mockFrom = vi.fn().mockImplementation(() => chainMethods())

  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: mockFrom,
    rpc: mockRpc,
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
  }

  const mockShowError = vi.fn()
  const mockUseAuthStore = vi.fn().mockReturnValue({
    user: { id: 'user-1' },
  })

  return { mockSupabase, mockShowError, mockUseAuthStore }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

vi.mock('../../lib/toast', () => ({
  showError: mockShowError,
  showSuccess: vi.fn(),
}))

vi.mock('../useAuth', () => ({
  useAuthStore: mockUseAuthStore,
}))

// ── Helpers ───────────────────────────────────────────────────────────
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import { useThreads, useThreadInfo } from '../useThreads'

// ══════════════════════════════════════════════════════════════════════
// useThreads
// ══════════════════════════════════════════════════════════════════════
describe('useThreads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } })
  })

  // ── Query disabled when threadId is null ────────────────────────────
  it('returns empty messages and not loading when threadId is null', () => {
    const { result } = renderHook(() => useThreads(null), {
      wrapper: createWrapper(),
    })
    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  // ── Fetches via RPC when successful ─────────────────────────────────
  it('fetches thread messages via RPC when available', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        content: 'Hello thread',
        sender_id: 'user-1',
        sender_username: 'TestUser',
        sender_avatar: null,
        created_at: '2026-01-01T00:00:00Z',
        edited_at: null,
        reply_to_id: null,
        is_system_message: false,
      },
    ]
    mockSupabase.rpc.mockResolvedValue({ data: mockMessages, error: null })

    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.messages).toEqual(mockMessages)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_thread_messages', {
      p_thread_id: 'thread-1',
      p_limit: 50,
    })
  })

  // ── Falls back to direct query when RPC fails ──────────────────────
  it('falls back to direct query when RPC returns error', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } })

    const fallbackData = [
      {
        id: 'msg-2',
        content: 'Fallback message',
        sender_id: 'user-2',
        created_at: '2026-01-01T00:00:00Z',
        edited_at: null,
        reply_to_id: null,
        is_system_message: false,
        sender: { username: 'FallbackUser', avatar_url: 'avatar.png' },
      },
    ]

    const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: fallbackData, error: null }).then(resolve, reject)

    mockSupabase.from.mockReturnValue(chain)

    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].sender_username).toBe('FallbackUser')
    expect(result.current.messages[0].sender_avatar).toBe('avatar.png')
  })

  // ── Falls back to 'Utilisateur' when sender is missing ─────────────
  it('uses "Utilisateur" as fallback username in direct query', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

    const fallbackData = [
      {
        id: 'msg-3',
        content: 'No sender',
        sender_id: 'user-3',
        created_at: '2026-01-01T00:00:00Z',
        edited_at: null,
        reply_to_id: null,
        is_system_message: false,
        sender: null,
      },
    ]

    const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: fallbackData, error: null }).then(resolve, reject)

    mockSupabase.from.mockReturnValue(chain)

    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.messages[0].sender_username).toBe('Utilisateur')
    // When sender is null, avatar_url access returns undefined which is cast to string|null
    expect(result.current.messages[0].sender_avatar).toBeFalsy()
  })

  // ── Realtime subscription ──────────────────────────────────────────
  it('subscribes to realtime channel when threadId is provided', () => {
    renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    expect(mockSupabase.channel).toHaveBeenCalledWith('thread:thread-1')
  })

  it('does not subscribe when threadId is null', () => {
    renderHook(() => useThreads(null), {
      wrapper: createWrapper(),
    })

    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  it('removes channel on cleanup', () => {
    const { unmount } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    unmount()
    expect(mockSupabase.removeChannel).toHaveBeenCalled()
  })

  // ── sendReply ──────────────────────────────────────────────────────
  it('exposes sendReply function', () => {
    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })
    expect(typeof result.current.sendReply).toBe('function')
  })

  it('exposes isSending state', () => {
    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })
    expect(result.current.isSending).toBe(false)
  })

  it('replyMutation throws if threadId is null', async () => {
    const { result } = renderHook(() => useThreads(null), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.sendReply('Hello')
    })

    // Should call showError because threadId is null
    await waitFor(() => expect(mockShowError).toHaveBeenCalled())
  })

  it('replyMutation throws if user is not connected', async () => {
    mockUseAuthStore.mockReturnValue({ user: null })

    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.sendReply('Hello')
    })

    await waitFor(() => expect(mockShowError).toHaveBeenCalled())
  })

  it('sends reply when threadId and user are present', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } })

    // Parent message lookup
    const parentChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
    parentChain.select = vi.fn().mockReturnValue(parentChain)
    parentChain.eq = vi.fn().mockReturnValue(parentChain)
    parentChain.single = vi.fn().mockResolvedValue({
      data: { squad_id: 'squad-1', session_id: 'sess-1' },
      error: null,
    })
    parentChain.insert = vi.fn().mockReturnValue(parentChain)
    parentChain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject)

    mockSupabase.from.mockReturnValue(parentChain)
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.sendReply('Test reply')
    })

    // Wait for mutation to settle
    await waitFor(() => expect(result.current.isSending).toBe(false))
    expect(mockSupabase.from).toHaveBeenCalledWith('messages')
  })

  it('calls showError when reply fails', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } })

    // Parent found but insert fails
    const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({
      data: { squad_id: 'sq', session_id: 'se' },
      error: null,
    })
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: null, error: { message: 'Insert failed' } }).then(resolve, reject)

    mockSupabase.from.mockReturnValue(chain)
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.sendReply('Will fail')
    })

    await waitFor(() => expect(mockShowError).toHaveBeenCalledWith("Erreur lors de l'envoi"))
  })

  // ── realtimeChannel ────────────────────────────────────────────────
  it('exposes realtimeChannel in return value', () => {
    const { result } = renderHook(() => useThreads('thread-1'), {
      wrapper: createWrapper(),
    })
    expect(result.current).toHaveProperty('realtimeChannel')
  })
})

// ══════════════════════════════════════════════════════════════════════
// useThreadInfo
// ══════════════════════════════════════════════════════════════════════
describe('useThreadInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when messageId is undefined', async () => {
    const { result } = renderHook(() => useThreadInfo(undefined), {
      wrapper: createWrapper(),
    })

    // Query should be disabled
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('fetches thread info for a valid messageId', async () => {
    const threadData = {
      id: 'msg-parent',
      content: 'Parent message',
      sender_id: 'user-1',
      thread_reply_count: 5,
      thread_last_reply_at: '2026-01-01T00:00:00Z',
      squad_id: 'squad-1',
      sender: { username: 'ParentUser', avatar_url: 'avatar.png' },
    }

    const singleFn = vi.fn().mockResolvedValue({ data: threadData, error: null })
    const chain: Record<string, ReturnType<typeof vi.fn>> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = singleFn

    mockSupabase.from.mockReturnValue(chain)

    const { result } = renderHook(() => useThreadInfo('msg-parent'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).not.toBeUndefined()
    })
    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.id).toBe('msg-parent')
    expect(result.current.data!.sender_username).toBe('ParentUser')
    expect(result.current.data!.sender_avatar).toBe('avatar.png')
    expect(result.current.data!.thread_reply_count).toBe(5)
    expect(result.current.data!.squad_id).toBe('squad-1')
  })

  it('returns null when data has no sender', async () => {
    const threadData = {
      id: 'msg-no-sender',
      content: 'No sender message',
      sender_id: 'user-2',
      thread_reply_count: 0,
      thread_last_reply_at: null,
      squad_id: 'squad-2',
      sender: null,
    }

    const chain: Record<string, ReturnType<typeof vi.fn>> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: threadData, error: null })

    mockSupabase.from.mockReturnValue(chain)

    const { result } = renderHook(() => useThreadInfo('msg-no-sender'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).not.toBeUndefined())
    if (result.current.data) {
      expect(result.current.data.sender_username).toBe('Utilisateur')
    }
  })

  it('returns null when query errors', async () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })

    mockSupabase.from.mockReturnValue(chain)

    const { result } = renderHook(() => useThreadInfo('msg-bad'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeNull()
  })

  it('defaults thread_reply_count to 0 when missing', async () => {
    const threadData = {
      id: 'msg-no-count',
      content: 'No count',
      sender_id: 'user-1',
      thread_reply_count: null,
      thread_last_reply_at: null,
      squad_id: 'squad-1',
      sender: { username: 'User', avatar_url: null },
    }

    const chain: Record<string, ReturnType<typeof vi.fn>> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: threadData, error: null })

    mockSupabase.from.mockReturnValue(chain)

    const { result } = renderHook(() => useThreadInfo('msg-no-count'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).not.toBeUndefined()
    })
    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.thread_reply_count).toBe(0)
  })
})
