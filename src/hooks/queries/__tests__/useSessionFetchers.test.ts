import { describe, it, expect, vi, beforeEach } from 'vitest'

// Build chainable Supabase query mock
const { mockSupabase } = vi.hoisted(() => {
  // Create a builder that returns itself for chaining
  function createChainBuilder(resolvedData: unknown = null, resolvedError: unknown = null) {
    const builder: Record<string, ReturnType<typeof vi.fn>> = {}

    const resolve = () => Promise.resolve({ data: resolvedData, error: resolvedError })

    builder.select = vi.fn().mockReturnValue(builder)
    builder.eq = vi.fn().mockReturnValue(builder)
    builder.in = vi.fn().mockReturnValue(builder)
    builder.gte = vi.fn().mockReturnValue(builder)
    builder.order = vi.fn().mockReturnValue(builder)
    builder.limit = vi.fn().mockReturnValue(builder)
    builder.single = vi.fn().mockImplementation(() => resolve())

    // When used as a promise/thenable (for .select('*').eq(...)... without .single())
    builder.then = vi.fn().mockImplementation((onFulfilled) => resolve().then(onFulfilled))

    return builder
  }

  // Track what table is being queried so we can return different data
  const tableResponses: Record<string, { data: unknown; error: unknown }> = {}

  const mockSupabase = {
    from: vi.fn((table: string) => {
      const resp = tableResponses[table] || { data: null, error: null }
      return createChainBuilder(resp.data, resp.error)
    }),
    _setResponse: (table: string, data: unknown, error: unknown = null) => {
      tableResponses[table] = { data, error }
    },
    _clearResponses: () => {
      Object.keys(tableResponses).forEach((k) => delete tableResponses[k])
    },
  }

  return { mockSupabase }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

import {
  fetchSessionsBySquad,
  fetchUpcomingSessions,
  fetchSessionById,
} from '../useSessionFetchers'

describe('useSessionFetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase._clearResponses()
  })

  describe('fetchSessionsBySquad', () => {
    it('returns empty array when no sessions found', async () => {
      mockSupabase._setResponse('sessions', [])

      const result = await fetchSessionsBySquad('squad-1')
      expect(result).toEqual([])
    })

    it('queries sessions table with squad_id filter', async () => {
      mockSupabase._setResponse('sessions', [])

      await fetchSessionsBySquad('squad-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })

    it('returns sessions with rsvp counts', async () => {
      const sessions = [
        { id: 'session-1', squad_id: 'squad-1', title: 'Session 1' },
        { id: 'session-2', squad_id: 'squad-1', title: 'Session 2' },
      ]
      const rsvps = [
        { session_id: 'session-1', user_id: 'user-1', response: 'present' },
        { session_id: 'session-1', user_id: 'user-2', response: 'absent' },
        { session_id: 'session-2', user_id: 'user-1', response: 'maybe' },
      ]

      mockSupabase._setResponse('sessions', sessions)
      mockSupabase._setResponse('session_rsvps', rsvps)

      const result = await fetchSessionsBySquad('squad-1')

      expect(result).toHaveLength(2)
      expect(result[0].rsvp_counts).toEqual({ present: 1, absent: 1, maybe: 0 })
      expect(result[1].rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 1 })
    })

    it('computes my_rsvp when userId is provided', async () => {
      const sessions = [{ id: 'session-1', squad_id: 'squad-1' }]
      const rsvps = [
        { session_id: 'session-1', user_id: 'user-1', response: 'present' },
        { session_id: 'session-1', user_id: 'user-2', response: 'absent' },
      ]

      mockSupabase._setResponse('sessions', sessions)
      mockSupabase._setResponse('session_rsvps', rsvps)

      const result = await fetchSessionsBySquad('squad-1', 'user-1')

      expect(result[0].my_rsvp).toBe('present')
    })

    it('sets my_rsvp to null when user has no RSVP', async () => {
      const sessions = [{ id: 'session-1', squad_id: 'squad-1' }]
      const rsvps = [{ session_id: 'session-1', user_id: 'user-2', response: 'present' }]

      mockSupabase._setResponse('sessions', sessions)
      mockSupabase._setResponse('session_rsvps', rsvps)

      const result = await fetchSessionsBySquad('squad-1', 'user-3')

      expect(result[0].my_rsvp).toBeNull()
    })

    it('sets my_rsvp to null when no userId provided', async () => {
      const sessions = [{ id: 'session-1', squad_id: 'squad-1' }]
      mockSupabase._setResponse('sessions', sessions)
      mockSupabase._setResponse('session_rsvps', [])

      const result = await fetchSessionsBySquad('squad-1')

      expect(result[0].my_rsvp).toBeNull()
    })

    it('throws when sessions query fails', async () => {
      mockSupabase._setResponse('sessions', null, { message: 'DB error' })

      await expect(fetchSessionsBySquad('squad-1')).rejects.toEqual({ message: 'DB error' })
    })

    it('handles null rsvps gracefully', async () => {
      const sessions = [{ id: 'session-1', squad_id: 'squad-1' }]
      mockSupabase._setResponse('sessions', sessions)
      mockSupabase._setResponse('session_rsvps', null)

      const result = await fetchSessionsBySquad('squad-1')

      expect(result[0].rsvps).toEqual([])
      expect(result[0].rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 0 })
    })
  })

  describe('fetchUpcomingSessions', () => {
    it('returns empty array when user has no memberships', async () => {
      mockSupabase._setResponse('squad_members', [])

      const result = await fetchUpcomingSessions('user-1')
      expect(result).toEqual([])
    })

    it('returns empty array when no upcoming sessions', async () => {
      mockSupabase._setResponse('squad_members', [{ squad_id: 'squad-1' }])
      mockSupabase._setResponse('sessions', [])

      const result = await fetchUpcomingSessions('user-1')
      expect(result).toEqual([])
    })

    it('returns empty array when memberships data is null', async () => {
      mockSupabase._setResponse('squad_members', null)

      const result = await fetchUpcomingSessions('user-1')
      expect(result).toEqual([])
    })

    it('returns upcoming sessions with rsvp data', async () => {
      const memberships = [{ squad_id: 'squad-1' }, { squad_id: 'squad-2' }]
      const sessions = [
        { id: 'session-1', squad_id: 'squad-1', scheduled_at: '2030-01-01T10:00:00Z' },
      ]
      const rsvps = [{ session_id: 'session-1', user_id: 'user-1', response: 'present' }]

      mockSupabase._setResponse('squad_members', memberships)
      mockSupabase._setResponse('sessions', sessions)
      mockSupabase._setResponse('session_rsvps', rsvps)

      const result = await fetchUpcomingSessions('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].my_rsvp).toBe('present')
      expect(result[0].rsvp_counts).toEqual({ present: 1, absent: 0, maybe: 0 })
    })

    it('throws when sessions query errors', async () => {
      mockSupabase._setResponse('squad_members', [{ squad_id: 'squad-1' }])
      mockSupabase._setResponse('sessions', null, { message: 'Sessions error' })

      await expect(fetchUpcomingSessions('user-1')).rejects.toEqual({
        message: 'Sessions error',
      })
    })
  })

  describe('fetchSessionById', () => {
    it('returns session with rsvps and checkins', async () => {
      const session = { id: 'session-1', title: 'Test Session', squad_id: 'squad-1' }
      const rsvps = [{ session_id: 'session-1', user_id: 'user-1', response: 'present' }]
      const profiles = [{ id: 'user-1', username: 'player1' }]
      const checkins = [{ session_id: 'session-1', user_id: 'user-1' }]

      mockSupabase._setResponse('sessions', session)
      mockSupabase._setResponse('session_rsvps', rsvps)
      mockSupabase._setResponse('profiles', profiles)
      mockSupabase._setResponse('session_checkins', checkins)

      const result = await fetchSessionById('session-1', 'user-1')

      expect(result).toBeTruthy()
      expect(result!.id).toBe('session-1')
      expect(result!.checkins).toEqual(checkins)
      expect(result!.my_rsvp).toBe('present')
      expect(result!.rsvp_counts).toEqual({ present: 1, absent: 0, maybe: 0 })
    })

    it('returns session with empty rsvps when none exist', async () => {
      const session = { id: 'session-1', squad_id: 'squad-1' }
      mockSupabase._setResponse('sessions', session)
      mockSupabase._setResponse('session_rsvps', null)
      mockSupabase._setResponse('session_checkins', null)

      const result = await fetchSessionById('session-1')

      expect(result!.rsvps).toEqual([])
      expect(result!.checkins).toEqual([])
      expect(result!.rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 0 })
    })

    it('throws when session query errors', async () => {
      mockSupabase._setResponse('sessions', null, { message: 'Not found' })

      await expect(fetchSessionById('nonexistent')).rejects.toEqual({
        message: 'Not found',
      })
    })

    it('sets default username when profile not found', async () => {
      const session = { id: 'session-1', squad_id: 'squad-1' }
      const rsvps = [{ session_id: 'session-1', user_id: 'unknown-user', response: 'present' }]

      mockSupabase._setResponse('sessions', session)
      mockSupabase._setResponse('session_rsvps', rsvps)
      mockSupabase._setResponse('profiles', []) // no profiles found
      mockSupabase._setResponse('session_checkins', [])

      const result = await fetchSessionById('session-1')

      // The code sets profiles to { username: 'Joueur' } for missing profiles
      expect(result!.rsvps![0]).toHaveProperty('profiles')
    })

    it('computes rsvp counts correctly with multiple responses', async () => {
      const session = { id: 'session-1', squad_id: 'squad-1' }
      const rsvps = [
        { session_id: 'session-1', user_id: 'u1', response: 'present' },
        { session_id: 'session-1', user_id: 'u2', response: 'present' },
        { session_id: 'session-1', user_id: 'u3', response: 'absent' },
        { session_id: 'session-1', user_id: 'u4', response: 'maybe' },
        { session_id: 'session-1', user_id: 'u5', response: 'maybe' },
      ]
      const profiles = [
        { id: 'u1', username: 'p1' },
        { id: 'u2', username: 'p2' },
        { id: 'u3', username: 'p3' },
        { id: 'u4', username: 'p4' },
        { id: 'u5', username: 'p5' },
      ]

      mockSupabase._setResponse('sessions', session)
      mockSupabase._setResponse('session_rsvps', rsvps)
      mockSupabase._setResponse('profiles', profiles)
      mockSupabase._setResponse('session_checkins', [])

      const result = await fetchSessionById('session-1', 'u3')

      expect(result!.rsvp_counts).toEqual({ present: 2, absent: 1, maybe: 2 })
      expect(result!.my_rsvp).toBe('absent')
    })
  })
})
