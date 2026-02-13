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

import { usePremiumStore, FREE_SQUAD_LIMIT, FREE_HISTORY_DAYS } from '../usePremium'

describe('usePremiumStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      usePremiumStore.getState().reset()
    })
  })

  it('has correct initial state', () => {
    const state = usePremiumStore.getState()
    expect(state.hasPremium).toBe(false)
    expect(state.premiumSquads).toEqual([])
    expect(state.userSquadCount).toBe(0)
    expect(state.isLoading).toBe(false)
  })

  describe('canCreateSquad', () => {
    it('allows creation when under free limit', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: false,
          userSquadCount: 1,
        })
      })

      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })

    it('blocks creation when at free limit', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: false,
          userSquadCount: FREE_SQUAD_LIMIT,
        })
      })

      expect(usePremiumStore.getState().canCreateSquad()).toBe(false)
    })

    it('allows creation for premium users regardless of count', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: true,
          userSquadCount: 10,
        })
      })

      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })
  })

  describe('isSquadPremium', () => {
    it('returns true for premium squads', () => {
      act(() => {
        usePremiumStore.setState({
          premiumSquads: [{ squadId: 'squad-1', isPremium: true }],
        })
      })

      expect(usePremiumStore.getState().isSquadPremium('squad-1')).toBe(true)
    })

    it('returns false for non-premium squads', () => {
      act(() => {
        usePremiumStore.setState({
          premiumSquads: [{ squadId: 'squad-1', isPremium: false }],
        })
      })

      expect(usePremiumStore.getState().isSquadPremium('squad-1')).toBe(false)
    })

    it('returns false for unknown squads', () => {
      expect(usePremiumStore.getState().isSquadPremium('unknown')).toBe(false)
    })
  })

  describe('canAccessFeature', () => {
    it('grants access when user has premium', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: true })
      })

      expect(usePremiumStore.getState().canAccessFeature('unlimited_squads')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('hd_audio')).toBe(true)
    })

    it('denies access for free users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false })
      })

      expect(usePremiumStore.getState().canAccessFeature('unlimited_squads')).toBe(false)
    })

    it('grants access when squad is premium', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: false,
          premiumSquads: [{ squadId: 'squad-1', isPremium: true }],
        })
      })

      expect(usePremiumStore.getState().canAccessFeature('hd_audio', 'squad-1')).toBe(true)
    })

    it('denies access when squad is not premium', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: false,
          premiumSquads: [{ squadId: 'squad-1', isPremium: false }],
        })
      })

      expect(usePremiumStore.getState().canAccessFeature('hd_audio', 'squad-1')).toBe(false)
    })
  })

  describe('getSquadLimit', () => {
    it('returns free limit for non-premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false })
      })

      expect(usePremiumStore.getState().getSquadLimit()).toBe(FREE_SQUAD_LIMIT)
    })

    it('returns Infinity for premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: true })
      })

      expect(usePremiumStore.getState().getSquadLimit()).toBe(Infinity)
    })
  })

  describe('getHistoryDays', () => {
    it('returns free limit for non-premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false })
      })

      expect(usePremiumStore.getState().getHistoryDays()).toBe(FREE_HISTORY_DAYS)
    })

    it('returns Infinity for premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: true })
      })

      expect(usePremiumStore.getState().getHistoryDays()).toBe(Infinity)
    })
  })

  describe('reset', () => {
    it('resets all state to defaults', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: true,
          premiumSquads: [{ squadId: 'squad-1', isPremium: true }],
          userSquadCount: 5,
          isLoading: true,
        })
      })

      act(() => {
        usePremiumStore.getState().reset()
      })

      const state = usePremiumStore.getState()
      expect(state.hasPremium).toBe(false)
      expect(state.premiumSquads).toEqual([])
      expect(state.userSquadCount).toBe(0)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchPremiumStatus', () => {
    it('resets when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      const state = usePremiumStore.getState()
      expect(state.hasPremium).toBe(false)
      expect(state.userSquadCount).toBe(0)
      expect(state.isLoading).toBe(false)
    })

    it('checks memberships, squads, subscriptions and profile', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }, { squad_id: 'squad-2' }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'squads') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: 'squad-1', is_premium: true },
                  { id: 'squad-2', is_premium: false },
                ],
                error: null,
              }),
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_tier: 'free', subscription_expires_at: null },
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      const state = usePremiumStore.getState()
      expect(state.hasPremium).toBe(true) // squad-1 is premium
      expect(state.userSquadCount).toBe(2)
      expect(state.isLoading).toBe(false)
    })
  })
})
