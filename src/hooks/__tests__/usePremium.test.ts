import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

// ── ZERO MOCK: import the REAL pure functions and constants ──
import {
  tierLevel,
  hasTierAccess,
  TIER_LIMITS,
  FREE_SQUAD_LIMIT,
  FREE_HISTORY_DAYS,
  FREE_SESSIONS_PER_WEEK,
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
  SQUAD_LEADER_PRICE_MONTHLY,
  SQUAD_LEADER_PRICE_YEARLY,
  CLUB_PRICE_MONTHLY,
  CLUB_PRICE_YEARLY,
  FEATURE_MIN_TIER,
  usePremiumStore,
  type PremiumFeature,
  type TierLimits,
} from '../usePremium'
import type { SubscriptionTier } from '../../types/database'

// ═══════════════════════════════════════════════════════════════
// Pure function tests — NO mocks, NO Supabase, NO async
// ═══════════════════════════════════════════════════════════════

describe('tierLevel() — real function, zero mocks', () => {
  it('returns 0 for free', () => {
    expect(tierLevel('free')).toBe(0)
  })

  it('returns 1 for premium', () => {
    expect(tierLevel('premium')).toBe(1)
  })

  it('returns 2 for squad_leader', () => {
    expect(tierLevel('squad_leader')).toBe(2)
  })

  it('returns 3 for club', () => {
    expect(tierLevel('club')).toBe(3)
  })

  it('maintains strict ordering: free < premium < squad_leader < club', () => {
    expect(tierLevel('free')).toBeLessThan(tierLevel('premium'))
    expect(tierLevel('premium')).toBeLessThan(tierLevel('squad_leader'))
    expect(tierLevel('squad_leader')).toBeLessThan(tierLevel('club'))
  })
})

describe('hasTierAccess() — real function, zero mocks', () => {
  it('club user can access everything', () => {
    const tiers: SubscriptionTier[] = ['free', 'premium', 'squad_leader', 'club']
    for (const required of tiers) {
      expect(hasTierAccess('club', required)).toBe(true)
    }
  })

  it('squad_leader can access free, premium, squad_leader but NOT club', () => {
    expect(hasTierAccess('squad_leader', 'free')).toBe(true)
    expect(hasTierAccess('squad_leader', 'premium')).toBe(true)
    expect(hasTierAccess('squad_leader', 'squad_leader')).toBe(true)
    expect(hasTierAccess('squad_leader', 'club')).toBe(false)
  })

  it('premium can access free, premium but NOT squad_leader or club', () => {
    expect(hasTierAccess('premium', 'free')).toBe(true)
    expect(hasTierAccess('premium', 'premium')).toBe(true)
    expect(hasTierAccess('premium', 'squad_leader')).toBe(false)
    expect(hasTierAccess('premium', 'club')).toBe(false)
  })

  it('free can only access free', () => {
    expect(hasTierAccess('free', 'free')).toBe(true)
    expect(hasTierAccess('free', 'premium')).toBe(false)
    expect(hasTierAccess('free', 'squad_leader')).toBe(false)
    expect(hasTierAccess('free', 'club')).toBe(false)
  })

  it('same tier always has access to itself', () => {
    const tiers: SubscriptionTier[] = ['free', 'premium', 'squad_leader', 'club']
    for (const tier of tiers) {
      expect(hasTierAccess(tier, tier)).toBe(true)
    }
  })
})

