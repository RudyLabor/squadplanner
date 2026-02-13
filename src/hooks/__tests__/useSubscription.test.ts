import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

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

import { useSubscriptionStore } from '../useSubscription'

describe('useSubscriptionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useSubscriptionStore.setState({
        subscription: null,
        isLoading: false,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useSubscriptionStore.getState()
    expect(state.subscription).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.plans).toBeTruthy()
    expect(state.plans.length).toBeGreaterThan(0)
  })

  it('has three pricing plans', () => {
    const { plans } = useSubscriptionStore.getState()
    expect(plans).toHaveLength(3)
    expect(plans[0].id).toBe('free')
    expect(plans[1].id).toBe('premium_monthly')
    expect(plans[2].id).toBe('premium_yearly')
  })

  it('free plan has price 0', () => {
    const { plans } = useSubscriptionStore.getState()
    const freePlan = plans.find((p) => p.id === 'free')
    expect(freePlan!.price).toBe(0)
  })

  it('yearly plan is cheaper per month than monthly', () => {
    const { plans } = useSubscriptionStore.getState()
    const monthly = plans.find((p) => p.id === 'premium_monthly')!
    const yearly = plans.find((p) => p.id === 'premium_yearly')!
    const yearlyPerMonth = yearly.price / 12
    expect(yearlyPerMonth).toBeLessThan(monthly.price)
  })

  describe('fetchSubscription', () => {
    it('fetches active subscription for a squad', async () => {
      const mockSub = {
        id: 'sub-1',
        squad_id: 'squad-1',
        status: 'active',
        stripe_subscription_id: 'stripe-123',
      }

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockSub, error: null }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscription('squad-1')
      })

      expect(useSubscriptionStore.getState().subscription).toEqual(mockSub)
      expect(useSubscriptionStore.getState().isLoading).toBe(false)
    })

    it('sets null when no subscription found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscription('squad-1')
      })

      expect(useSubscriptionStore.getState().subscription).toBeNull()
      expect(useSubscriptionStore.getState().isLoading).toBe(false)
    })
  })

  describe('createCheckoutSession', () => {
    it('creates checkout session when authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFunctionsInvoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/session-123' },
        error: null,
      })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore
          .getState()
          .createCheckoutSession('squad-1', 'price-monthly')
      })

      expect(result.url).toBe('https://checkout.stripe.com/session-123')
      expect(result.error).toBeNull()
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore
          .getState()
          .createCheckoutSession('squad-1', 'price-monthly')
      })

      expect(result.url).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('createPortalSession', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().createPortalSession()
      })

      expect(result.url).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('returns error when no stripe customer', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: null } }),
          }),
        }),
      })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().createPortalSession()
      })

      expect(result.url).toBeNull()
      expect(result.error?.message).toBe('No Stripe customer found')
    })
  })

  describe('cancelSubscription', () => {
    it('cancels subscription successfully', async () => {
      act(() => {
        useSubscriptionStore.setState({
          subscription: { id: 'sub-1', squad_id: 'squad-1' } as any,
        })
      })

      mockFunctionsInvoke.mockResolvedValue({ error: null })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().cancelSubscription('squad-1')
      })

      expect(result.error).toBeNull()
      expect(useSubscriptionStore.getState().subscription).toBeNull()
    })

    it('returns error on failure', async () => {
      mockFunctionsInvoke.mockResolvedValue({ error: new Error('Cancel failed') })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().cancelSubscription('squad-1')
      })

      expect(result.error).toBeTruthy()
    })
  })
})
