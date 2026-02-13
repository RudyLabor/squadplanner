import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom, mockChannel, mockRemoveChannel, mockSupabase } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockFrom = vi.fn()
  const mockChannel = vi.fn()
  const mockRemoveChannel = vi.fn()
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }
  return { mockGetSession, mockFrom, mockChannel, mockRemoveChannel, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

// Mock navigator badge APIs
const mockSetAppBadge = vi.fn().mockResolvedValue(undefined)
const mockClearAppBadge = vi.fn().mockResolvedValue(undefined)

Object.defineProperty(navigator, 'setAppBadge', {
  value: mockSetAppBadge,
  writable: true,
  configurable: true,
})

Object.defineProperty(navigator, 'clearAppBadge', {
  value: mockClearAppBadge,
  writable: true,
  configurable: true,
})

import { useUnreadCountStore } from '../useUnreadCount'

describe('useUnreadCountStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useUnreadCountStore.setState({
        squadUnread: 0,
        dmUnread: 0,
        totalUnread: 0,
        isSubscribed: false,
        channel: null,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useUnreadCountStore.getState()
    expect(state.squadUnread).toBe(0)
    expect(state.dmUnread).toBe(0)
    expect(state.totalUnread).toBe(0)
    expect(state.isSubscribed).toBe(false)
    expect(state.channel).toBeNull()
  })

  describe('incrementSquad', () => {
    it('increases squadUnread and totalUnread by 1', () => {
      act(() => {
        useUnreadCountStore.getState().incrementSquad()
      })

      const state = useUnreadCountStore.getState()
      expect(state.squadUnread).toBe(1)
      expect(state.totalUnread).toBe(1)
      expect(state.dmUnread).toBe(0)
    })
  })

  describe('incrementDM', () => {
    it('increases dmUnread and totalUnread by 1', () => {
      act(() => {
        useUnreadCountStore.getState().incrementDM()
      })

      const state = useUnreadCountStore.getState()
      expect(state.dmUnread).toBe(1)
      expect(state.totalUnread).toBe(1)
      expect(state.squadUnread).toBe(0)
    })
  })

  describe('decrementSquad', () => {
    it('decreases squadUnread by 1 by default', () => {
      act(() => {
        useUnreadCountStore.setState({ squadUnread: 5, totalUnread: 5 })
      })

      act(() => {
        useUnreadCountStore.getState().decrementSquad()
      })

      const state = useUnreadCountStore.getState()
      expect(state.squadUnread).toBe(4)
      expect(state.totalUnread).toBe(4)
    })

    it('decreases squadUnread by the specified count', () => {
      act(() => {
        useUnreadCountStore.setState({ squadUnread: 10, totalUnread: 10 })
      })

      act(() => {
        useUnreadCountStore.getState().decrementSquad(3)
      })

      const state = useUnreadCountStore.getState()
      expect(state.squadUnread).toBe(7)
      expect(state.totalUnread).toBe(7)
    })

    it('does not go below 0', () => {
      act(() => {
        useUnreadCountStore.setState({ squadUnread: 1, totalUnread: 1 })
      })

      act(() => {
        useUnreadCountStore.getState().decrementSquad(5)
      })

      const state = useUnreadCountStore.getState()
      expect(state.squadUnread).toBe(0)
      expect(state.totalUnread).toBe(0)
    })
  })

  describe('decrementDM', () => {
    it('decreases dmUnread by 1 by default', () => {
      act(() => {
        useUnreadCountStore.setState({ dmUnread: 3, totalUnread: 3 })
      })

      act(() => {
        useUnreadCountStore.getState().decrementDM()
      })

      const state = useUnreadCountStore.getState()
      expect(state.dmUnread).toBe(2)
      expect(state.totalUnread).toBe(2)
    })

    it('does not go below 0', () => {
      act(() => {
        useUnreadCountStore.setState({ dmUnread: 0, totalUnread: 0 })
      })

      act(() => {
        useUnreadCountStore.getState().decrementDM()
      })

      const state = useUnreadCountStore.getState()
      expect(state.dmUnread).toBe(0)
      expect(state.totalUnread).toBe(0)
    })
  })

  describe('fetchCounts', () => {
    it('does nothing when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await act(async () => {
        await useUnreadCountStore.getState().fetchCounts()
      })

      const state = useUnreadCountStore.getState()
      expect(state.squadUnread).toBe(0)
      expect(state.dmUnread).toBe(0)
      expect(state.totalUnread).toBe(0)
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('sets counts from supabase queries', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      // First call: squad_members
      // Second call: messages (squad unread count)
      // Third call: direct_messages (dm unread count)
      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ squad_id: 'squad-1' }, { squad_id: 'squad-2' }],
              error: null,
            }),
          }
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  not: vi.fn().mockResolvedValue({ count: 5, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'direct_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ count: 3, error: null }),
              }),
            }),
          }
        }
        return {}
      })

      await act(async () => {
        await useUnreadCountStore.getState().fetchCounts()
      })

      const state = useUnreadCountStore.getState()
      expect(state.squadUnread).toBe(5)
      expect(state.dmUnread).toBe(3)
      expect(state.totalUnread).toBe(8)
    })

    it('sets zeros when no memberships', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }
        }
        return {}
      })

      await act(async () => {
        await useUnreadCountStore.getState().fetchCounts()
      })

      const state = useUnreadCountStore.getState()
      expect(state.squadUnread).toBe(0)
      expect(state.dmUnread).toBe(0)
      expect(state.totalUnread).toBe(0)
    })
  })
})