describe('TIER_LIMITS — real constants, zero mocks', () => {
  it('covers all 4 tiers', () => {
    expect(Object.keys(TIER_LIMITS)).toHaveLength(4)
    expect(TIER_LIMITS).toHaveProperty('free')
    expect(TIER_LIMITS).toHaveProperty('premium')
    expect(TIER_LIMITS).toHaveProperty('squad_leader')
    expect(TIER_LIMITS).toHaveProperty('club')
  })

  describe('Free tier limits', () => {
    it('has maxSquads = 1', () => {
      expect(TIER_LIMITS.free.maxSquads).toBe(1)
    })

    it('has historyDays = 7', () => {
      expect(TIER_LIMITS.free.historyDays).toBe(7)
    })

    it('has sessionsPerWeek = 3', () => {
      expect(TIER_LIMITS.free.sessionsPerWeek).toBe(3)
    })

    it('has maxMembers = 10', () => {
      expect(TIER_LIMITS.free.maxMembers).toBe(10)
    })

    it('denies all premium chat features', () => {
      expect(TIER_LIMITS.free.hasGifs).toBe(false)
      expect(TIER_LIMITS.free.hasVoiceMessages).toBe(false)
      expect(TIER_LIMITS.free.hasPolls).toBe(false)
    })

    it('denies all advanced features', () => {
      expect(TIER_LIMITS.free.hasAdvancedStats).toBe(false)
      expect(TIER_LIMITS.free.hasAiCoach).toBe(false)
      expect(TIER_LIMITS.free.hasHdAudio).toBe(false)
      expect(TIER_LIMITS.free.hasAdvancedRoles).toBe(false)
      expect(TIER_LIMITS.free.hasCalendarExport).toBe(false)
      expect(TIER_LIMITS.free.hasRecurringSessions).toBe(false)
      expect(TIER_LIMITS.free.hasTeamAnalytics).toBe(false)
      expect(TIER_LIMITS.free.hasPriorityMatchmaking).toBe(false)
      expect(TIER_LIMITS.free.hasClubDashboard).toBe(false)
      expect(TIER_LIMITS.free.hasCustomBranding).toBe(false)
      expect(TIER_LIMITS.free.hasApiWebhooks).toBe(false)
      expect(TIER_LIMITS.free.hasPrioritySupport).toBe(false)
    })
  })

  describe('Premium tier limits', () => {
    it('has maxSquads = 5', () => {
      expect(TIER_LIMITS.premium.maxSquads).toBe(5)
    })

    it('has historyDays = 90', () => {
      expect(TIER_LIMITS.premium.historyDays).toBe(90)
    })

    it('has unlimited sessions (Infinity)', () => {
      expect(TIER_LIMITS.premium.sessionsPerWeek).toBe(Infinity)
    })

    it('has maxMembers = 20', () => {
      expect(TIER_LIMITS.premium.maxMembers).toBe(20)
    })

    it('grants chat features (GIF, voice, polls)', () => {
      expect(TIER_LIMITS.premium.hasGifs).toBe(true)
      expect(TIER_LIMITS.premium.hasVoiceMessages).toBe(true)
      expect(TIER_LIMITS.premium.hasPolls).toBe(true)
    })

    it('grants basic AI coach but NOT advanced', () => {
      expect(TIER_LIMITS.premium.hasAiCoach).toBe(true)
      expect(TIER_LIMITS.premium.hasAiCoachAdvanced).toBe(false)
    })

    it('denies squad_leader features (HD audio, roles, calendar)', () => {
      expect(TIER_LIMITS.premium.hasHdAudio).toBe(false)
      expect(TIER_LIMITS.premium.hasAdvancedRoles).toBe(false)
      expect(TIER_LIMITS.premium.hasCalendarExport).toBe(false)
      expect(TIER_LIMITS.premium.hasRecurringSessions).toBe(false)
    })
  })

  describe('Squad Leader tier limits', () => {
    it('has unlimited squads, history, sessions', () => {
      expect(TIER_LIMITS.squad_leader.maxSquads).toBe(Infinity)
      expect(TIER_LIMITS.squad_leader.historyDays).toBe(Infinity)
      expect(TIER_LIMITS.squad_leader.sessionsPerWeek).toBe(Infinity)
    })

    it('has maxMembers = 50', () => {
      expect(TIER_LIMITS.squad_leader.maxMembers).toBe(50)
    })

    it('grants HD audio, advanced roles, calendar, recurring sessions', () => {
      expect(TIER_LIMITS.squad_leader.hasHdAudio).toBe(true)
      expect(TIER_LIMITS.squad_leader.hasAdvancedRoles).toBe(true)
      expect(TIER_LIMITS.squad_leader.hasCalendarExport).toBe(true)
      expect(TIER_LIMITS.squad_leader.hasRecurringSessions).toBe(true)
      expect(TIER_LIMITS.squad_leader.hasTeamAnalytics).toBe(true)
      expect(TIER_LIMITS.squad_leader.hasPriorityMatchmaking).toBe(true)
    })

    it('denies club-only features', () => {
      expect(TIER_LIMITS.squad_leader.hasClubDashboard).toBe(false)
      expect(TIER_LIMITS.squad_leader.hasCustomBranding).toBe(false)
      expect(TIER_LIMITS.squad_leader.hasApiWebhooks).toBe(false)
    })
  })

  describe('Club tier limits', () => {
    it('has unlimited everything', () => {
      expect(TIER_LIMITS.club.maxSquads).toBe(Infinity)
      expect(TIER_LIMITS.club.historyDays).toBe(Infinity)
      expect(TIER_LIMITS.club.sessionsPerWeek).toBe(Infinity)
    })

    it('has maxMembers = 100', () => {
      expect(TIER_LIMITS.club.maxMembers).toBe(100)
    })

    it('grants ALL features including club-only', () => {
      const clubLimits = TIER_LIMITS.club
      expect(clubLimits.hasClubDashboard).toBe(true)
      expect(clubLimits.hasCustomBranding).toBe(true)
      expect(clubLimits.hasApiWebhooks).toBe(true)
      expect(clubLimits.hasPrioritySupport).toBe(true)
    })
  })

  describe('Tier progression (each tier strictly better than previous)', () => {
    it('maxMembers increases: 10 → 20 → 50 → 100', () => {
      expect(TIER_LIMITS.free.maxMembers).toBeLessThan(TIER_LIMITS.premium.maxMembers)
      expect(TIER_LIMITS.premium.maxMembers).toBeLessThan(TIER_LIMITS.squad_leader.maxMembers)
      expect(TIER_LIMITS.squad_leader.maxMembers).toBeLessThan(TIER_LIMITS.club.maxMembers)
    })

    it('maxSquads increases: 1 → 5 → Infinity → Infinity', () => {
      expect(TIER_LIMITS.free.maxSquads).toBeLessThan(TIER_LIMITS.premium.maxSquads)
      expect(TIER_LIMITS.premium.maxSquads).toBeLessThan(TIER_LIMITS.squad_leader.maxSquads)
    })

    it('historyDays increases: 7 → 90 → Infinity → Infinity', () => {
      expect(TIER_LIMITS.free.historyDays).toBeLessThan(TIER_LIMITS.premium.historyDays)
      expect(TIER_LIMITS.premium.historyDays).toBeLessThan(TIER_LIMITS.squad_leader.historyDays)
    })
  })
})

