import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
  mockChannel: vi.fn(),
  mockRemoveChannel: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}))

vi.mock('../useAuth', () => ({
  useAuthStore: vi.fn(() => ({ user: { id: 'user-1' } })),
}))

import { useSquadNotificationsStore } from '../useSquadNotifications'

describe('useSquadNotificationsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useSquadNotificationsStore.setState({
        pendingRsvpCount: 0,
        isLoading: false,
        lastFetchedAt: null,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useSquadNotificationsStore.getState()
    expect(state.pendingRsvpCount).toBe(0)
    expect(state.isLoading).toBe(false)
    expect(state.lastFetchedAt).toBeNull()
  })

  describe('fetchPendingCounts', () => {
    it('sets count when sessions have no RSVPs', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  gte: vi.fn().mockResolvedValue({
                    data: [
                      { id: 'session-1', status: 'proposed' },
                      { id: 'session-2', status: 'confirmed' },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      })

      await act(async () => {
        await useSquadNotificationsStore.getState().fetchPendingCounts()
      })

      const state = useSquadNotificationsStore.getState()
      expect(state.pendingRsvpCount).toBe(2)
      expect(state.isLoading).toBe(false)
      expect(state.lastFetchedAt).not.toBeNull()
    })

    it('sets 0 when no user session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await act(async () => {
        await useSquadNotificationsStore.getState().fetchPendingCounts()
      })

      const state = useSquadNotificationsStore.getState()
      expect(state.pendingRsvpCount).toBe(0)
      expect(state.isLoading).toBe(false)
    })

    it('sets 0 when no memberships', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }
        }
        return {}
      })

      await act(async () => {
        await useSquadNotificationsStore.getState().fetchPendingCounts()
      })

      const state = useSquadNotificationsStore.getState()
      expect(state.pendingRsvpCount).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.lastFetchedAt).not.toBeNull()
    })

    it('skips fetch when recently fetched (within 30s cache)', async () => {
      // Set lastFetchedAt to just now
      act(() => {
        useSquadNotificationsStore.setState({
          pendingRsvpCount: 5,
          lastFetchedAt: Date.now(),
        })
      })

      await act(async () => {
        await useSquadNotificationsStore.getState().fetchPendingCounts()
      })

      // Should not have called supabase at all
      expect(mockGetSession).not.toHaveBeenCalled()
      // Count should remain unchanged
      expect(useSquadNotificationsStore.getState().pendingRsvpCount).toBe(5)
    })

    it('counts sessions minus responded ones', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  gte: vi.fn().mockResolvedValue({
                    data: [
                      { id: 'session-1', status: 'proposed' },
                      { id: 'session-2', status: 'confirmed' },
                      { id: 'session-3', status: 'proposed' },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ session_id: 'session-1' }],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      })

      await act(async () => {
        await useSquadNotificationsStore.getState().fetchPendingCounts()
      })

      // 3 sessions - 1 responded = 2 pending
      const state = useSquadNotificationsStore.getState()
      expect(state.pendingRsvpCount).toBe(2)
      expect(state.isLoading).toBe(false)
    })

    it('handles error gracefully', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await useSquadNotificationsStore.getState().fetchPendingCounts()
      })

      const state = useSquadNotificationsStore.getState()
      expect(state.isLoading).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
