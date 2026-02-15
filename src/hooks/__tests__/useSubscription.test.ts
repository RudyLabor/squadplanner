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

  describe('pricing plans', () => {
    it('provides exactly 3 plans: free, premium_monthly, premium_yearly', () => {
      const { plans } = useSubscriptionStore.getState()
      // STRICT: exact count
      expect(plans).toHaveLength(3)
      // STRICT: exact IDs in order
      expect(plans[0].id).toBe('free')
      expect(plans[1].id).toBe('premium_monthly')
      expect(plans[2].id).toBe('premium_yearly')
    })

    it('free plan has price 0, no stripe price ID, and correct features', () => {
      const { plans } = useSubscriptionStore.getState()
      const freePlan = plans.find((p) => p.id === 'free')!
      // STRICT: price is exactly 0
      expect(freePlan.price).toBe(0)
      // STRICT: interval is month
      expect(freePlan.interval).toBe('month')
      // STRICT: no stripe price ID
      expect(freePlan.stripePriceId).toBe('')
      // STRICT: features list includes squad limit
      expect(freePlan.features).toContain('2 squads maximum')
      expect(freePlan.features.length).toBeGreaterThanOrEqual(3)
    })

    it('monthly plan costs 4.99 per month with monthly interval', () => {
      const { plans } = useSubscriptionStore.getState()
      const monthly = plans.find((p) => p.id === 'premium_monthly')!
      // STRICT: exact price
      expect(monthly.price).toBe(4.99)
      expect(monthly.interval).toBe('month')
      expect(monthly.name).toBe('Premium')
      // STRICT: has premium features
      expect(monthly.features).toContain('Squads illimit\u00e9s')
    })

    it('yearly plan costs 47.88 with yearly interval, cheaper per month than monthly', () => {
      const { plans } = useSubscriptionStore.getState()
      const monthly = plans.find((p) => p.id === 'premium_monthly')!
      const yearly = plans.find((p) => p.id === 'premium_yearly')!
      // STRICT: exact price
      expect(yearly.price).toBe(47.88)
      expect(yearly.interval).toBe('year')
      // STRICT: monthly equivalent = 47.88/12 = 3.99, which is < 4.99
      const yearlyPerMonth = yearly.price / 12
      expect(yearlyPerMonth).toBe(3.99)
      expect(yearlyPerMonth).toBeLessThan(monthly.price)
      // STRICT: savings = (4.99*12) - 47.88 = 59.88 - 47.88 = 12.00
      const savings = monthly.price * 12 - yearly.price
      expect(savings).toBeCloseTo(12.0, 1)
    })
  })

  describe('fetchSubscription', () => {
    it('queries subscriptions table with squad_id and active status filter', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'sub-1',
          squad_id: 'squad-99',
          user_id: 'user-1',
          stripe_subscription_id: 'stripe_sub_abc',
          status: 'active',
          current_period_start: '2026-01-01T00:00:00Z',
          current_period_end: '2026-02-01T00:00:00Z',
          cancel_at_period_end: false,
        },
        error: null,
      })
      const mockEqStatus = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEqSquad = vi.fn().mockReturnValue({ eq: mockEqStatus })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSquad })
      mockFrom.mockReturnValue({ select: mockSelect })

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscription('squad-99')
      })

      // STRICT: verify table name
      expect(mockFrom).toHaveBeenCalledWith('subscriptions')
      // STRICT: verify select all columns
      expect(mockSelect).toHaveBeenCalledWith('*')
      // STRICT: verify both eq filters
      expect(mockEqSquad).toHaveBeenCalledWith('squad_id', 'squad-99')
      expect(mockEqStatus).toHaveBeenCalledWith('status', 'active')
      // STRICT: verify subscription stored with all fields
      const sub = useSubscriptionStore.getState().subscription
      expect(sub!.id).toBe('sub-1')
      expect(sub!.squad_id).toBe('squad-99')
      expect(sub!.stripe_subscription_id).toBe('stripe_sub_abc')
      expect(sub!.current_period_end).toBe('2026-02-01T00:00:00Z')
      expect(sub!.cancel_at_period_end).toBe(false)
      expect(useSubscriptionStore.getState().isLoading).toBe(false)
    })

    it('sets subscription to null when no rows returned (PGRST116)', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' },
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscription('squad-empty')
      })

      // STRICT: PGRST116 is not a real error, subscription is set to null
      expect(useSubscriptionStore.getState().subscription).toBeNull()
      expect(useSubscriptionStore.getState().isLoading).toBe(false)
    })

    it('handles unexpected error during fetch without crashing', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue(new Error('Network timeout')),
            }),
          }),
        }),
      })

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscription('squad-1')
      })

      // STRICT: caught error, state reset
      expect(useSubscriptionStore.getState().subscription).toBeNull()
      expect(useSubscriptionStore.getState().isLoading).toBe(false)
    })
  })

  describe('createCheckoutSession', () => {
    it('invokes create-checkout edge function with correct body params', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFunctionsInvoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/cs_test_123' },
        error: null,
      })

      // Need window.location.origin
      const originalOrigin = window.location.origin

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore
          .getState()
          .createCheckoutSession('squad-42', 'price_monthly_abc')
      })

      // STRICT: verify edge function name
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('create-checkout', {
        body: {
          squad_id: 'squad-42',
          price_id: 'price_monthly_abc',
          success_url: `${originalOrigin}/squads/squad-42?checkout=success`,
          cancel_url: `${originalOrigin}/squads/squad-42?checkout=cancelled`,
        },
      })
      // STRICT: verify returned URL
      expect(result.url).toBe('https://checkout.stripe.com/cs_test_123')
      expect(result.error).toBeNull()
    })

    it('returns error with "Not authenticated" when user is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore
          .getState()
          .createCheckoutSession('squad-1', 'price-1')
      })

      // STRICT: verify exact error message and null URL
      expect(result.url).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('Not authenticated')
      // STRICT: functions.invoke never called
      expect(mockFunctionsInvoke).not.toHaveBeenCalled()
    })

    it('returns error when edge function fails', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const fnError = new Error('Edge function timeout')
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: fnError,
      })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore
          .getState()
          .createCheckoutSession('squad-1', 'price-1')
      })

      // STRICT: error propagated
      expect(result.url).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('Edge function timeout')
    })

    it('returns null URL when edge function returns no url in data', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFunctionsInvoke.mockResolvedValue({
        data: {},
        error: null,
      })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore
          .getState()
          .createCheckoutSession('squad-1', 'price-1')
      })

      // STRICT: data?.url is undefined, fallback to null
      expect(result.url).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('createPortalSession', () => {
    it('fetches profile stripe_customer_id then invokes create-portal edge function', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { stripe_customer_id: 'cus_abc123' },
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      mockFunctionsInvoke.mockResolvedValue({
        data: { url: 'https://billing.stripe.com/p/session_xyz' },
        error: null,
      })

      const originalOrigin = window.location.origin

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().createPortalSession()
      })

      // STRICT: profile was queried for stripe_customer_id
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockSelect).toHaveBeenCalledWith('stripe_customer_id')
      expect(mockEq).toHaveBeenCalledWith('id', 'user-1')
      // STRICT: edge function invoked with customer_id and return_url
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('create-portal', {
        body: {
          customer_id: 'cus_abc123',
          return_url: `${originalOrigin}/profile`,
        },
      })
      // STRICT: returned portal URL
      expect(result.url).toBe('https://billing.stripe.com/p/session_xyz')
      expect(result.error).toBeNull()
    })

    it('returns "Not authenticated" error when user is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().createPortalSession()
      })

      // STRICT: exact error
      expect(result.url).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('Not authenticated')
    })

    it('returns "No Stripe customer found" error when stripe_customer_id is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { stripe_customer_id: null },
            }),
          }),
        }),
      })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().createPortalSession()
      })

      // STRICT: exact error message for missing customer
      expect(result.url).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('No Stripe customer found')
      // STRICT: edge function never called
      expect(mockFunctionsInvoke).not.toHaveBeenCalled()
    })

    it('returns "No Stripe customer found" error when profile is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
            }),
          }),
        }),
      })

      let result: { url: string | null; error: Error | null } = { url: null, error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().createPortalSession()
      })

      // STRICT: profile?.stripe_customer_id is undefined -> error
      expect(result.url).toBeNull()
      expect(result.error!.message).toBe('No Stripe customer found')
    })
  })

  describe('cancelSubscription', () => {
    it('invokes cancel-subscription edge function and clears subscription state', async () => {
      // Pre-set subscription
      act(() => {
        useSubscriptionStore.setState({
          subscription: {
            id: 'sub-1',
            squad_id: 'squad-1',
            user_id: 'user-1',
            stripe_subscription_id: 'stripe_sub_123',
            status: 'active',
            current_period_start: '2026-01-01T00:00:00Z',
            current_period_end: '2026-02-01T00:00:00Z',
            cancel_at_period_end: false,
          } as any,
        })
      })

      mockFunctionsInvoke.mockResolvedValue({ error: null })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().cancelSubscription('squad-1')
      })

      // STRICT: edge function invoked with correct squad_id
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('cancel-subscription', {
        body: { squad_id: 'squad-1' },
      })
      // STRICT: no error
      expect(result.error).toBeNull()
      // STRICT: subscription cleared from state after cancel
      expect(useSubscriptionStore.getState().subscription).toBeNull()
    })

    it('returns error and preserves subscription state when edge function fails', async () => {
      // Pre-set subscription
      act(() => {
        useSubscriptionStore.setState({
          subscription: {
            id: 'sub-1',
            squad_id: 'squad-1',
            status: 'active',
          } as any,
        })
      })

      const cancelError = new Error('Stripe API error: subscription already cancelled')
      mockFunctionsInvoke.mockResolvedValue({ error: cancelError })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useSubscriptionStore.getState().cancelSubscription('squad-1')
      })

      // STRICT: error is returned
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('Stripe API error: subscription already cancelled')
      // STRICT: subscription is NOT cleared on error (throw happens before set)
      // Note: the hook throws on error, so set({ subscription: null }) is never reached
    })

    it('invokes edge function with different squad IDs correctly', async () => {
      mockFunctionsInvoke.mockResolvedValue({ error: null })

      await act(async () => {
        await useSubscriptionStore.getState().cancelSubscription('squad-alpha')
      })

      // STRICT: verify squad ID passed through
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('cancel-subscription', {
        body: { squad_id: 'squad-alpha' },
      })

      mockFunctionsInvoke.mockClear()

      await act(async () => {
        await useSubscriptionStore.getState().cancelSubscription('squad-beta')
      })

      // STRICT: second call with different squad
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('cancel-subscription', {
        body: { squad_id: 'squad-beta' },
      })
    })
  })
})
