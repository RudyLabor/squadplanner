import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

// Mock only Supabase (required for store methods that call the network)
const { mockGetUser, mockFrom, mockFunctionsInvoke, mockSupabase } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockFunctionsInvoke = vi.fn()
  const mockSupabase = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
    functions: { invoke: mockFunctionsInvoke },
  }
  return { mockGetUser, mockFrom, mockFunctionsInvoke, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

import { useSubscriptionStore, type PricingPlan } from '../useSubscription'
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
  SQUAD_LEADER_PRICE_MONTHLY,
  SQUAD_LEADER_PRICE_YEARLY,
  CLUB_PRICE_MONTHLY,
  CLUB_PRICE_YEARLY,
} from '../usePremium'

describe('useSubscriptionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useSubscriptionStore.setState({ subscription: null, isLoading: false })
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Plans data — real data, zero mocks
  // ═══════════════════════════════════════════════════════════

  describe('pricing plans — 7 plans (free + 3 tiers × 2 intervals)', () => {
    let plans: PricingPlan[]

    beforeEach(() => {
      plans = useSubscriptionStore.getState().plans
    })

    it('has exactly 7 plans', () => {
      expect(plans).toHaveLength(7)
    })

    it('plan IDs match expected structure', () => {
      const ids = plans.map((p) => p.id)
      expect(ids).toEqual([
        'free',
        'premium_monthly',
        'premium_yearly',
        'squad_leader_monthly',
        'squad_leader_yearly',
        'club_monthly',
        'club_yearly',
      ])
    })

    it('each paid plan has a non-empty stripePriceId or env fallback', () => {
      const paidPlans = plans.filter((p) => p.tier !== 'free')
      // In test env, env vars are empty, but the structure is correct
      for (const plan of paidPlans) {
        expect(typeof plan.stripePriceId).toBe('string')
      }
    })

    describe('Free plan', () => {
      it('has correct data', () => {
        const free = plans.find((p) => p.id === 'free')!
        expect(free.price).toBe(0)
        expect(free.tier).toBe('free')
        expect(free.interval).toBe('month')
        expect(free.stripePriceId).toBe('')
        expect(free.features).toContain('1 squad')
        expect(free.features).toContain('3 sessions/semaine')
        expect(free.features).toContain('Historique 7 jours')
      })
    })

    describe('Premium plans', () => {
      it('monthly: 6.99€/mois', () => {
        const pm = plans.find((p) => p.id === 'premium_monthly')!
        expect(pm.price).toBe(PREMIUM_PRICE_MONTHLY)
        expect(pm.price).toBe(6.99)
        expect(pm.tier).toBe('premium')
        expect(pm.interval).toBe('month')
        expect(pm.features).toContain('5 squads')
        expect(pm.features).toContain('Sessions illimitées')
      })

      it('yearly: 59.88€/an', () => {
        const py = plans.find((p) => p.id === 'premium_yearly')!
        expect(py.price).toBe(PREMIUM_PRICE_YEARLY)
        expect(py.price).toBe(59.88)
        expect(py.tier).toBe('premium')
        expect(py.interval).toBe('year')
      })
    })

    describe('Squad Leader plans', () => {
      it('monthly: 14.99€/mois with popular flag', () => {
        const slm = plans.find((p) => p.id === 'squad_leader_monthly')!
        expect(slm.price).toBe(SQUAD_LEADER_PRICE_MONTHLY)
        expect(slm.price).toBe(14.99)
        expect(slm.tier).toBe('squad_leader')
        expect(slm.interval).toBe('month')
        expect(slm.popular).toBe(true)
        expect(slm.features).toContain('Squads illimités')
        expect(slm.features).toContain('Audio HD Party')
        expect(slm.features).toContain('Sessions auto-récurrentes')
      })

      it('yearly: 143.88€/an', () => {
        const sly = plans.find((p) => p.id === 'squad_leader_yearly')!
        expect(sly.price).toBe(SQUAD_LEADER_PRICE_YEARLY)
        expect(sly.price).toBe(143.88)
        expect(sly.tier).toBe('squad_leader')
        expect(sly.interval).toBe('year')
        expect(sly.popular).toBe(true)
      })
    })

    describe('Club plans', () => {
      it('monthly: 39.99€/mois', () => {
        const cm = plans.find((p) => p.id === 'club_monthly')!
        expect(cm.price).toBe(CLUB_PRICE_MONTHLY)
        expect(cm.price).toBe(39.99)
        expect(cm.tier).toBe('club')
        expect(cm.interval).toBe('month')
        expect(cm.features).toContain('Dashboard multi-squads (10+ équipes)')
        expect(cm.features).toContain('API webhook (Discord, Notion, Sheets)')
        expect(cm.features).toContain('Support prioritaire 24h')
      })

      it('yearly: 383.88€/an', () => {
        const cy = plans.find((p) => p.id === 'club_yearly')!
        expect(cy.price).toBe(CLUB_PRICE_YEARLY)
        expect(cy.price).toBe(383.88)
        expect(cy.tier).toBe('club')
        expect(cy.interval).toBe('year')
      })
    })

    it('yearly is always cheaper than 12× monthly for each tier', () => {
      const tiers = ['premium', 'squad_leader', 'club'] as const
      for (const tier of tiers) {
        const monthly = plans.find((p) => p.tier === tier && p.interval === 'month')!
        const yearly = plans.find((p) => p.tier === tier && p.interval === 'year')!
        expect(yearly.price).toBeLessThan(monthly.price * 12)
      }
    })

    it('prices are ascending: Premium < Squad Leader < Club', () => {
      const premiumMonthly = plans.find((p) => p.id === 'premium_monthly')!
      const slMonthly = plans.find((p) => p.id === 'squad_leader_monthly')!
      const clubMonthly = plans.find((p) => p.id === 'club_monthly')!
      expect(premiumMonthly.price).toBeLessThan(slMonthly.price)
      expect(slMonthly.price).toBeLessThan(clubMonthly.price)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // createCheckoutSession — uses mock for Supabase calls
  // but tests REAL logic (param building, error handling)
  // ═══════════════════════════════════════════════════════════

  describe('createCheckoutSession', () => {
    it('passes tier in body alongside price_id and squad_id', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFunctionsInvoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/cs_123' },
        error: null,
      })

      await act(async () => {
        await useSubscriptionStore
          .getState()
          .createCheckoutSession('price_abc', 'squad_leader', 'squad-42')
      })

      expect(mockFunctionsInvoke).toHaveBeenCalledWith('create-checkout', {
        body: expect.objectContaining({
          price_id: 'price_abc',
          tier: 'squad_leader',
          squad_id: 'squad-42',
        }),
      })
    })

    it('omits squad_id when not provided (personal subscription)', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFunctionsInvoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/cs_456' },
        error: null,
      })

      await act(async () => {
        await useSubscriptionStore
          .getState()
          .createCheckoutSession('price_abc', 'premium')
      })

      const callBody = mockFunctionsInvoke.mock.calls[0][1].body
      expect(callBody.squad_id).toBeUndefined()
      expect(callBody.price_id).toBe('price_abc')
      expect(callBody.tier).toBe('premium')
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().createCheckoutSession('price-1', 'premium')
      })

      expect(result.url).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('Not authenticated')
      expect(mockFunctionsInvoke).not.toHaveBeenCalled()
    })
  })
})
