import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      track: vi.fn().mockResolvedValue(undefined),
      untrack: vi.fn(),
      presenceState: vi.fn().mockReturnValue({}),
    }),
    removeChannel: vi.fn(),
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}))

vi.mock('../useUserStatus', () => ({
  useUserStatusStore: Object.assign(
    vi.fn().mockReturnValue({
      availability: 'online',
      customStatus: null,
      gameStatus: null,
    }),
    {
      getState: () => ({
        availability: 'online',
        customStatus: null,
        gameStatus: null,
      }),
    }
  ),
}))

import { useGlobalPresenceStore } from '../useGlobalPresence'

describe('useGlobalPresenceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useGlobalPresenceStore.setState({
        onlineUsers: new Map(),
        channel: null,
        isConnected: false,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useGlobalPresenceStore.getState()
    expect(state.onlineUsers.size).toBe(0)
    expect(state.channel).toBeNull()
    expect(state.isConnected).toBe(false)
  })

  describe('setOnlineUsers', () => {
    it('updates online users map', () => {
      const users = new Map()
      users.set('user-1', {
        userId: 'user-1',
        username: 'Alice',
        avatarUrl: null,
        availability: 'online',
        customEmoji: null,
        customText: null,
        gameStatus: null,
        activity: null,
        onlineAt: new Date().toISOString(),
      })

      act(() => {
        useGlobalPresenceStore.getState().setOnlineUsers(users)
      })

      expect(useGlobalPresenceStore.getState().onlineUsers.size).toBe(1)
      expect(useGlobalPresenceStore.getState().onlineUsers.get('user-1')?.username).toBe('Alice')
    })
  })

  describe('setChannel', () => {
    it('sets channel reference', () => {
      const mockChannel = { id: 'test' } as any

      act(() => {
        useGlobalPresenceStore.getState().setChannel(mockChannel)
      })

      expect(useGlobalPresenceStore.getState().channel).toBe(mockChannel)
    })

    it('clears channel reference', () => {
      act(() => {
        useGlobalPresenceStore.getState().setChannel({ id: 'test' } as any)
      })
      act(() => {
        useGlobalPresenceStore.getState().setChannel(null)
      })

      expect(useGlobalPresenceStore.getState().channel).toBeNull()
    })
  })

  describe('setConnected', () => {
    it('sets connected state', () => {
      act(() => {
        useGlobalPresenceStore.getState().setConnected(true)
      })

      expect(useGlobalPresenceStore.getState().isConnected).toBe(true)
    })

    it('clears connected state', () => {
      act(() => {
        useGlobalPresenceStore.getState().setConnected(true)
      })
      act(() => {
        useGlobalPresenceStore.getState().setConnected(false)
      })

      expect(useGlobalPresenceStore.getState().isConnected).toBe(false)
    })
  })

  describe('getUser', () => {
    it('returns user when online', () => {
      const users = new Map()
      const userPayload = {
        userId: 'user-1',
        username: 'Alice',
        avatarUrl: null,
        availability: 'online' as const,
        customEmoji: null,
        customText: null,
        gameStatus: null,
        activity: null,
        onlineAt: new Date().toISOString(),
      }
      users.set('user-1', userPayload)

      act(() => {
        useGlobalPresenceStore.getState().setOnlineUsers(users)
      })

      expect(useGlobalPresenceStore.getState().getUser('user-1')).toEqual(userPayload)
    })

    it('returns undefined when user not found', () => {
      expect(useGlobalPresenceStore.getState().getUser('nonexistent')).toBeUndefined()
    })
  })

  describe('isUserOnline', () => {
    it('returns true for online user', () => {
      const users = new Map()
      users.set('user-1', {
        userId: 'user-1',
        username: 'Alice',
        availability: 'online',
        onlineAt: new Date().toISOString(),
      })

      act(() => {
        useGlobalPresenceStore.getState().setOnlineUsers(users)
      })

      expect(useGlobalPresenceStore.getState().isUserOnline('user-1')).toBe(true)
    })

    it('returns false for invisible user', () => {
      const users = new Map()
      users.set('user-1', {
        userId: 'user-1',
        username: 'Alice',
        availability: 'invisible',
        onlineAt: new Date().toISOString(),
      })

      act(() => {
        useGlobalPresenceStore.getState().setOnlineUsers(users)
      })

      expect(useGlobalPresenceStore.getState().isUserOnline('user-1')).toBe(false)
    })

    it('returns false for unknown user', () => {
      expect(useGlobalPresenceStore.getState().isUserOnline('nonexistent')).toBe(false)
    })
  })
})
