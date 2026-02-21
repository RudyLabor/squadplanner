import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { mockGetSession, mockChannel, mockRemoveChannel, mockSupabase } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockChannel = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue('ok'),
    unsubscribe: vi.fn(),
  })
  const mockRemoveChannel = vi.fn()
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }
  return { mockGetSession, mockChannel, mockRemoveChannel, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

import { useTypingIndicator } from '../useTypingIndicator'

const defaultOptions = {
  conversationType: 'squad' as const,
  conversationId: 'squad-123',
  currentUsername: 'TestUser',
}

describe('useTypingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'current-user-id' } } },
    })
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue('ok'),
      unsubscribe: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial state: empty typingUsers, null typingText', async () => {
    const { result } = renderHook(() => useTypingIndicator(defaultOptions))

    // Flush getSession promise
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.typingUsers).toEqual([])
    expect(result.current.typingText).toBeNull()
  })

  it('typingText returns null when no typing users', async () => {
    const { result } = renderHook(() => useTypingIndicator(defaultOptions))

    // Flush getSession promise
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.typingText).toBeNull()
  })

  it('typingText formats single user: "Pierre ecrit..."', async () => {
    const { result } = renderHook(() => useTypingIndicator(defaultOptions))

    // Wait for getSession to resolve and set currentUserId
    await act(async () => {
      await Promise.resolve()
    })

    // Simulate a typing user by directly setting state via the broadcast callback
    // The hook listens to broadcast 'typing' events. We need to trigger the callback.
    // Since the channel.on is mocked, we capture the callback and call it manually.
    const channelInstance = mockChannel.mock.results[0]?.value
    if (channelInstance) {
      const onCalls = channelInstance.on.mock.calls
      // Find the 'typing' broadcast handler
      const typingCall = onCalls.find(
        (call: any[]) => call[0] === 'broadcast' && call[1]?.event === 'typing'
      )
      if (typingCall) {
        const typingHandler = typingCall[2]
        act(() => {
          typingHandler({
            payload: { userId: 'other-user-1', username: 'Pierre' },
          })
        })
      }
    }

    expect(result.current.typingText).toBe('Pierre \u00e9crit...')
  })

  it('typingText formats two users: "Pierre et Marie ecrivent..."', async () => {
    const { result } = renderHook(() => useTypingIndicator(defaultOptions))

    await act(async () => {
      await Promise.resolve()
    })

    const channelInstance = mockChannel.mock.results[0]?.value
    if (channelInstance) {
      const onCalls = channelInstance.on.mock.calls
      const typingCall = onCalls.find(
        (call: any[]) => call[0] === 'broadcast' && call[1]?.event === 'typing'
      )
      if (typingCall) {
        const typingHandler = typingCall[2]
        act(() => {
          typingHandler({
            payload: { userId: 'other-user-1', username: 'Pierre' },
          })
          typingHandler({
            payload: { userId: 'other-user-2', username: 'Marie' },
          })
        })
      }
    }

    expect(result.current.typingText).toBe('Pierre et Marie \u00e9crivent...')
  })

  it('typingText formats 3+ users: "Pierre et 2 autres ecrivent..."', async () => {
    const { result } = renderHook(() => useTypingIndicator(defaultOptions))

    await act(async () => {
      await Promise.resolve()
    })

    const channelInstance = mockChannel.mock.results[0]?.value
    if (channelInstance) {
      const onCalls = channelInstance.on.mock.calls
      const typingCall = onCalls.find(
        (call: any[]) => call[0] === 'broadcast' && call[1]?.event === 'typing'
      )
      if (typingCall) {
        const typingHandler = typingCall[2]
        act(() => {
          typingHandler({
            payload: { userId: 'other-user-1', username: 'Pierre' },
          })
          typingHandler({
            payload: { userId: 'other-user-2', username: 'Marie' },
          })
          typingHandler({
            payload: { userId: 'other-user-3', username: 'Jean' },
          })
        })
      }
    }

    expect(result.current.typingText).toBe('Pierre et 2 autres \u00e9crivent...')
  })

  it('cleanup removes channel on unmount', async () => {
    const { unmount } = renderHook(() => useTypingIndicator(defaultOptions))

    await act(async () => {
      await Promise.resolve()
    })

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})