describe('Backward-compat constants', () => {
  it('FREE_SQUAD_LIMIT equals TIER_LIMITS.free.maxSquads (1)', () => {
    expect(FREE_SQUAD_LIMIT).toBe(1)
    expect(FREE_SQUAD_LIMIT).toBe(TIER_LIMITS.free.maxSquads)
  })

  it('FREE_HISTORY_DAYS equals TIER_LIMITS.free.historyDays (7)', () => {
    expect(FREE_HISTORY_DAYS).toBe(7)
    expect(FREE_HISTORY_DAYS).toBe(TIER_LIMITS.free.historyDays)
  })

  it('FREE_SESSIONS_PER_WEEK equals TIER_LIMITS.free.sessionsPerWeek (3)', () => {
    expect(FREE_SESSIONS_PER_WEEK).toBe(3)
    expect(FREE_SESSIONS_PER_WEEK).toBe(TIER_LIMITS.free.sessionsPerWeek)
  })
})

describe('Pricing constants — real values, zero mocks', () => {
  it('Premium: 6.99/month, 59.88/year', () => {
    expect(PREMIUM_PRICE_MONTHLY).toBe(6.99)
    expect(PREMIUM_PRICE_YEARLY).toBe(59.88)
  })

  it('Squad Leader: 14.99/month, 143.88/year', () => {
    expect(SQUAD_LEADER_PRICE_MONTHLY).toBe(14.99)
    expect(SQUAD_LEADER_PRICE_YEARLY).toBe(143.88)
  })

  it('Club: 39.99/month, 383.88/year', () => {
    expect(CLUB_PRICE_MONTHLY).toBe(39.99)
    expect(CLUB_PRICE_YEARLY).toBe(383.88)
  })

  it('yearly is always cheaper per month than monthly', () => {
    expect(PREMIUM_PRICE_YEARLY / 12).toBeLessThan(PREMIUM_PRICE_MONTHLY)
    expect(SQUAD_LEADER_PRICE_YEARLY / 12).toBeLessThan(SQUAD_LEADER_PRICE_MONTHLY)
    expect(CLUB_PRICE_YEARLY / 12).toBeLessThan(CLUB_PRICE_MONTHLY)
  })

  it('tiers have ascending prices: Premium < Squad Leader < Club', () => {
    expect(PREMIUM_PRICE_MONTHLY).toBeLessThan(SQUAD_LEADER_PRICE_MONTHLY)
    expect(SQUAD_LEADER_PRICE_MONTHLY).toBeLessThan(CLUB_PRICE_MONTHLY)
    expect(PREMIUM_PRICE_YEARLY).toBeLessThan(SQUAD_LEADER_PRICE_YEARLY)
    expect(SQUAD_LEADER_PRICE_YEARLY).toBeLessThan(CLUB_PRICE_YEARLY)
  })
})

