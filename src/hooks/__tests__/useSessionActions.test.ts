import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSupabase, mockFrom, mockGetSession, mockIsSupabaseReady } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockFrom = vi.fn()
  const mockIsSupabaseReady = vi.fn().mockReturnValue(true)
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    from: mockFrom,
  }
  return { mockSupabase, mockFrom, mockGetSession, mockIsSupabaseReady }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: mockIsSupabaseReady,
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

const { mockSendRsvpMessage, mockSendSessionConfirmedMessage } = vi.hoisted(() => {
  const mockSendRsvpMessage = vi.fn().mockResolvedValue(undefined)
  const mockSendSessionConfirmedMessage = vi.fn().mockResolvedValue(undefined)
  return { mockSendRsvpMessage, mockSendSessionConfirmedMessage }
})

vi.mock('../../lib/systemMessages', () => ({
  sendRsvpMessage: mockSendRsvpMessage,
  sendSessionConfirmedMessage: mockSendSessionConfirmedMessage,
}))

const { mockTrackChallengeProgress } = vi.hoisted(() => {
  const mockTrackChallengeProgress = vi.fn().mockResolvedValue(undefined)
  return { mockTrackChallengeProgress }
})

vi.mock('../../lib/challengeTracker', () => ({
  trackChallengeProgress: mockTrackChallengeProgress,
}))

import { createSessionActions } from '../useSessionActions'

describe('createSessionActions', () => {
  const mockFetchSessionById = vi.fn().mockResolvedValue(undefined)
  const mockGet = vi.fn().mockReturnValue({ fetchSessionById: mockFetchSessionById })

  // Helper to build the Supabase chain for a given table
  function setupFromMock(config: {
    table: string
    selectData?: unknown
    insertError?: unknown
    updateError?: unknown
    singleData?: unknown
  }) {
    const {
      table,
      selectData = null,
      insertError = null,
      updateError = null,
      singleData = null,
    } = config

    const mockSingle = vi.fn().mockResolvedValue({ data: selectData, error: null })
    const mockEqInner = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEqOuter = vi.fn().mockReturnValue({ eq: mockEqInner })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqOuter })

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: updateError })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    const mockInsert = vi.fn().mockResolvedValue({ error: insertError })

    return {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      mockSingle,
      mockEqInner,
      mockEqOuter,
      mockSelect,
      mockInsert,
      mockUpdate,
      mockUpdateEq,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseReady.mockReturnValue(true)
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'test@test.com' } } },
    })
  })

  describe('updateRsvp', () => {
    it('returns error when supabase not ready', async () => {
      mockIsSupabaseReady.mockReturnValue(false)
      const actions = createSessionActions(mockGet)

      const result = await actions.updateRsvp('session-1', 'present')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Supabase not ready')
    })

    it('creates new RSVP when none exists', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingleRsvp = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockSingleProfile = vi.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      })
      const mockSingleSession = vi.fn().mockResolvedValue({
        data: { squad_id: 'squad-1', title: 'Game Night' },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSingleRsvp,
                }),
              }),
            }),
            insert: mockInsert,
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleProfile,
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleSession,
              }),
            }),
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      const result = await actions.updateRsvp('session-1', 'present')

      expect(result.error).toBeNull()
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session-1',
          user_id: 'user-1',
          response: 'present',
        })
      )
    })

    it('updates existing RSVP', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })
      const mockSingleRsvp = vi.fn().mockResolvedValue({
        data: { id: 'rsvp-1' },
        error: null,
      })
      const mockSingleProfile = vi.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      })
      const mockSingleSession = vi.fn().mockResolvedValue({
        data: { squad_id: 'squad-1', title: 'Game Night' },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSingleRsvp,
                }),
              }),
            }),
            update: mockUpdate,
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleProfile,
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleSession,
              }),
            }),
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      const result = await actions.updateRsvp('session-1', 'maybe')

      expect(result.error).toBeNull()
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          response: 'maybe',
        })
      )
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'rsvp-1')
    })

    it('sends system message after successful RSVP', async () => {
      const mockSingleRsvp = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockSingleProfile = vi.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      })
      const mockSingleSession = vi.fn().mockResolvedValue({
        data: { squad_id: 'squad-1', title: 'Game Night' },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSingleRsvp,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleProfile,
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleSession,
              }),
            }),
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      await actions.updateRsvp('session-1', 'present')

      expect(mockSendRsvpMessage).toHaveBeenCalledWith(
        'squad-1',
        'testuser',
        'Game Night',
        'present'
      )
    })

    it('tracks challenge progress when response is present', async () => {
      const mockSingleRsvp = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockSingleProfile = vi.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      })
      const mockSingleSession = vi.fn().mockResolvedValue({
        data: { squad_id: 'squad-1', title: 'Game Night' },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSingleRsvp,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleProfile,
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleSession,
              }),
            }),
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      await actions.updateRsvp('session-1', 'present')

      expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'rsvp')
      expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'daily_rsvp')
    })

    it('calls fetchSessionById after successful update', async () => {
      const mockSingleRsvp = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockSingleProfile = vi.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      })
      const mockSingleSession = vi.fn().mockResolvedValue({
        data: { squad_id: 'squad-1', title: 'Game Night' },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSingleRsvp,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleProfile,
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleSession,
              }),
            }),
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      await actions.updateRsvp('session-1', 'absent')

      expect(mockFetchSessionById).toHaveBeenCalledWith('session-1')
    })
  })

  describe('checkin', () => {
    it('creates new checkin when none exists', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingleCheckin = vi.fn().mockResolvedValue({ data: null, error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSingleCheckin,
                }),
              }),
            }),
            insert: mockInsert,
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      const result = await actions.checkin('session-1', 'present')

      expect(result.error).toBeNull()
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session-1',
          user_id: 'user-1',
          status: 'present',
        })
      )
    })

    it('updates existing checkin', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })
      const mockSingleCheckin = vi.fn().mockResolvedValue({
        data: { id: 'checkin-1' },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'session_checkins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSingleCheckin,
                }),
              }),
            }),
            update: mockUpdate,
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      const result = await actions.checkin('session-1', 'late')

      expect(result.error).toBeNull()
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'late',
        })
      )
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'checkin-1')
    })
  })

  describe('cancelSession', () => {
    it('updates session status to cancelled', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            update: mockUpdate,
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      const result = await actions.cancelSession('session-1')

      expect(result.error).toBeNull()
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' })
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'session-1')
      expect(mockFetchSessionById).toHaveBeenCalledWith('session-1')
    })
  })

  describe('confirmSession', () => {
    it('updates session status to confirmed and sends system message', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })
      const mockSingleSession = vi.fn().mockResolvedValue({
        data: {
          squad_id: 'squad-1',
          title: 'Game Night',
          scheduled_at: '2026-02-15T20:00:00Z',
        },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleSession,
              }),
            }),
            update: mockUpdate,
          }
        }
        return {}
      })

      const actions = createSessionActions(mockGet)
      const result = await actions.confirmSession('session-1')

      expect(result.error).toBeNull()
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'confirmed' })
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'session-1')
      expect(mockSendSessionConfirmedMessage).toHaveBeenCalledWith(
        'squad-1',
        'Game Night',
        '2026-02-15T20:00:00Z'
      )
      expect(mockFetchSessionById).toHaveBeenCalledWith('session-1')
    })
  })
})
