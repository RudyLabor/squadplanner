import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
  },
}))

vi.mock('../../lib/systemMessages', () => ({
  sendRsvpMessage: vi.fn().mockResolvedValue(undefined),
  sendSessionConfirmedMessage: vi.fn().mockResolvedValue(undefined),
}))

import { useSessionsStore } from '../useSessions'

describe('useSessionsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useSessionsStore.setState({
        sessions: [],
        currentSession: null,
        isLoading: false,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useSessionsStore.getState()
    expect(state.sessions).toEqual([])
    expect(state.currentSession).toBeNull()
    expect(state.isLoading).toBe(false)
  })

  describe('fetchSessions', () => {
    it('fetches sessions for a squad', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockSessions = [
        { id: 'session-1', squad_id: 'squad-1', title: 'Game Night', scheduled_at: '2026-02-15T20:00:00Z' },
      ]

      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
              }),
            }),
          }
        }
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      await act(async () => {
        await useSessionsStore.getState().fetchSessions('squad-1')
      })

      const state = useSessionsStore.getState()
      expect(state.sessions).toHaveLength(1)
      expect(state.sessions[0].title).toBe('Game Night')
      expect(state.isLoading).toBe(false)
    })

    it('handles fetch error gracefully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      })

      await act(async () => {
        await useSessionsStore.getState().fetchSessions('squad-1')
      })

      expect(useSessionsStore.getState().isLoading).toBe(false)
    })

    it('accumulates sessions from different squads', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })

      // Pre-populate with sessions from squad-1
      act(() => {
        useSessionsStore.setState({
          sessions: [{ id: 's1', squad_id: 'squad-1', title: 'Squad 1 Session' } as any],
        })
      })

      // Fetch sessions for squad-2
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 's2', squad_id: 'squad-2', title: 'Squad 2 Session' }],
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      await act(async () => {
        await useSessionsStore.getState().fetchSessions('squad-2')
      })

      const sessions = useSessionsStore.getState().sessions
      expect(sessions).toHaveLength(2)
    })
  })

  describe('createSession', () => {
    it('creates a new session', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const newSession = {
        id: 'session-new',
        squad_id: 'squad-1',
        title: 'New Session',
        scheduled_at: '2026-02-20T18:00:00Z',
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [newSession], error: null }),
              }),
            }),
          }
        }
        if (table === 'session_rsvps') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { session: any; error: Error | null } = { session: null, error: null }
      await act(async () => {
        result = await useSessionsStore.getState().createSession({
          squad_id: 'squad-1',
          title: 'New Session',
          scheduled_at: '2026-02-20T18:00:00Z',
        })
      })

      expect(result.error).toBeNull()
      expect(result.session).toBeTruthy()
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { session: any; error: Error | null } = { session: null, error: null }
      await act(async () => {
        result = await useSessionsStore.getState().createSession({
          squad_id: 'squad-1',
          scheduled_at: '2026-02-20T18:00:00Z',
        })
      })

      expect(result.error).toBeTruthy()
      expect(result.session).toBeNull()
    })
  })

  describe('cancelSession', () => {
    it('cancels a session', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'session-1', status: 'cancelled' } }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().cancelSession('session-1')
      })

      expect(result.error).toBeNull()
    })
  })

  describe('updateRsvp', () => {
    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().updateRsvp('session-1', 'present')
      })

      expect(result.error).toBeTruthy()
    })
  })

  describe('checkin', () => {
    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().checkin('session-1', 'present')
      })

      expect(result.error).toBeTruthy()
    })
  })
})
