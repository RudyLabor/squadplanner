import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom, mockSupabase, mockIsSupabaseReady } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockFrom = vi.fn()
  const mockIsSupabaseReady = vi.fn().mockReturnValue(true)
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    from: mockFrom,
  }
  return { mockGetSession, mockFrom, mockSupabase, mockIsSupabaseReady }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: mockIsSupabaseReady,
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../../lib/systemMessages', () => ({
  sendRsvpMessage: vi.fn().mockResolvedValue(undefined),
  sendSessionConfirmedMessage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../lib/challengeTracker', () => ({
  trackChallengeProgress: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../lib/notifyOnSession', () => ({
  notifySessionCreated: vi.fn().mockResolvedValue(undefined),
}))

import { useSessionsStore } from '../useSessions'

describe('useSessionsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseReady.mockReturnValue(true)
    act(() => {
      useSessionsStore.setState({
        sessions: [],
        currentSession: null,
        isLoading: false,
      })
    })
  })

  // ===== FETCH SESSIONS =====

  describe('fetchSessions', () => {
    it('fetches sessions for a squad with RSVP counts and my_rsvp', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockSessions = [
        { id: 'session-1', squad_id: 'squad-1', title: 'Game Night', scheduled_at: '2026-02-15T20:00:00Z' },
        { id: 'session-2', squad_id: 'squad-1', title: 'Ranked Grind', scheduled_at: '2026-02-16T20:00:00Z' },
      ]

      const mockRsvps1 = [
        { user_id: 'user-1', response: 'present' },
        { user_id: 'user-2', response: 'absent' },
        { user_id: 'user-3', response: 'maybe' },
      ]

      const mockRsvps2 = [
        { user_id: 'user-2', response: 'present' },
      ]

      let rsvpCallIdx = 0
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
          rsvpCallIdx++
          const data = rsvpCallIdx === 1 ? mockRsvps1 : mockRsvps2
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      await act(async () => {
        await useSessionsStore.getState().fetchSessions('squad-1')
      })

      const sessions = useSessionsStore.getState().sessions
      // STRICT: both sessions were fetched
      expect(sessions).toHaveLength(2)
      // STRICT: first session title correct
      expect(sessions[0].title).toBe('Game Night')
      // STRICT: RSVP counts computed correctly for session 1
      expect(sessions[0].rsvp_counts?.present).toBe(1)
      expect(sessions[0].rsvp_counts?.absent).toBe(1)
      expect(sessions[0].rsvp_counts?.maybe).toBe(1)
      // STRICT: my_rsvp set to current user's response
      expect(sessions[0].my_rsvp).toBe('present')
      // STRICT: second session has different RSVP data
      expect(sessions[1].title).toBe('Ranked Grind')
      expect(sessions[1].rsvp_counts?.present).toBe(1)
      expect(sessions[1].my_rsvp).toBeNull()  // user-1 has no RSVP for session 2
      // STRICT: loading finished
      expect(useSessionsStore.getState().isLoading).toBe(false)
    })

    it('accumulates sessions from different squads without overwriting', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })

      // Pre-populate with squad-1 sessions
      act(() => {
        useSessionsStore.setState({
          sessions: [
            { id: 's1', squad_id: 'squad-1', title: 'Squad 1 Game', rsvp_counts: { present: 0, absent: 0, maybe: 0 }, my_rsvp: null } as any,
          ],
        })
      })

      // Fetch squad-2 sessions
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 's2', squad_id: 'squad-2', title: 'Squad 2 Game' }],
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
      // STRICT: sessions from both squads are present
      expect(sessions).toHaveLength(2)
      // STRICT: squad-1 session was preserved
      expect(sessions.find(s => s.squad_id === 'squad-1')?.title).toBe('Squad 1 Game')
      // STRICT: squad-2 session was added
      expect(sessions.find(s => s.squad_id === 'squad-2')?.title).toBe('Squad 2 Game')
    })

    it('replaces sessions for same squad when re-fetched', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })

      // Pre-populate with old squad-1 sessions
      act(() => {
        useSessionsStore.setState({
          sessions: [
            { id: 's1', squad_id: 'squad-1', title: 'Old Session' } as any,
          ],
        })
      })

      // Fetch updated squad-1 sessions
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 's1-new', squad_id: 'squad-1', title: 'New Session' }],
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
        await useSessionsStore.getState().fetchSessions('squad-1')
      })

      const sessions = useSessionsStore.getState().sessions
      // STRICT: old session replaced, not accumulated
      expect(sessions).toHaveLength(1)
      // STRICT: new data is present
      expect(sessions[0].title).toBe('New Session')
      expect(sessions[0].id).toBe('s1-new')
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

      // STRICT: loading was reset after error
      expect(useSessionsStore.getState().isLoading).toBe(false)
      // STRICT: sessions remain empty (not set to null or undefined)
      expect(useSessionsStore.getState().sessions).toEqual([])
    })

    it('returns early when Supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)

      await act(async () => {
        await useSessionsStore.getState().fetchSessions('squad-1')
      })

      // STRICT: no Supabase calls made
      expect(mockGetSession).not.toHaveBeenCalled()
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  // ===== CREATE SESSION =====

  describe('createSession', () => {
    it('inserts session with correct data, auto-RSVPs creator, and returns session', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const newSession = {
        id: 'session-new',
        squad_id: 'squad-1',
        title: 'Ranked Night',
        scheduled_at: '2026-02-20T18:00:00Z',
        created_by: 'user-1',
        status: 'proposed',
        duration_minutes: 120,
        auto_confirm_threshold: 3,
      }

      const mockSessionInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
        }),
      })

      const mockRsvpInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            insert: mockSessionInsert,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [newSession], error: null }),
              }),
            }),
          }
        }
        if (table === 'session_rsvps') {
          return {
            insert: mockRsvpInsert,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'TestUser' } }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { session: any; error: Error | null } = { session: null, error: null }
      await act(async () => {
        result = await useSessionsStore.getState().createSession({
          squad_id: 'squad-1',
          title: 'Ranked Night',
          game: 'Valorant',
          scheduled_at: '2026-02-20T18:00:00Z',
        })
      })

      // STRICT: no error on success
      expect(result.error).toBeNull()
      // STRICT: returned session has correct id
      expect(result.session?.id).toBe('session-new')
      // STRICT: returned session has correct title
      expect(result.session?.title).toBe('Ranked Night')
      // STRICT: session insert was called
      expect(mockSessionInsert).toHaveBeenCalled()
      // STRICT: insert payload has created_by set to current user
      const insertPayload = mockSessionInsert.mock.calls[0][0]
      expect(insertPayload.created_by).toBe('user-1')
      expect(insertPayload.status).toBe('proposed')
      expect(insertPayload.squad_id).toBe('squad-1')
      // STRICT: auto-RSVP was created for the creator
      expect(mockRsvpInsert).toHaveBeenCalledWith(expect.objectContaining({
        session_id: 'session-new',
        user_id: 'user-1',
        response: 'present',
      }))
      // STRICT: isLoading was reset
      expect(useSessionsStore.getState().isLoading).toBe(false)
    })

    it('uses default duration (120) and threshold (3) when not provided', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockSessionInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'sn', squad_id: 'sq1' },
            error: null,
          }),
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            insert: mockSessionInsert,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
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

      await act(async () => {
        await useSessionsStore.getState().createSession({
          squad_id: 'sq1',
          scheduled_at: '2026-03-01T19:00:00Z',
        })
      })

      // STRICT: defaults applied
      const payload = mockSessionInsert.mock.calls[0][0]
      expect(payload.duration_minutes).toBe(120)
      expect(payload.auto_confirm_threshold).toBe(3)
    })

    it('returns error when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { session: any; error: Error | null } = { session: null, error: null }
      await act(async () => {
        result = await useSessionsStore.getState().createSession({
          squad_id: 'squad-1',
          scheduled_at: '2026-02-20T18:00:00Z',
        })
      })

      // STRICT: error is returned
      expect(result.error).not.toBeNull()
      // STRICT: error message matches
      expect(result.error?.message).toBe('Not authenticated')
      // STRICT: no session returned
      expect(result.session).toBeNull()
      // STRICT: isLoading was reset
      expect(useSessionsStore.getState().isLoading).toBe(false)
    })

    it('returns error when Supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)

      let result: { session: any; error: Error | null } = { session: null, error: null }
      await act(async () => {
        result = await useSessionsStore.getState().createSession({
          squad_id: 'sq1',
          scheduled_at: '2026-02-20T18:00:00Z',
        })
      })

      // STRICT: error returned when Supabase not ready
      expect(result.error?.message).toBe('Supabase not ready')
      expect(result.session).toBeNull()
    })
  })

  // ===== CANCEL SESSION =====

  describe('cancelSession', () => {
    it('updates session status to cancelled and refreshes', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      // Mock for cancelSession update + fetchSessionById follow-up
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            update: mockUpdate,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'session-1', status: 'cancelled' }, error: null }),
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
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      // Need auth session for fetchSessionById
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().cancelSession('session-1')
      })

      // STRICT: no error returned
      expect(result.error).toBeNull()
      // STRICT: update was called on sessions table
      expect(mockFrom).toHaveBeenCalledWith('sessions')
      // STRICT: status was set to 'cancelled'
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' })
    })

    it('returns error when Supabase update fails', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().cancelSession('session-1')
      })

      // STRICT: error message propagated
      expect(result.error?.message).toBe('Update failed')
    })
  })

  // ===== UPDATE RSVP =====

  describe('updateRsvp', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().updateRsvp('session-1', 'present')
      })

      // STRICT: error returned for unauthenticated user
      expect(result.error?.message).toBe('Not authenticated')
    })

    it('returns error when Supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().updateRsvp('session-1', 'present')
      })

      // STRICT: Supabase not ready error
      expect(result.error?.message).toBe('Supabase not ready')
    })

    it('inserts new RSVP when no existing RSVP found', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockRsvpInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
            insert: mockRsvpInsert,
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'TestUser' } }),
              }),
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'session-1', squad_id: 'squad-1', title: 'Game Night' },
                }),
              }),
            }),
          }
        }
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().updateRsvp('session-1', 'present')
      })

      // STRICT: no error on success
      expect(result.error).toBeNull()
      // STRICT: insert was called with correct data
      expect(mockRsvpInsert).toHaveBeenCalledWith(expect.objectContaining({
        session_id: 'session-1',
        user_id: 'user-1',
        response: 'present',
      }))
    })

    it('updates existing RSVP when one already exists', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockRsvpUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'rsvp-existing' } }),
                }),
              }),
            }),
            update: mockRsvpUpdate,
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'TestUser' } }),
              }),
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'session-1', squad_id: 'squad-1', title: 'Game Night' },
                }),
              }),
            }),
          }
        }
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().updateRsvp('session-1', 'absent')
      })

      // STRICT: no error on success
      expect(result.error).toBeNull()
      // STRICT: update was called (not insert) because existing RSVP was found
      expect(mockRsvpUpdate).toHaveBeenCalledWith(expect.objectContaining({
        response: 'absent',
      }))
    })
  })

  // ===== CHECKIN =====

  describe('checkin', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().checkin('session-1', 'present')
      })

      // STRICT: auth error propagated
      expect(result.error?.message).toBe('Not authenticated')
    })

    it('returns error when Supabase is not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().checkin('session-1', 'present')
      })

      // STRICT: not ready error
      expect(result.error?.message).toBe('Supabase not ready')
    })

    it('inserts new checkin when no existing checkin found', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockCheckinInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
            insert: mockCheckinInsert,
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'session-1', squad_id: 'squad-1', title: 'Game Night' },
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
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().checkin('session-1', 'present')
      })

      // STRICT: no error on success
      expect(result.error).toBeNull()
      // STRICT: insert was called with correct data
      expect(mockCheckinInsert).toHaveBeenCalledWith(expect.objectContaining({
        session_id: 'session-1',
        user_id: 'user-1',
        status: 'present',
      }))
    })

    it('updates existing checkin when one already exists', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      const mockCheckinUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'checkin-existing' } }),
                }),
              }),
            }),
            update: mockCheckinUpdate,
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'session-1', squad_id: 'squad-1', title: 'Game Night' },
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
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().checkin('session-1', 'late')
      })

      // STRICT: no error on success
      expect(result.error).toBeNull()
      // STRICT: update was called (not insert) with correct status
      expect(mockCheckinUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: 'late',
      }))
    })
  })

  // ===== CONFIRM SESSION =====

  describe('confirmSession', () => {
    it('updates session status to confirmed', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'session-1', squad_id: 'squad-1', title: 'Game Night', scheduled_at: '2026-02-15T20:00:00Z' },
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          }
        }
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSessionsStore.getState().confirmSession('session-1')
      })

      // STRICT: no error returned
      expect(result.error).toBeNull()
      // STRICT: update was called with 'confirmed' status
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'confirmed' })
      // STRICT: sessions table was accessed
      expect(mockFrom).toHaveBeenCalledWith('sessions')
    })
  })
})
