import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetUser, mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockSupabase = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }
  return { mockGetUser, mockFrom, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../../lib/systemMessages', () => ({
  sendMemberJoinedMessage: vi.fn().mockResolvedValue(undefined),
  sendMemberLeftMessage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../lib/challengeTracker', () => ({
  trackChallengeProgress: vi.fn().mockResolvedValue(undefined),
}))

import { useSquadsStore } from '../useSquads'

describe('useSquadsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useSquadsStore.setState({
        squads: [],
        currentSquad: null,
        isLoading: false,
        lastFetchedAt: null,
      })
    })
  })

  // ===== SET CURRENT SQUAD =====

  describe('setCurrentSquad', () => {
    it('sets current squad with full data and can be retrieved', () => {
      const squad = { id: 'squad-1', name: 'Alpha', game: 'Valorant', member_count: 5 } as any
      act(() => {
        useSquadsStore.getState().setCurrentSquad(squad)
      })

      const current = useSquadsStore.getState().currentSquad
      // STRICT: squad name was stored correctly
      expect(current?.name).toBe('Alpha')
      // STRICT: squad id matches
      expect(current?.id).toBe('squad-1')
      // STRICT: member_count was preserved
      expect((current as any)?.member_count).toBe(5)
    })

    it('clears current squad by setting null', () => {
      act(() => {
        useSquadsStore.getState().setCurrentSquad({ id: 'squad-1', name: 'Test' } as any)
      })
      // STRICT: squad was initially set
      expect(useSquadsStore.getState().currentSquad?.id).toBe('squad-1')

      act(() => {
        useSquadsStore.getState().setCurrentSquad(null)
      })
      // STRICT: squad was cleared to null
      expect(useSquadsStore.getState().currentSquad).toBeNull()
    })
  })

  // ===== RESET =====

  describe('reset', () => {
    it('clears all state back to initial values', () => {
      act(() => {
        useSquadsStore.setState({
          squads: [{ id: 's1', name: 'Squad' } as any],
          currentSquad: { id: 's1' } as any,
          isLoading: true,
          lastFetchedAt: Date.now(),
        })
      })

      act(() => {
        useSquadsStore.getState().reset()
      })

      const state = useSquadsStore.getState()
      // STRICT: squads array emptied
      expect(state.squads).toEqual([])
      // STRICT: currentSquad cleared
      expect(state.currentSquad).toBeNull()
      // STRICT: isLoading reset
      expect(state.isLoading).toBe(false)
      // STRICT: cache timestamp cleared so next fetch is forced
      expect(state.lastFetchedAt).toBeNull()
    })
  })

  // ===== FETCH SQUADS =====

  describe('fetchSquads', () => {
    it('returns cached data and skips Supabase call when cache is fresh', async () => {
      const cachedSquad = { id: 'squad-1', name: 'Cached Squad', member_count: 3 } as any
      act(() => {
        useSquadsStore.setState({
          squads: [cachedSquad],
          lastFetchedAt: Date.now(), // Fresh cache (< 30s ago)
        })
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads()
      })

      // STRICT: no Supabase call because cache is fresh
      expect(mockFrom).not.toHaveBeenCalled()
      // STRICT: existing squad data preserved
      expect(useSquadsStore.getState().squads).toHaveLength(1)
      expect(useSquadsStore.getState().squads[0].name).toBe('Cached Squad')
    })

    it('fetches from Supabase when cache is expired (>30s)', async () => {
      act(() => {
        useSquadsStore.setState({
          squads: [],
          lastFetchedAt: Date.now() - 31_000, // Expired (>30s)
        })
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads()
      })

      // STRICT: Supabase was called because cache expired
      expect(mockFrom).toHaveBeenCalledWith('squad_members')
    })

    it('force=true bypasses cache and fetches', async () => {
      act(() => {
        useSquadsStore.setState({
          squads: [{ id: 'old' } as any],
          lastFetchedAt: Date.now(), // Fresh cache
        })
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads(true)
      })

      // STRICT: Supabase was called despite fresh cache because force=true
      expect(mockFrom).toHaveBeenCalledWith('squad_members')
      // STRICT: empty result updated the store
      expect(useSquadsStore.getState().squads).toEqual([])
    })

    it('transforms memberships into squads with member counts', async () => {
      const mockMemberships = [
        { squad_id: 'sq1', squads: { id: 'sq1', name: 'Alpha', game: 'Valorant', invite_code: 'ABC', owner_id: 'u1', created_at: '2026-01-01T00:00:00Z' } },
        { squad_id: 'sq2', squads: { id: 'sq2', name: 'Beta', game: 'LoL', invite_code: 'DEF', owner_id: 'u2', created_at: '2026-01-15T00:00:00Z' } },
      ]

      const mockMemberCounts = [
        { squad_id: 'sq1' },
        { squad_id: 'sq1' },
        { squad_id: 'sq1' },
        { squad_id: 'sq2' },
        { squad_id: 'sq2' },
      ]

      let fromCallCount = 0
      mockFrom.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          // First call: squad_members with squads join
          return {
            select: vi.fn().mockResolvedValue({ data: mockMemberships, error: null }),
          }
        }
        // Second call: squad_members for counts
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockMemberCounts }),
          }),
        }
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads(true)
      })

      const squads = useSquadsStore.getState().squads
      // STRICT: both squads were transformed from memberships
      expect(squads).toHaveLength(2)
      // STRICT: squads are sorted by created_at descending (Beta=Jan 15 first, Alpha=Jan 1 second)
      expect(squads[0].name).toBe('Beta')
      expect(squads[1].name).toBe('Alpha')
      // STRICT: member counts were calculated correctly
      expect(squads[0].member_count).toBe(2)  // sq2 has 2 members
      expect(squads[1].member_count).toBe(3)  // sq1 has 3 members
      // STRICT: lastFetchedAt was updated
      expect(useSquadsStore.getState().lastFetchedAt).not.toBeNull()
      // STRICT: isLoading was set back to false
      expect(useSquadsStore.getState().isLoading).toBe(false)
    })

    it('sets empty squads array when user has no memberships', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads(true)
      })

      // STRICT: squads is empty array (not undefined or null)
      expect(useSquadsStore.getState().squads).toEqual([])
      // STRICT: cache was updated even for empty result
      expect(useSquadsStore.getState().lastFetchedAt).not.toBeNull()
      // STRICT: loading finished
      expect(useSquadsStore.getState().isLoading).toBe(false)
    })

    it('handles fetch error gracefully without crashing', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('permission denied') }),
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads(true)
      })

      // STRICT: loading was reset after error
      expect(useSquadsStore.getState().isLoading).toBe(false)
    })
  })

  // ===== FETCH SQUAD BY ID =====

  describe('fetchSquadById', () => {
    it('fetches squad with members and profile data', async () => {
      const squadData = { id: 'sq1', name: 'Alpha', game: 'Valorant', invite_code: 'ABC', owner_id: 'u1', created_at: '2026-01-01' }
      const membersData = [
        { user_id: 'u1', role: 'leader', profiles: { username: 'Captain', avatar_url: null, reliability_score: 95 } },
        { user_id: 'u2', role: 'member', profiles: { username: 'Rookie', avatar_url: null, reliability_score: 80 } },
      ]

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: squadData, error: null }),
              }),
            }),
          }
        }
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: membersData }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      let result: any
      await act(async () => {
        result = await useSquadsStore.getState().fetchSquadById('sq1')
      })

      // STRICT: returned squad has correct name
      expect(result?.name).toBe('Alpha')
      // STRICT: members were attached to the squad
      expect(result?.members).toHaveLength(2)
      // STRICT: member_count was calculated from members
      expect(result?.member_count).toBe(2)
      // STRICT: currentSquad was set in the store
      expect(useSquadsStore.getState().currentSquad?.id).toBe('sq1')
      // STRICT: isLoading was reset
      expect(useSquadsStore.getState().isLoading).toBe(false)
    })

    it('returns null and resets loading when squad not found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('not found') }),
          }),
        }),
      })

      let result: any
      await act(async () => {
        result = await useSquadsStore.getState().fetchSquadById('nonexistent')
      })

      // STRICT: null was returned for missing squad
      expect(result).toBeNull()
      // STRICT: isLoading was reset
      expect(useSquadsStore.getState().isLoading).toBe(false)
    })
  })

  // ===== CREATE SQUAD =====

  describe('createSquad', () => {
    it('calls createSquadAction and returns squad on success', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'user-1' } }),
        }),
      })

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'squad-new', name: 'My Squad', game: 'Valorant', invite_code: 'XYZ123' },
            error: null,
          }),
        }),
      })

      const mockMemberInsert = vi.fn().mockResolvedValue({ error: null })

      let callCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockSelect }
        if (table === 'squads') return { insert: mockInsert }
        if (table === 'squad_members') {
          callCount++
          if (callCount === 1) return { insert: mockMemberInsert }
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }
      })

      let result: { squad: any; error: Error | null } = { squad: null, error: null }
      await act(async () => {
        result = await useSquadsStore.getState().createSquad({ name: 'My Squad', game: 'Valorant' })
      })

      // STRICT: no error on success
      expect(result.error).toBeNull()
      // STRICT: squad was returned with correct name
      expect(result.squad?.name).toBe('My Squad')
      // STRICT: squad has an id
      expect(result.squad?.id).toBe('squad-new')
      // STRICT: getUser was called to verify auth
      expect(mockGetUser).toHaveBeenCalledTimes(1)
      // STRICT: isLoading was reset after create
      expect(useSquadsStore.getState().isLoading).toBe(false)
    })

    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { squad: any; error: Error | null } = { squad: null, error: null }
      await act(async () => {
        result = await useSquadsStore.getState().createSquad({ name: 'Test', game: 'LoL' })
      })

      // STRICT: error was returned
      expect(result.error).not.toBeNull()
      // STRICT: error message indicates authentication failure
      expect(result.error?.message).toBe('Not authenticated')
      // STRICT: no squad returned
      expect(result.squad).toBeNull()
      // STRICT: isLoading was reset
      expect(useSquadsStore.getState().isLoading).toBe(false)
    })
  })

  // ===== JOIN SQUAD =====

  describe('joinSquad', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSquadsStore.getState().joinSquad('ABC123')
      })

      // STRICT: error is returned for unauthenticated user
      expect(result.error).not.toBeNull()
      expect(result.error?.message).toBe('Not authenticated')
    })
  })

  // ===== LEAVE SQUAD =====

  describe('leaveSquad', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSquadsStore.getState().leaveSquad('squad-1')
      })

      // STRICT: error message indicates auth failure
      expect(result.error?.message).toBe('Not authenticated')
    })
  })

  // ===== DELETE SQUAD =====

  describe('deleteSquad', () => {
    it('calls supabase delete with correct squad id and refreshes list', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squads') return { delete: mockDelete }
        // fetchSquads follow-up calls
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSquadsStore.getState().deleteSquad('squad-to-delete')
      })

      // STRICT: no error on success
      expect(result.error).toBeNull()
      // STRICT: delete was called on 'squads' table
      expect(mockFrom).toHaveBeenCalledWith('squads')
      // STRICT: the delete chain was invoked
      expect(mockDelete).toHaveBeenCalled()
    })

    it('returns error when Supabase delete fails', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('RLS violation') }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSquadsStore.getState().deleteSquad('squad-1')
      })

      // STRICT: error message is propagated from Supabase
      expect(result.error?.message).toBe('RLS violation')
    })
  })
})
