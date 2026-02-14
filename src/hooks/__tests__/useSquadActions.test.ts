import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSupabase, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockSupabase = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }
  return { mockSupabase, mockFrom, mockGetUser }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

const { mockSendMemberJoinedMessage, mockSendMemberLeftMessage } = vi.hoisted(() => {
  const mockSendMemberJoinedMessage = vi.fn().mockResolvedValue(undefined)
  const mockSendMemberLeftMessage = vi.fn().mockResolvedValue(undefined)
  return { mockSendMemberJoinedMessage, mockSendMemberLeftMessage }
})

vi.mock('../../lib/systemMessages', () => ({
  sendMemberJoinedMessage: mockSendMemberJoinedMessage,
  sendMemberLeftMessage: mockSendMemberLeftMessage,
}))

const { mockTrackChallengeProgress } = vi.hoisted(() => {
  const mockTrackChallengeProgress = vi.fn().mockResolvedValue(undefined)
  return { mockTrackChallengeProgress }
})

vi.mock('../../lib/challengeTracker', () => ({
  trackChallengeProgress: mockTrackChallengeProgress,
}))

import { createSquadAction, joinSquadAction, leaveSquadAction } from '../useSquadActions'

describe('useSquadActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })
  })

  describe('createSquadAction', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const result = await createSquadAction({ name: 'Test Squad', game: 'Valorant' })

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Not authenticated')
      expect(result.squad).toBeNull()
    })

    it('creates squad with correct data', async () => {
      const mockSquadData = {
        id: 'squad-1',
        name: 'Test Squad',
        game: 'Valorant',
        owner_id: 'user-1',
        invite_code: 'ABC123',
      }

      // Profile exists check
      const profileSelectSingle = vi.fn().mockResolvedValue({
        data: { id: 'user-1' },
        error: null,
      })

      // Squad insert chain: insert -> select -> single
      const squadSingle = vi.fn().mockResolvedValue({ data: mockSquadData, error: null })
      const squadSelect = vi.fn().mockReturnValue({ single: squadSingle })
      const squadInsert = vi.fn().mockReturnValue({ select: squadSelect })

      // Member insert
      const memberInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squads') {
          return {
            insert: squadInsert,
          }
        }
        if (table === 'squad_members') {
          return {
            insert: memberInsert,
          }
        }
        return {}
      })

      const result = await createSquadAction({ name: 'Test Squad', game: 'Valorant' })

      expect(result.error).toBeNull()
      expect(result.squad).toEqual(mockSquadData)
      expect(squadInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Squad',
          game: 'Valorant',
          owner_id: 'user-1',
        })
      )
    })

    it('adds owner as leader member', async () => {
      const mockSquadData = {
        id: 'squad-1',
        name: 'Test Squad',
        game: 'Valorant',
        owner_id: 'user-1',
        invite_code: 'XYZ789',
      }

      const profileSelectSingle = vi.fn().mockResolvedValue({
        data: { id: 'user-1' },
        error: null,
      })
      const squadSingle = vi.fn().mockResolvedValue({ data: mockSquadData, error: null })
      const squadSelect = vi.fn().mockReturnValue({ single: squadSingle })
      const squadInsert = vi.fn().mockReturnValue({ select: squadSelect })
      const memberInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squads') {
          return { insert: squadInsert }
        }
        if (table === 'squad_members') {
          return { insert: memberInsert }
        }
        return {}
      })

      await createSquadAction({ name: 'Test Squad', game: 'Valorant' })

      expect(memberInsert).toHaveBeenCalledWith({
        squad_id: 'squad-1',
        user_id: 'user-1',
        role: 'leader',
      })
    })

    it('ensures profile exists before creating squad', async () => {
      // Profile does NOT exist
      const profileSelectSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })
      const profileInsert = vi.fn().mockResolvedValue({ error: null })

      const mockSquadData = {
        id: 'squad-1',
        name: 'Test Squad',
        game: 'Valorant',
        owner_id: 'user-1',
        invite_code: 'DEF456',
      }
      const squadSingle = vi.fn().mockResolvedValue({ data: mockSquadData, error: null })
      const squadSelect = vi.fn().mockReturnValue({ single: squadSingle })
      const squadInsert = vi.fn().mockReturnValue({ select: squadSelect })
      const memberInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
            insert: profileInsert,
          }
        }
        if (table === 'squads') {
          return { insert: squadInsert }
        }
        if (table === 'squad_members') {
          return { insert: memberInsert }
        }
        return {}
      })

      const result = await createSquadAction({ name: 'Test Squad', game: 'Valorant' })

      expect(result.error).toBeNull()
      expect(profileInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          username: 'test',
        })
      )
    })
  })

  describe('joinSquadAction', () => {
    it('returns error for invalid invite code', async () => {
      // Profile exists
      const profileSelectSingle = vi.fn().mockResolvedValue({
        data: { id: 'user-1' },
        error: null,
      })

      // Squad not found
      const squadSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: squadSingle,
              }),
            }),
          }
        }
        return {}
      })

      const result = await joinSquadAction('INVALID')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe("Code d'invitation invalide")
    })

    it('returns error when already a member', async () => {
      const profileSelectSingle = vi.fn().mockResolvedValue({
        data: { id: 'user-1' },
        error: null,
      })

      // Squad found
      const squadSingle = vi.fn().mockResolvedValue({
        data: { id: 'squad-1' },
        error: null,
      })

      // Already a member
      const memberSingle = vi.fn().mockResolvedValue({
        data: { id: 'member-1' },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: squadSingle,
              }),
            }),
          }
        }
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: memberSingle,
                }),
              }),
            }),
          }
        }
        return {}
      })

      const result = await joinSquadAction('ABC123')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('déjà partie')
    })

    it('inserts new member with member role', async () => {
      const profileSelectSingle = vi.fn()
      // First call: ensureProfileExists check, Second call: get username for system message
      profileSelectSingle
        .mockResolvedValueOnce({ data: { id: 'user-1' }, error: null })
        .mockResolvedValueOnce({ data: { username: 'testuser' }, error: null })

      const squadSingle = vi.fn()
      // First call: find squad by invite code, Second call: get owner_id for challenge tracking
      squadSingle
        .mockResolvedValueOnce({ data: { id: 'squad-1' }, error: null })
        .mockResolvedValueOnce({ data: { owner_id: 'owner-1' }, error: null })

      const memberSingle = vi.fn().mockResolvedValue({ data: null, error: null })
      const memberInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: squadSingle,
              }),
            }),
          }
        }
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: memberSingle,
                }),
              }),
            }),
            insert: memberInsert,
          }
        }
        return {}
      })

      const result = await joinSquadAction('ABC123')

      expect(result.error).toBeNull()
      expect(memberInsert).toHaveBeenCalledWith({
        squad_id: 'squad-1',
        user_id: 'user-1',
        role: 'member',
      })
    })

    it('sends system message after joining', async () => {
      const profileSelectSingle = vi.fn()
      profileSelectSingle
        .mockResolvedValueOnce({ data: { id: 'user-1' }, error: null })
        .mockResolvedValueOnce({ data: { username: 'testuser' }, error: null })

      const squadSingle = vi.fn()
      squadSingle
        .mockResolvedValueOnce({ data: { id: 'squad-1' }, error: null })
        .mockResolvedValueOnce({ data: { owner_id: 'owner-1' }, error: null })

      const memberSingle = vi.fn().mockResolvedValue({ data: null, error: null })
      const memberInsert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: squadSingle,
              }),
            }),
          }
        }
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: memberSingle,
                }),
              }),
            }),
            insert: memberInsert,
          }
        }
        return {}
      })

      await joinSquadAction('ABC123')

      expect(mockSendMemberJoinedMessage).toHaveBeenCalledWith('squad-1', 'testuser')
    })
  })

  describe('leaveSquadAction', () => {
    it('deletes member record', async () => {
      const profileSelectSingle = vi.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      })

      const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null })
      const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq1 })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squad_members') {
          return {
            delete: mockDelete,
          }
        }
        return {}
      })

      const result = await leaveSquadAction('squad-1')

      expect(result.error).toBeNull()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockDeleteEq1).toHaveBeenCalledWith('squad_id', 'squad-1')
      expect(mockDeleteEq2).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('sends system message before leaving', async () => {
      const profileSelectSingle = vi.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      })

      const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null })
      const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq1 })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
          }
        }
        if (table === 'squad_members') {
          return {
            delete: mockDelete,
          }
        }
        return {}
      })

      await leaveSquadAction('squad-1')

      expect(mockSendMemberLeftMessage).toHaveBeenCalledWith('squad-1', 'testuser')
    })
  })
})