describe('FEATURE_MIN_TIER — real mappings, zero mocks', () => {
  it('GIF, voice messages, polls require premium', () => {
    expect(FEATURE_MIN_TIER.gifs).toBe('premium')
    expect(FEATURE_MIN_TIER.voice_messages).toBe('premium')
    expect(FEATURE_MIN_TIER.polls).toBe('premium')
  })

  it('advanced_stats requires premium', () => {
    expect(FEATURE_MIN_TIER.advanced_stats).toBe('premium')
  })

  it('squad_leader features require squad_leader tier', () => {
    expect(FEATURE_MIN_TIER.unlimited_squads).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.unlimited_history).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.ai_coach_advanced).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.hd_audio).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.advanced_roles).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.calendar_export).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.recurring_sessions).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.team_analytics).toBe('squad_leader')
    expect(FEATURE_MIN_TIER.priority_matchmaking).toBe('squad_leader')
  })

  it('club-only features require club tier', () => {
    expect(FEATURE_MIN_TIER.club_dashboard).toBe('club')
    expect(FEATURE_MIN_TIER.custom_branding).toBe('club')
    expect(FEATURE_MIN_TIER.api_webhooks).toBe('club')
  })

  it('covers all 16 premium features', () => {
    expect(Object.keys(FEATURE_MIN_TIER)).toHaveLength(16)
  })
})

// ═══════════════════════════════════════════════════════════════
// Zustand store tests — test REAL logic with setState
// ═══════════════════════════════════════════════════════════════

