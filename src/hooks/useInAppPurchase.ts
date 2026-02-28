import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import type { SubscriptionTier } from '../types/database'
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
  SQUAD_LEADER_PRICE_MONTHLY,
  SQUAD_LEADER_PRICE_YEARLY,
} from './usePremium'

// ── Platform detection ──────────────────────────────────────────
const isNativePlatform = !!(globalThis as any).Capacitor?.isNativePlatform?.()

function getNativePlatform(): 'ios' | 'android' | null {
  if (!isNativePlatform) return null
  const cap = (globalThis as any).Capacitor
  const platform = cap?.getPlatform?.()
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return 'android'
  return null
}

// ── IAP Product IDs per platform ────────────────────────────────
export const IOS_PRODUCTS = {
  premium_monthly: 'fr.squadplanner.premium.monthly',
  premium_yearly: 'fr.squadplanner.premium.yearly',
  squad_leader_monthly: 'fr.squadplanner.squadleader.monthly',
  squad_leader_yearly: 'fr.squadplanner.squadleader.yearly',
} as const

export const ANDROID_PRODUCTS = {
  premium_monthly: 'premium_monthly',
  premium_yearly: 'premium_yearly',
  squad_leader_monthly: 'squad_leader_monthly',
  squad_leader_yearly: 'squad_leader_yearly',
} as const

export type IAPProductKey = keyof typeof IOS_PRODUCTS

// ── Pricing (same as Stripe, for display on native) ─────────────
export const IAP_PRICES: Record<IAPProductKey, number> = {
  premium_monthly: PREMIUM_PRICE_MONTHLY,
  premium_yearly: PREMIUM_PRICE_YEARLY,
  squad_leader_monthly: SQUAD_LEADER_PRICE_MONTHLY,
  squad_leader_yearly: SQUAD_LEADER_PRICE_YEARLY,
}

// ── Map product key -> subscription tier ────────────────────────
export function getTierFromProductKey(productKey: IAPProductKey): SubscriptionTier {
  if (productKey.startsWith('squad_leader')) return 'squad_leader'
  if (productKey.startsWith('premium')) return 'premium'
  return 'free'
}

// ── Map native product ID -> product key ────────────────────────
function getProductKeyFromNativeId(productId: string): IAPProductKey | null {
  // Check iOS products
  for (const [key, id] of Object.entries(IOS_PRODUCTS)) {
    if (id === productId) return key as IAPProductKey
  }
  // Check Android products
  for (const [key, id] of Object.entries(ANDROID_PRODUCTS)) {
    if (id === productId) return key as IAPProductKey
  }
  return null
}

// Get the correct product ID for the current platform
function getPlatformProductId(productKey: IAPProductKey): string {
  const platform = getNativePlatform()
  if (platform === 'ios') return IOS_PRODUCTS[productKey]
  if (platform === 'android') return ANDROID_PRODUCTS[productKey]
  return productKey
}

// ── Store state ─────────────────────────────────────────────────
export type IAPStatus = 'idle' | 'loading' | 'purchasing' | 'purchased' | 'restored' | 'error'

interface IAPState {
  status: IAPStatus
  error: string | null
  isNative: boolean
  platform: 'ios' | 'android' | null
  activeTier: SubscriptionTier | null

  // Actions
  purchase: (productKey: IAPProductKey) => Promise<{ success: boolean; error: string | null }>
  restorePurchases: () => Promise<{
    success: boolean
    tier: SubscriptionTier | null
    error: string | null
  }>
  reset: () => void
}

