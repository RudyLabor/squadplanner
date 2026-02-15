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

import {
  usePremiumStore,
  FREE_SQUAD_LIMIT,
  FREE_HISTORY_DAYS,
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
} from '../usePremium'

describe('usePremiumStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      usePremiumStore.getState().reset()
    })
  })

  describe('constants', () => {
    it('exports correct pricing and limit constants', () => {
      // STRICT: verify business-critical constants have exact values
      expect(FREE_SQUAD_LIMIT).toBe(2)
      expect(FREE_HISTORY_DAYS).toBe(30)
      expect(PREMIUM_PRICE_MONTHLY).toBe(4.99)
      expect(PREMIUM_PRICE_YEARLY).toBe(47.88)
      // STRICT: yearly is cheaper per month than monthly
      expect(PREMIUM_PRICE_YEARLY / 12).toBeLessThan(PREMIUM_PRICE_MONTHLY)
    })
  })

  describe('canCreateSquad', () => {
    it('returns true for free user with 0 squads (under limit of 2)', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false, userSquadCount: 0 })
      })

      // STRICT: 0 < FREE_SQUAD_LIMIT (2)
      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })

    it('returns true for free user with 1 squad (under limit of 2)', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false, userSquadCount: 1 })
      })

      // STRICT: 1 < 2
      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })

    it('returns false for free user at exactly the limit (2 squads)', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false, userSquadCount: FREE_SQUAD_LIMIT })
      })

      // STRICT: 2 < 2 is false, and hasPremium is false => false
      expect(usePremiumStore.getState().canCreateSquad()).toBe(false)
    })

    it('returns false for free user above the limit (5 squads)', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false, userSquadCount: 5 })
      })

      // STRICT: 5 < 2 is false
      expect(usePremiumStore.getState().canCreateSquad()).toBe(false)
    })

    it('returns true for premium user even when far above limit', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: true, userSquadCount: 100 })
      })

      // STRICT: hasPremium=true short-circuits, count irrelevant
      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })
  })

  describe('isSquadPremium', () => {
    it('returns true when squad has isPremium=true in premiumSquads array', () => {
      act(() => {
        usePremiumStore.setState({
          premiumSquads: [
            { squadId: 'squad-A', isPremium: true },
            { squadId: 'squad-B', isPremium: false },
          ],
        })
      })

      // STRICT: verify squad-A specifically
      expect(usePremiumStore.getState().isSquadPremium('squad-A')).toBe(true)
    })

    it('returns false when squad has isPremium=false in premiumSquads array', () => {
      act(() => {
        usePremiumStore.setState({
          premiumSquads: [
            { squadId: 'squad-A', isPremium: true },
            { squadId: 'squad-B', isPremium: false },
          ],
        })
      })

      // STRICT: squad-B is explicitly not premium
      expect(usePremiumStore.getState().isSquadPremium('squad-B')).toBe(false)
    })

    it('returns false for a squad ID not present in the premiumSquads array', () => {
      act(() => {
        usePremiumStore.setState({
          premiumSquads: [{ squadId: 'squad-A', isPremium: true }],
        })
      })

      // STRICT: .find returns undefined, || false kicks in
      expect(usePremiumStore.getState().isSquadPremium('squad-nonexistent')).toBe(false)
    })

    it('returns false when premiumSquads is empty', () => {
      // STRICT: empty array .find returns undefined
      expect(usePremiumStore.getState().isSquadPremium('any-id')).toBe(false)
    })
  })

  describe('canAccessFeature', () => {
    it('grants all features when hasPremium is true regardless of feature name', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: true, premiumSquads: [] })
      })

      // STRICT: test every known feature type
      expect(usePremiumStore.getState().canAccessFeature('unlimited_squads')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('unlimited_history')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('advanced_stats')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('ai_coach_advanced')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('hd_audio')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('advanced_roles')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('calendar_export')).toBe(true)
    })

    it('denies all features for free user without premium squad', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false, premiumSquads: [] })
      })

      // STRICT: every feature denied
      expect(usePremiumStore.getState().canAccessFeature('unlimited_squads')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('hd_audio')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('calendar_export')).toBe(false)
    })

    it('grants feature for free user when specific squadId is premium', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: false,
          premiumSquads: [{ squadId: 'squad-premium', isPremium: true }],
        })
      })

      // STRICT: passing the premium squad ID grants access
      expect(usePremiumStore.getState().canAccessFeature('hd_audio', 'squad-premium')).toBe(true)
    })

    it('denies feature for free user when specific squadId is not premium', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: false,
          premiumSquads: [{ squadId: 'squad-free', isPremium: false }],
        })
      })

      // STRICT: non-premium squad still denied
      expect(usePremiumStore.getState().canAccessFeature('hd_audio', 'squad-free')).toBe(false)
    })

    it('denies feature when squadId argument is not provided and user is not premium', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: false,
          premiumSquads: [{ squadId: 'squad-premium', isPremium: true }],
        })
      })

      // STRICT: without squadId param, can't check squad-level premium
      expect(usePremiumStore.getState().canAccessFeature('hd_audio')).toBe(false)
    })
  })

  describe('getSquadLimit', () => {
    it('returns FREE_SQUAD_LIMIT (2) for non-premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false })
      })

      // STRICT: exact value
      expect(usePremiumStore.getState().getSquadLimit()).toBe(2)
      expect(usePremiumStore.getState().getSquadLimit()).toBe(FREE_SQUAD_LIMIT)
    })

    it('returns Infinity for premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: true })
      })

      // STRICT: exactly Infinity, not a large number
      expect(usePremiumStore.getState().getSquadLimit()).toBe(Infinity)
    })
  })

  describe('getHistoryDays', () => {
    it('returns FREE_HISTORY_DAYS (30) for non-premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: false })
      })

      // STRICT: exact value
      expect(usePremiumStore.getState().getHistoryDays()).toBe(30)
      expect(usePremiumStore.getState().getHistoryDays()).toBe(FREE_HISTORY_DAYS)
    })

    it('returns Infinity for premium users', () => {
      act(() => {
        usePremiumStore.setState({ hasPremium: true })
      })

      // STRICT: exactly Infinity
      expect(usePremiumStore.getState().getHistoryDays()).toBe(Infinity)
    })
  })

  describe('reset', () => {
    it('clears all premium state back to defaults from any modified state', () => {
      act(() => {
        usePremiumStore.setState({
          hasPremium: true,
          premiumSquads: [
            { squadId: 'squad-1', isPremium: true },
            { squadId: 'squad-2', isPremium: true },
          ],
          userSquadCount: 15,
          isLoading: true,
        })
      })

      act(() => {
        usePremiumStore.getState().reset()
      })

      const state = usePremiumStore.getState()
      // STRICT: every field reset to its zero value
      expect(state.hasPremium).toBe(false)
      expect(state.premiumSquads).toEqual([])
      expect(state.userSquadCount).toBe(0)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchPremiumStatus', () => {
    it('resets to non-premium state when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      // Pre-set premium state to verify it gets cleared
      act(() => {
        usePremiumStore.setState({ hasPremium: true, userSquadCount: 5 })
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      const state = usePremiumStore.getState()
      // STRICT: all fields explicitly reset
      expect(state.hasPremium).toBe(false)
      expect(state.premiumSquads).toEqual([])
      expect(state.userSquadCount).toBe(0)
      expect(state.isLoading).toBe(false)
    })

    it('queries squad_members to get user squad count and IDs', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      const mockEq = vi.fn().mockResolvedValue({
        data: [{ squad_id: 'sq-1' }, { squad_id: 'sq-2' }, { squad_id: 'sq-3' }],
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') return { select: mockSelect }
        if (table === 'squads')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: 'sq-1', is_premium: false },
                  { id: 'sq-2', is_premium: false },
                  { id: 'sq-3', is_premium: false },
                ],
                error: null,
              }),
            }),
          }
        if (table === 'subscriptions')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_tier: 'free', subscription_expires_at: null },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      // STRICT: squad_members was queried
      expect(mockFrom).toHaveBeenCalledWith('squad_members')
      // STRICT: filtered by user_id
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
      // STRICT: userSquadCount reflects membership count
      expect(usePremiumStore.getState().userSquadCount).toBe(3)
    })

    it('detects premium from squads table is_premium flag', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }, { squad_id: 'squad-2' }],
                error: null,
              }),
            }),
          }
        if (table === 'squads')
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
        // hasPremium is already true so subscriptions won't be queried
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_tier: 'free', subscription_expires_at: null },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      const state = usePremiumStore.getState()
      // STRICT: hasPremium true because squad-1 is_premium
      expect(state.hasPremium).toBe(true)
      // STRICT: premiumSquads correctly mapped
      expect(state.premiumSquads).toHaveLength(2)
      const squad1 = state.premiumSquads.find((s) => s.squadId === 'squad-1')
      expect(squad1!.isPremium).toBe(true)
      const squad2 = state.premiumSquads.find((s) => s.squadId === 'squad-2')
      expect(squad2!.isPremium).toBe(false)
    })

    it('detects premium from active subscription when squads are not premium', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }],
                error: null,
              }),
            }),
          }
        if (table === 'squads')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'squad-1', is_premium: false }],
                error: null,
              }),
            }),
          }
        if (table === 'subscriptions')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ squad_id: 'squad-1' }],
                }),
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_tier: 'free', subscription_expires_at: null },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      const state = usePremiumStore.getState()
      // STRICT: premium detected via subscriptions table
      expect(state.hasPremium).toBe(true)
      // STRICT: the squad's premium status updated by subscription
      const squad1 = state.premiumSquads.find((s) => s.squadId === 'squad-1')
      expect(squad1!.isPremium).toBe(true)
    })

    it('detects premium from profile subscription_tier when squads and subscriptions are not premium', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      // Future expiration date
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }],
                error: null,
              }),
            }),
          }
        if (table === 'squads')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'squad-1', is_premium: false }],
                error: null,
              }),
            }),
          }
        if (table === 'subscriptions')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    subscription_tier: 'premium',
                    subscription_expires_at: futureDate,
                  },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      // STRICT: premium detected from profile tier with valid expiry
      expect(usePremiumStore.getState().hasPremium).toBe(true)
    })

    it('does NOT grant premium when profile subscription_tier is premium but expired', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      // Past expiration date
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }],
                error: null,
              }),
            }),
          }
        if (table === 'squads')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'squad-1', is_premium: false }],
                error: null,
              }),
            }),
          }
        if (table === 'subscriptions')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    subscription_tier: 'premium',
                    subscription_expires_at: pastDate,
                  },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      // STRICT: expired premium -> hasPremium stays false
      expect(usePremiumStore.getState().hasPremium).toBe(false)
    })

    it('grants premium when profile has premium tier with null expiry (no expiry)', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }],
                error: null,
              }),
            }),
          }
        if (table === 'squads')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'squad-1', is_premium: false }],
                error: null,
              }),
            }),
          }
        if (table === 'subscriptions')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    subscription_tier: 'premium',
                    subscription_expires_at: null,
                  },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      // STRICT: null expiry means never expires -> premium
      expect(usePremiumStore.getState().hasPremium).toBe(true)
    })

    it('handles squad_members query error gracefully without crashing', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'connection timeout', code: '57P01' },
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      // STRICT: error caught, isLoading reset, no crash
      expect(usePremiumStore.getState().isLoading).toBe(false)
    })

    it('skips subscriptions query when squads already has a premium squad', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      const tablesQueried: string[] = []
      mockFrom.mockImplementation((table: string) => {
        tablesQueried.push(table)
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }],
                error: null,
              }),
            }),
          }
        if (table === 'squads')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                // squad already premium
                data: [{ id: 'squad-1', is_premium: true }],
                error: null,
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_tier: 'free', subscription_expires_at: null },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      // STRICT: subscriptions table not queried because hasPremium was already true
      expect(tablesQueried).not.toContain('subscriptions')
      expect(usePremiumStore.getState().hasPremium).toBe(true)
    })

    it('handles zero squads user correctly (no squad-level queries)', async () => {
      const mockUser = { id: 'user-lonely' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_tier: 'free', subscription_expires_at: null },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      const state = usePremiumStore.getState()
      // STRICT: zero squads
      expect(state.userSquadCount).toBe(0)
      expect(state.premiumSquads).toEqual([])
      expect(state.hasPremium).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('merges subscription premium into existing premiumSquads correctly', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'squad_members')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ squad_id: 'squad-1' }, { squad_id: 'squad-2' }],
                error: null,
              }),
            }),
          }
        if (table === 'squads')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: 'squad-1', is_premium: false },
                  { id: 'squad-2', is_premium: false },
                ],
                error: null,
              }),
            }),
          }
        if (table === 'subscriptions')
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  // squad-1 has active subscription
                  data: [{ squad_id: 'squad-1' }],
                }),
              }),
            }),
          }
        if (table === 'profiles')
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_tier: 'free', subscription_expires_at: null },
                }),
              }),
            }),
          }
        return { select: vi.fn() }
      })

      await act(async () => {
        await usePremiumStore.getState().fetchPremiumStatus()
      })

      const state = usePremiumStore.getState()
      // STRICT: squad-1 was updated to premium via subscription merge
      const squad1 = state.premiumSquads.find((s) => s.squadId === 'squad-1')
      expect(squad1!.isPremium).toBe(true)
      // STRICT: squad-2 remains non-premium
      const squad2 = state.premiumSquads.find((s) => s.squadId === 'squad-2')
      expect(squad2!.isPremium).toBe(false)
      // STRICT: overall premium status
      expect(state.hasPremium).toBe(true)
    })
  })
})
