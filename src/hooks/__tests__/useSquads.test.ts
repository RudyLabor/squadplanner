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

  it('has correct initial state', () => {
    const state = useSquadsStore.getState()
    expect(state.squads).toEqual([])
    expect(state.currentSquad).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.lastFetchedAt).toBeNull()
  })

  describe('setCurrentSquad', () => {
    it('sets current squad', () => {
      const squad = { id: 'squad-1', name: 'Test Squad' } as any
      act(() => {
        useSquadsStore.getState().setCurrentSquad(squad)
      })
      expect(useSquadsStore.getState().currentSquad).toEqual(squad)
    })

    it('clears current squad', () => {
      act(() => {
        useSquadsStore.getState().setCurrentSquad({ id: 'squad-1' } as any)
      })
      act(() => {
        useSquadsStore.getState().setCurrentSquad(null)
      })
      expect(useSquadsStore.getState().currentSquad).toBeNull()
    })
  })

  describe('createSquad', () => {
    it('creates squad when authenticated', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      // Mock profile check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'user-1' } }),
        }),
      })

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'squad-new', name: 'New Squad', game: 'Valorant', invite_code: 'ABC123' },
            error: null,
          }),
        }),
      })

      const mockMemberInsert = vi.fn().mockResolvedValue({ error: null })

      let callCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { select: mockSelect }
        }
        if (table === 'squads') {
          return { insert: mockInsert }
        }
        if (table === 'squad_members') {
          callCount++
          if (callCount === 1) {
            return { insert: mockMemberInsert }
          }
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [] }),
              }),
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
        result = await useSquadsStore
          .getState()
          .createSquad({ name: 'New Squad', game: 'Valorant' })
      })

      expect(result.error).toBeNull()
      expect(result.squad).toBeTruthy()
      expect(result.squad.name).toBe('New Squad')
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { squad: any; error: Error | null } = { squad: null, error: null }
      await act(async () => {
        result = await useSquadsStore.getState().createSquad({ name: 'Test', game: 'LoL' })
      })

      expect(result.error).toBeTruthy()
      expect(result.squad).toBeNull()
    })
  })

  describe('joinSquad', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSquadsStore.getState().joinSquad('ABC123')
      })

      expect(result.error).toBeTruthy()
    })
  })

  describe('leaveSquad', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSquadsStore.getState().leaveSquad('squad-1')
      })

      expect(result.error).toBeTruthy()
    })
  })

  describe('deleteSquad', () => {
    it('deletes squad successfully', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
          in: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

      // Mock fetchSquads dependency
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSquadsStore.getState().deleteSquad('squad-1')
      })

      expect(result.error).toBeNull()
    })
  })

  describe('fetchSquads', () => {
    it('returns cached data when not expired', async () => {
      act(() => {
        useSquadsStore.setState({
          squads: [{ id: 'squad-1', name: 'Cached' }] as any,
          lastFetchedAt: Date.now(),
        })
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads()
      })

      // Should not have called supabase because cache is fresh
      expect(mockFrom).not.toHaveBeenCalled()
      expect(useSquadsStore.getState().squads).toHaveLength(1)
    })

    it('fetches when cache is expired', async () => {
      act(() => {
        useSquadsStore.setState({
          squads: [],
          lastFetchedAt: Date.now() - 60000, // Expired
        })
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads()
      })

      expect(mockFrom).toHaveBeenCalled()
    })

    it('force fetches regardless of cache', async () => {
      act(() => {
        useSquadsStore.setState({
          squads: [{ id: 'squad-1' }] as any,
          lastFetchedAt: Date.now(),
        })
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      await act(async () => {
        await useSquadsStore.getState().fetchSquads(true)
      })

      expect(mockFrom).toHaveBeenCalled()
    })
  })
})
