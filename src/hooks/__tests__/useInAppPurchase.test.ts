import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

// Mock Supabase (same pattern as useSubscription.test.ts)
const { mockGetUser, mockFunctionsInvoke, mockSupabase } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFunctionsInvoke = vi.fn()
  const mockSupabase = {
    auth: { getUser: mockGetUser },
    from: vi.fn(),
    functions: { invoke: mockFunctionsInvoke },
  }
  return { mockGetUser, mockFunctionsInvoke, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

import {
  useInAppPurchaseStore,
  IOS_PRODUCTS,
  ANDROID_PRODUCTS,
  IAP_PRICES,
  getTierFromProductKey,
  type IAPProductKey,
} from '../useInAppPurchase'

import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
  SQUAD_LEADER_PRICE_MONTHLY,
  SQUAD_LEADER_PRICE_YEARLY,
} from '../usePremium'

describe('useInAppPurchaseStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useInAppPurchaseStore.setState({
        status: 'idle',
        error: null,
        activeTier: null,
      })
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Platform detection
  // ═══════════════════════════════════════════════════════════

  describe('platform detection', () => {
    it('detects non-native platform in test environment', () => {
      const state = useInAppPurchaseStore.getState()
      // In test env, Capacitor is not available
      expect(state.isNative).toBe(false)
      expect(state.platform).toBeNull()
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Product IDs mapping
  // ═══════════════════════════════════════════════════════════

  describe('iOS product IDs', () => {
    it('has exactly 4 products', () => {
      expect(Object.keys(IOS_PRODUCTS)).toHaveLength(4)
    })

    it('uses reverse-DNS format for iOS', () => {
      expect(IOS_PRODUCTS.premium_monthly).toBe('fr.squadplanner.premium.monthly')
      expect(IOS_PRODUCTS.premium_yearly).toBe('fr.squadplanner.premium.yearly')
      expect(IOS_PRODUCTS.squad_leader_monthly).toBe('fr.squadplanner.squadleader.monthly')
      expect(IOS_PRODUCTS.squad_leader_yearly).toBe('fr.squadplanner.squadleader.yearly')
    })

    it('all iOS product IDs start with fr.squadplanner', () => {
      for (const id of Object.values(IOS_PRODUCTS)) {
        expect(id).toMatch(/^fr\.squadplanner\./)
      }
    })
  })

  describe('Android product IDs', () => {
    it('has exactly 4 products', () => {
      expect(Object.keys(ANDROID_PRODUCTS)).toHaveLength(4)
    })

    it('uses snake_case format for Android', () => {
      expect(ANDROID_PRODUCTS.premium_monthly).toBe('premium_monthly')
      expect(ANDROID_PRODUCTS.premium_yearly).toBe('premium_yearly')
      expect(ANDROID_PRODUCTS.squad_leader_monthly).toBe('squad_leader_monthly')
      expect(ANDROID_PRODUCTS.squad_leader_yearly).toBe('squad_leader_yearly')
    })
  })

  describe('iOS and Android have matching keys', () => {
    it('same set of product keys', () => {
      const iosKeys = Object.keys(IOS_PRODUCTS).sort()
      const androidKeys = Object.keys(ANDROID_PRODUCTS).sort()
      expect(iosKeys).toEqual(androidKeys)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Pricing constants
  // ═══════════════════════════════════════════════════════════

  describe('IAP prices', () => {
    it('has 4 price entries', () => {
      expect(Object.keys(IAP_PRICES)).toHaveLength(4)
    })

    it('matches Stripe pricing', () => {
      expect(IAP_PRICES.premium_monthly).toBe(PREMIUM_PRICE_MONTHLY)
      expect(IAP_PRICES.premium_monthly).toBe(6.99)
      expect(IAP_PRICES.premium_yearly).toBe(PREMIUM_PRICE_YEARLY)
      expect(IAP_PRICES.premium_yearly).toBe(59.88)
      expect(IAP_PRICES.squad_leader_monthly).toBe(SQUAD_LEADER_PRICE_MONTHLY)
      expect(IAP_PRICES.squad_leader_monthly).toBe(14.99)
      expect(IAP_PRICES.squad_leader_yearly).toBe(SQUAD_LEADER_PRICE_YEARLY)
      expect(IAP_PRICES.squad_leader_yearly).toBe(143.88)
    })

    it('yearly is cheaper than 12x monthly for each tier', () => {
      expect(IAP_PRICES.premium_yearly).toBeLessThan(IAP_PRICES.premium_monthly * 12)
      expect(IAP_PRICES.squad_leader_yearly).toBeLessThan(IAP_PRICES.squad_leader_monthly * 12)
    })

    it('Squad Leader is more expensive than Premium', () => {
      expect(IAP_PRICES.squad_leader_monthly).toBeGreaterThan(IAP_PRICES.premium_monthly)
      expect(IAP_PRICES.squad_leader_yearly).toBeGreaterThan(IAP_PRICES.premium_yearly)
    })

    it('does NOT include club tier (web-only B2B)', () => {
      expect(IAP_PRICES).not.toHaveProperty('club_monthly')
      expect(IAP_PRICES).not.toHaveProperty('club_yearly')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Tier mapping from product key
  // ═══════════════════════════════════════════════════════════

  describe('getTierFromProductKey', () => {
    it('maps premium products to premium tier', () => {
      expect(getTierFromProductKey('premium_monthly')).toBe('premium')
      expect(getTierFromProductKey('premium_yearly')).toBe('premium')
    })

    it('maps squad_leader products to squad_leader tier', () => {
      expect(getTierFromProductKey('squad_leader_monthly')).toBe('squad_leader')
      expect(getTierFromProductKey('squad_leader_yearly')).toBe('squad_leader')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Initial store state
  // ═══════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('starts with idle status', () => {
      const state = useInAppPurchaseStore.getState()
      expect(state.status).toBe('idle')
    })

    it('starts with no error', () => {
      const state = useInAppPurchaseStore.getState()
      expect(state.error).toBeNull()
    })

    it('starts with no active tier', () => {
      const state = useInAppPurchaseStore.getState()
      expect(state.activeTier).toBeNull()
    })

    it('has purchase function', () => {
      const state = useInAppPurchaseStore.getState()
      expect(typeof state.purchase).toBe('function')
    })

    it('has restorePurchases function', () => {
      const state = useInAppPurchaseStore.getState()
      expect(typeof state.restorePurchases).toBe('function')
    })

    it('has reset function', () => {
      const state = useInAppPurchaseStore.getState()
      expect(typeof state.reset).toBe('function')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Purchase on non-native (web) returns error
  // ═══════════════════════════════════════════════════════════

  describe('purchase on web platform', () => {
    it('returns error when not on native platform', async () => {
      let result = { success: false, error: null as string | null }
      await act(async () => {
        result = await useInAppPurchaseStore.getState().purchase('premium_monthly')
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('IAP is only available on native platforms')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Restore on non-native (web) returns error
  // ═══════════════════════════════════════════════════════════

  describe('restorePurchases on web platform', () => {
    it('returns error when not on native platform', async () => {
      let result = { success: false, tier: null as string | null, error: null as string | null }
      await act(async () => {
        result = await useInAppPurchaseStore.getState().restorePurchases()
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('uniquement disponible sur mobile')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Reset
  // ═══════════════════════════════════════════════════════════

  describe('reset', () => {
    it('resets state to initial values', () => {
      act(() => {
        useInAppPurchaseStore.setState({
          status: 'error',
          error: 'Some error',
          activeTier: 'premium',
        })
      })

      act(() => {
        useInAppPurchaseStore.getState().reset()
      })

      const state = useInAppPurchaseStore.getState()
      expect(state.status).toBe('idle')
      expect(state.error).toBeNull()
      expect(state.activeTier).toBeNull()
    })
  })
})