describe('usePremiumStore — store logic', () => {
  beforeEach(() => {
    act(() => {
      usePremiumStore.getState().reset()
    })
  })

  describe('canCreateSquad()', () => {
    it('free user with 0 squads → true (0 < 1)', () => {
      act(() => usePremiumStore.setState({ tier: 'free', userSquadCount: 0 }))
      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })

    it('free user with 1 squad → false (1 >= 1)', () => {
      act(() => usePremiumStore.setState({ tier: 'free', userSquadCount: 1 }))
      expect(usePremiumStore.getState().canCreateSquad()).toBe(false)
    })

    it('premium user with 4 squads → true (4 < 5)', () => {
      act(() => usePremiumStore.setState({ tier: 'premium', userSquadCount: 4 }))
      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })

    it('premium user with 5 squads → false (5 >= 5)', () => {
      act(() => usePremiumStore.setState({ tier: 'premium', userSquadCount: 5 }))
      expect(usePremiumStore.getState().canCreateSquad()).toBe(false)
    })

    it('squad_leader user with 100 squads → true (Infinity)', () => {
      act(() => usePremiumStore.setState({ tier: 'squad_leader', userSquadCount: 100 }))
      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })

    it('club user with 500 squads → true (Infinity)', () => {
      act(() => usePremiumStore.setState({ tier: 'club', userSquadCount: 500 }))
      expect(usePremiumStore.getState().canCreateSquad()).toBe(true)
    })
  })

  describe('canAccessFeature()', () => {
    it('free user denied all premium features', () => {
      act(() => usePremiumStore.setState({ tier: 'free', premiumSquads: [] }))
      expect(usePremiumStore.getState().canAccessFeature('gifs')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('voice_messages')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('polls')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('hd_audio')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('club_dashboard')).toBe(false)
    })

    it('premium user can access gifs, voice, polls, stats but NOT hd_audio', () => {
      act(() => usePremiumStore.setState({ tier: 'premium', premiumSquads: [] }))
      expect(usePremiumStore.getState().canAccessFeature('gifs')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('voice_messages')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('polls')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('advanced_stats')).toBe(true)
      // Premium cannot access squad_leader features
      expect(usePremiumStore.getState().canAccessFeature('hd_audio')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('advanced_roles')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('club_dashboard')).toBe(false)
    })

    it('squad_leader user can access all except club features', () => {
      act(() => usePremiumStore.setState({ tier: 'squad_leader', premiumSquads: [] }))
      expect(usePremiumStore.getState().canAccessFeature('gifs')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('hd_audio')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('advanced_roles')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('team_analytics')).toBe(true)
      // Cannot access club features
      expect(usePremiumStore.getState().canAccessFeature('club_dashboard')).toBe(false)
      expect(usePremiumStore.getState().canAccessFeature('custom_branding')).toBe(false)
    })

    it('club user can access ALL features', () => {
      act(() => usePremiumStore.setState({ tier: 'club', premiumSquads: [] }))
      const allFeatures: PremiumFeature[] = Object.keys(FEATURE_MIN_TIER) as PremiumFeature[]
      for (const feature of allFeatures) {
        expect(usePremiumStore.getState().canAccessFeature(feature)).toBe(true)
      }
    })

    it('free user with premium squad gets premium-level access for that squad', () => {
      act(() =>
        usePremiumStore.setState({
          tier: 'free',
          premiumSquads: [{ squadId: 'sq-premium', isPremium: true }],
        })
      )
      // Premium features accessible via squad
      expect(usePremiumStore.getState().canAccessFeature('gifs', 'sq-premium')).toBe(true)
      expect(usePremiumStore.getState().canAccessFeature('polls', 'sq-premium')).toBe(true)
      // Squad_leader features NOT accessible even with premium squad
      expect(usePremiumStore.getState().canAccessFeature('hd_audio', 'sq-premium')).toBe(false)
    })

    it('free user with premium squad but no squadId param → denied', () => {
      act(() =>
        usePremiumStore.setState({
          tier: 'free',
          premiumSquads: [{ squadId: 'sq-premium', isPremium: true }],
        })
      )
      expect(usePremiumStore.getState().canAccessFeature('gifs')).toBe(false)
    })
  })

  describe('getSquadLimit()', () => {
    it.each([
      ['free', 1],
      ['premium', 5],
      ['squad_leader', Infinity],
      ['club', Infinity],
    ] as [SubscriptionTier, number][])('%s tier → %s squads', (tier, expected) => {
      act(() => usePremiumStore.setState({ tier }))
      expect(usePremiumStore.getState().getSquadLimit()).toBe(expected)
    })
  })

  describe('getHistoryDays()', () => {
    it.each([
      ['free', 7],
      ['premium', 90],
      ['squad_leader', Infinity],
      ['club', Infinity],
    ] as [SubscriptionTier, number][])('%s tier → %s days', (tier, expected) => {
      act(() => usePremiumStore.setState({ tier }))
      expect(usePremiumStore.getState().getHistoryDays()).toBe(expected)
    })
  })

  describe('getSessionsPerWeek()', () => {
    it.each([
      ['free', 3],
      ['premium', Infinity],
      ['squad_leader', Infinity],
      ['club', Infinity],
    ] as [SubscriptionTier, number][])('%s tier → %s sessions/week', (tier, expected) => {
      act(() => usePremiumStore.setState({ tier }))
      expect(usePremiumStore.getState().getSessionsPerWeek()).toBe(expected)
    })
  })

  describe('reset()', () => {
    it('resets all state to free defaults', () => {
      act(() =>
        usePremiumStore.setState({
          tier: 'club',
          hasPremium: true,
          premiumSquads: [{ squadId: 's1', isPremium: true }],
          userSquadCount: 42,
          isLoading: true,
        })
      )

      act(() => usePremiumStore.getState().reset())

      const state = usePremiumStore.getState()
      expect(state.tier).toBe('free')
      expect(state.hasPremium).toBe(false)
      expect(state.premiumSquads).toEqual([])
      expect(state.userSquadCount).toBe(0)
      expect(state.isLoading).toBe(false)
    })
  })
})