export const useInAppPurchaseStore = create<IAPState>((set, get) => ({
  status: 'idle',
  error: null,
  isNative: isNativePlatform,
  platform: getNativePlatform(),
  activeTier: null,

  purchase: async (productKey: IAPProductKey) => {
    const { isNative, platform } = get()

    if (!isNative || !platform) {
      // On web, this hook should not be called directly.
      // useSubscription.ts handles Stripe checkout.
      return {
        success: false,
        error: 'IAP is only available on native platforms. Use Stripe for web.',
      }
    }

    set({ status: 'purchasing', error: null })

    try {
      const productId = getPlatformProductId(productKey)

      // Call the Capacitor IAP plugin to initiate purchase
      const { InAppPurchase2 } = await import(/* @vite-ignore */ '@nicklason/capacitor-iap')

      // Register the product
      await InAppPurchase2.initialize()

      // Request the purchase
      const result = await InAppPurchase2.purchaseProduct({ productId })

      if (!result || !result.receipt) {
        set({ status: 'error', error: 'Achat annulé ou échoué' })
        return { success: false, error: 'Achat annulé ou échoué' }
      }

      // Validate the receipt server-side
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        set({ status: 'error', error: 'Utilisateur non authentifie' })
        return { success: false, error: 'Utilisateur non authentifie' }
      }

      const { data, error } = await supabase.functions.invoke('validate-iap-receipt', {
        body: {
          receipt: result.receipt,
          platform,
          product_id: productId,
          user_id: user.id,
        },
      })

      if (error) {
        set({ status: 'error', error: error.message || 'Erreur de validation du recu' })
        return { success: false, error: error.message || 'Erreur de validation du recu' }
      }

      const tier = (data?.tier as SubscriptionTier) || getTierFromProductKey(productKey)
      set({ status: 'purchased', activeTier: tier, error: null })
      return { success: true, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue lors de l'achat"
      set({ status: 'error', error: message })
      return { success: false, error: message }
    }
  },

  restorePurchases: async () => {
    const { isNative, platform } = get()

    if (!isNative || !platform) {
      return {
        success: false,
        tier: null,
        error: 'La restauration est uniquement disponible sur mobile.',
      }
    }

    set({ status: 'loading', error: null })

    try {
      const { InAppPurchase2 } = await import(/* @vite-ignore */ '@nicklason/capacitor-iap')

      await InAppPurchase2.initialize()
      const restored = await InAppPurchase2.restorePurchases()

      if (!restored?.purchases?.length) {
        set({ status: 'idle', error: null })
        return { success: false, tier: null, error: 'Aucun achat a restaurer.' }
      }

      // Validate the most recent receipt server-side
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        set({ status: 'error', error: 'Utilisateur non authentifie' })
        return { success: false, tier: null, error: 'Utilisateur non authentifie' }
      }

      // Find the highest-tier purchase to restore
      let bestTier: SubscriptionTier = 'free'
      let bestReceipt: string | null = null

      for (const purchase of restored.purchases) {
        const productKey = getProductKeyFromNativeId(purchase.productId)
        if (productKey) {
          const tier = getTierFromProductKey(productKey)
          const tierOrder: SubscriptionTier[] = ['free', 'premium', 'squad_leader']
          if (tierOrder.indexOf(tier) > tierOrder.indexOf(bestTier)) {
            bestTier = tier
            bestReceipt = purchase.receipt
          }
        }
      }

      if (!bestReceipt || bestTier === 'free') {
        set({ status: 'idle', error: null })
        return { success: false, tier: null, error: 'Aucun achat valide trouve.' }
      }

      // Validate with server
      const { data, error } = await supabase.functions.invoke('validate-iap-receipt', {
        body: {
          receipt: bestReceipt,
          platform,
          user_id: user.id,
        },
      })

      if (error) {
        set({ status: 'error', error: error.message || 'Erreur de validation' })
        return { success: false, tier: null, error: error.message || 'Erreur de validation' }
      }

      const restoredTier = (data?.tier as SubscriptionTier) || bestTier
      set({ status: 'restored', activeTier: restoredTier, error: null })
      return { success: true, tier: restoredTier, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la restauration'
      set({ status: 'error', error: message })
      return { success: false, tier: null, error: message }
    }
  },

  reset: () => {
    set({ status: 'idle', error: null, activeTier: null })
  },
}))

// ── Convenience hook ────────────────────────────────────────────
export function useInAppPurchase() {
  const store = useInAppPurchaseStore()
  return {
    status: store.status,
    error: store.error,
    isNative: store.isNative,
    platform: store.platform,
    activeTier: store.activeTier,
    purchase: store.purchase,
    restorePurchases: store.restorePurchases,
    reset: store.reset,
    // Expose product IDs and prices for UI
    products: store.platform === 'ios' ? IOS_PRODUCTS : ANDROID_PRODUCTS,
    prices: IAP_PRICES,
  }
}
