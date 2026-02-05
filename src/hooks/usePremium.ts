import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Constantes pour le gating
export const FREE_SQUAD_LIMIT = 2
export const FREE_HISTORY_DAYS = 30
export const PREMIUM_PRICE_MONTHLY = 19.99
export const PREMIUM_PRICE_YEARLY = 191.90 // ~2 mois offerts

export type PremiumFeature =
  | 'unlimited_squads'
  | 'unlimited_history'
  | 'advanced_stats'
  | 'ai_coach_advanced'
  | 'hd_audio'
  | 'advanced_roles'
  | 'calendar_export'

interface SquadPremiumStatus {
  squadId: string
  isPremium: boolean
}

interface PremiumState {
  // Status utilisateur
  hasPremium: boolean
  premiumSquads: SquadPremiumStatus[]
  userSquadCount: number
  isLoading: boolean

  // Actions
  fetchPremiumStatus: () => Promise<void>
  isSquadPremium: (squadId: string) => boolean
  canCreateSquad: () => boolean
  canAccessFeature: (feature: PremiumFeature, squadId?: string) => boolean
  getSquadLimit: () => number
  getHistoryDays: () => number
  reset: () => void
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  hasPremium: false,
  premiumSquads: [],
  userSquadCount: 0,
  isLoading: false,

  fetchPremiumStatus: async () => {
    try {
      set({ isLoading: true })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ hasPremium: false, premiumSquads: [], userSquadCount: 0, isLoading: false })
        return
      }

      // 1. Recuperer le nombre de squads de l'utilisateur
      const { data: memberships, error: memberError } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError

      const userSquadCount = memberships?.length || 0
      const squadIds = memberships?.map(m => m.squad_id) || []

      // 2. Verifier quels squads sont premium
      let premiumSquads: SquadPremiumStatus[] = []
      let hasPremium = false

      if (squadIds.length > 0) {
        const { data: squads, error: squadsError } = await supabase
          .from('squads')
          .select('id, is_premium')
          .in('id', squadIds)

        if (squadsError) throw squadsError

        premiumSquads = (squads || []).map(s => ({
          squadId: s.id,
          isPremium: s.is_premium || false
        }))

        // L'user a premium si au moins une de ses squads est premium
        hasPremium = premiumSquads.some(s => s.isPremium)
      }

      // 3. Verifier aussi les subscriptions actives
      if (!hasPremium && squadIds.length > 0) {
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('squad_id')
          .in('squad_id', squadIds)
          .eq('status', 'active')

        if (subscriptions && subscriptions.length > 0) {
          hasPremium = true
          // Mettre a jour les squads premium avec les subscriptions actives
          for (const sub of subscriptions) {
            const existing = premiumSquads.find(s => s.squadId === sub.squad_id)
            if (existing) {
              existing.isPremium = true
            } else {
              premiumSquads.push({ squadId: sub.squad_id, isPremium: true })
            }
          }
        }
      }

      // 4. Verifier aussi le tier dans le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_tier === 'premium') {
        const expiresAt = profile.subscription_expires_at
          ? new Date(profile.subscription_expires_at)
          : null
        if (!expiresAt || expiresAt > new Date()) {
          hasPremium = true
        }
      }

      set({
        hasPremium,
        premiumSquads,
        userSquadCount,
        isLoading: false
      })
    } catch (error) {
      console.error('Error fetching premium status:', error)
      set({ isLoading: false })
    }
  },

  isSquadPremium: (squadId: string) => {
    const { premiumSquads } = get()
    return premiumSquads.find(s => s.squadId === squadId)?.isPremium || false
  },

  canCreateSquad: () => {
    const { hasPremium, userSquadCount } = get()
    return hasPremium || userSquadCount < FREE_SQUAD_LIMIT
  },

  canAccessFeature: (_feature: PremiumFeature, squadId?: string) => {
    const { hasPremium, isSquadPremium } = get()

    // Si l'user a premium globalement, tout est accessible
    if (hasPremium) return true

    // Si on specifie un squadId, verifier si ce squad est premium
    if (squadId && isSquadPremium(squadId)) return true

    // Sinon, les features sont gatees
    // Note: _feature peut etre utilise plus tard pour un gating plus granulaire
    return false
  },

  getSquadLimit: () => {
    const { hasPremium } = get()
    return hasPremium ? Infinity : FREE_SQUAD_LIMIT
  },

  getHistoryDays: () => {
    const { hasPremium } = get()
    return hasPremium ? Infinity : FREE_HISTORY_DAYS
  },

  reset: () => {
    set({
      hasPremium: false,
      premiumSquads: [],
      userSquadCount: 0,
      isLoading: false
    })
  }
}))

// Hook custom pour utilisation simple
export function usePremium() {
  const store = usePremiumStore()
  return {
    hasPremium: store.hasPremium,
    isLoading: store.isLoading,
    squadCount: store.userSquadCount,
    canCreateSquad: store.canCreateSquad(),
    squadLimit: store.getSquadLimit(),
    historyDays: store.getHistoryDays(),
    isSquadPremium: store.isSquadPremium,
    canAccessFeature: store.canAccessFeature,
    fetchPremiumStatus: store.fetchPremiumStatus,
    reset: store.reset
  }
}
