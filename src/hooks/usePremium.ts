import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import type { SubscriptionTier } from '../types/database'

// ── Tier hierarchy (higher index = more access) ──
const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'premium', 'squad_leader', 'club']

export function tierLevel(tier: SubscriptionTier): number {
  return TIER_HIERARCHY.indexOf(tier)
}

export function hasTierAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return tierLevel(userTier) >= tierLevel(requiredTier)
}

// ── Constantes de limites par tier ──
export interface TierLimits {
  maxSquads: number
  historyDays: number
  sessionsPerWeek: number
  hasGifs: boolean
  hasVoiceMessages: boolean
  hasPolls: boolean
  hasAdvancedStats: boolean
  hasAiCoach: boolean
  hasAiCoachAdvanced: boolean
  hasHdAudio: boolean
  hasAdvancedRoles: boolean
  hasCalendarExport: boolean
  hasRecurringSessions: boolean
  hasTeamAnalytics: boolean
  hasPriorityMatchmaking: boolean
  hasClubDashboard: boolean
  hasCustomBranding: boolean
  hasApiWebhooks: boolean
  hasPrioritySupport: boolean
  maxMembers: number
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxSquads: 1,
    historyDays: 7,
    sessionsPerWeek: 3,
    hasGifs: false,
    hasVoiceMessages: false,
    hasPolls: false,
    hasAdvancedStats: false,
    hasAiCoach: false,
    hasAiCoachAdvanced: false,
    hasHdAudio: false,
    hasAdvancedRoles: false,
    hasCalendarExport: false,
    hasRecurringSessions: false,
    hasTeamAnalytics: false,
    hasPriorityMatchmaking: false,
    hasClubDashboard: false,
    hasCustomBranding: false,
    hasApiWebhooks: false,
    hasPrioritySupport: false,
    maxMembers: 10,
  },
  premium: {
    maxSquads: 5,
    historyDays: 90,
    sessionsPerWeek: Infinity,
    hasGifs: true,
    hasVoiceMessages: true,
    hasPolls: true,
    hasAdvancedStats: true,
    hasAiCoach: true,
    hasAiCoachAdvanced: false,
    hasHdAudio: false,
    hasAdvancedRoles: false,
    hasCalendarExport: false,
    hasRecurringSessions: false,
    hasTeamAnalytics: false,
    hasPriorityMatchmaking: false,
    hasClubDashboard: false,
    hasCustomBranding: false,
    hasApiWebhooks: false,
    hasPrioritySupport: false,
    maxMembers: 20,
  },
  squad_leader: {
    maxSquads: Infinity,
    historyDays: Infinity,
    sessionsPerWeek: Infinity,
    hasGifs: true,
    hasVoiceMessages: true,
    hasPolls: true,
    hasAdvancedStats: true,
    hasAiCoach: true,
    hasAiCoachAdvanced: true,
    hasHdAudio: true,
    hasAdvancedRoles: true,
    hasCalendarExport: true,
    hasRecurringSessions: true,
    hasTeamAnalytics: true,
    hasPriorityMatchmaking: true,
    hasClubDashboard: false,
    hasCustomBranding: false,
    hasApiWebhooks: false,
    hasPrioritySupport: false,
    maxMembers: 50,
  },
  club: {
    maxSquads: Infinity,
    historyDays: Infinity,
    sessionsPerWeek: Infinity,
    hasGifs: true,
    hasVoiceMessages: true,
    hasPolls: true,
    hasAdvancedStats: true,
    hasAiCoach: true,
    hasAiCoachAdvanced: true,
    hasHdAudio: true,
    hasAdvancedRoles: true,
    hasCalendarExport: true,
    hasRecurringSessions: true,
    hasTeamAnalytics: true,
    hasPriorityMatchmaking: true,
    hasClubDashboard: true,
    hasCustomBranding: true,
    hasApiWebhooks: true,
    hasPrioritySupport: true,
    maxMembers: 100,
  },
}

// ── Backward-compat exports (used by many consumers) ──
export const FREE_SQUAD_LIMIT = TIER_LIMITS.free.maxSquads
export const FREE_HISTORY_DAYS = TIER_LIMITS.free.historyDays
export const FREE_SESSIONS_PER_WEEK = TIER_LIMITS.free.sessionsPerWeek

// ── Pricing constants ──
export const PREMIUM_PRICE_MONTHLY = 6.99
export const PREMIUM_PRICE_YEARLY = 59.88 // 4.99€/mois × 12
export const SQUAD_LEADER_PRICE_MONTHLY = 14.99
export const SQUAD_LEADER_PRICE_YEARLY = 143.88 // 11.99€/mois × 12
export const CLUB_PRICE_MONTHLY = 39.99
export const CLUB_PRICE_YEARLY = 383.88 // 31.99€/mois × 12

// ── Feature type (used by PremiumGate) ──
export type PremiumFeature =
  | 'unlimited_squads'
  | 'unlimited_history'
  | 'advanced_stats'
  | 'ai_coach_advanced'
  | 'hd_audio'
  | 'advanced_roles'
  | 'calendar_export'
  | 'gifs'
  | 'voice_messages'
  | 'polls'
  | 'recurring_sessions'
  | 'team_analytics'
  | 'priority_matchmaking'
  | 'club_dashboard'
  | 'custom_branding'
  | 'api_webhooks'

// Map feature → minimum tier required
export const FEATURE_MIN_TIER: Record<PremiumFeature, SubscriptionTier> = {
  gifs: 'premium',
  voice_messages: 'premium',
  polls: 'premium',
  unlimited_squads: 'squad_leader',
  unlimited_history: 'squad_leader',
  advanced_stats: 'premium',
  ai_coach_advanced: 'squad_leader',
  hd_audio: 'squad_leader',
  advanced_roles: 'squad_leader',
  calendar_export: 'squad_leader',
  recurring_sessions: 'squad_leader',
  team_analytics: 'squad_leader',
  priority_matchmaking: 'squad_leader',
  club_dashboard: 'club',
  custom_branding: 'club',
  api_webhooks: 'club',
}

interface SquadPremiumStatus {
  squadId: string
  isPremium: boolean
}

interface PremiumState {
  // User tier
  tier: SubscriptionTier
  hasPremium: boolean // backward compat: true if tier >= premium
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
  getSessionsPerWeek: () => number
  getTierLimits: () => TierLimits
  reset: () => void
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  tier: 'free' as SubscriptionTier,
  hasPremium: false,
  premiumSquads: [],
  userSquadCount: 0,
  isLoading: false,

  fetchPremiumStatus: async () => {
    try {
      set({ isLoading: true })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ tier: 'free', hasPremium: false, premiumSquads: [], userSquadCount: 0, isLoading: false })
        return
      }

      // 1. Get user squad count
      const { data: memberships, error: memberError } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError

      const userSquadCount = memberships?.length || 0
      const squadIds = memberships?.map((m) => m.squad_id) || []

      // 2. Check which squads are premium
      let premiumSquads: SquadPremiumStatus[] = []

      if (squadIds.length > 0) {
        const { data: squads, error: squadsError } = await supabase
          .from('squads')
          .select('id, is_premium')
          .in('id', squadIds)

        if (squadsError) throw squadsError

        premiumSquads = (squads || []).map((s) => ({
          squadId: s.id,
          isPremium: s.is_premium || false,
        }))
      }

      // 3. Check user tier from profile (source of truth)
      let tier: SubscriptionTier = 'free'

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
        const expiresAt = profile.subscription_expires_at
          ? new Date(profile.subscription_expires_at)
          : null
        if (!expiresAt || expiresAt > new Date()) {
          tier = profile.subscription_tier as SubscriptionTier
        }
      }

      // 4. Also check active subscriptions (fallback)
      if (tier === 'free' && squadIds.length > 0) {
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('squad_id')
          .in('squad_id', squadIds)
          .eq('status', 'active')

        if (subscriptions && subscriptions.length > 0) {
          // User is at least premium via squad subscription
          if (tier === 'free') tier = 'premium'
          for (const sub of subscriptions) {
            const existing = premiumSquads.find((s) => s.squadId === sub.squad_id)
            if (existing) {
              existing.isPremium = true
            } else if (sub.squad_id) {
              premiumSquads.push({ squadId: sub.squad_id, isPremium: true })
            }
          }
        }
      }

      set({
        tier,
        hasPremium: tierLevel(tier) >= tierLevel('premium'),
        premiumSquads,
        userSquadCount,
        isLoading: false,
      })
    } catch (error) {
      console.warn('[Premium] Error fetching status:', error)
      set({ isLoading: false })
    }
  },

  isSquadPremium: (squadId: string) => {
    const { premiumSquads } = get()
    return premiumSquads.find((s) => s.squadId === squadId)?.isPremium || false
  },

  canCreateSquad: () => {
    const { tier, userSquadCount } = get()
    const limits = TIER_LIMITS[tier]
    return userSquadCount < limits.maxSquads
  },

  canAccessFeature: (feature: PremiumFeature, squadId?: string) => {
    const { tier, isSquadPremium } = get()

    // Check user tier against feature minimum
    const requiredTier = FEATURE_MIN_TIER[feature]
    if (hasTierAccess(tier, requiredTier)) return true

    // If squadId provided, check if squad is premium (gives at least premium access)
    if (squadId && isSquadPremium(squadId)) {
      return hasTierAccess('premium', requiredTier)
    }

    return false
  },

  getSquadLimit: () => {
    const { tier } = get()
    return TIER_LIMITS[tier].maxSquads
  },

  getHistoryDays: () => {
    const { tier } = get()
    return TIER_LIMITS[tier].historyDays
  },

  getSessionsPerWeek: () => {
    const { tier } = get()
    return TIER_LIMITS[tier].sessionsPerWeek
  },

  getTierLimits: () => {
    const { tier } = get()
    return TIER_LIMITS[tier]
  },

  reset: () => {
    set({
      tier: 'free',
      hasPremium: false,
      premiumSquads: [],
      userSquadCount: 0,
      isLoading: false,
    })
  },
}))

// Hook custom pour utilisation simple
export function usePremium() {
  const store = usePremiumStore()
  return {
    tier: store.tier,
    hasPremium: store.hasPremium,
    isLoading: store.isLoading,
    squadCount: store.userSquadCount,
    canCreateSquad: store.canCreateSquad(),
    squadLimit: store.getSquadLimit(),
    historyDays: store.getHistoryDays(),
    sessionsPerWeek: store.getSessionsPerWeek(),
    tierLimits: store.getTierLimits(),
    isSquadPremium: store.isSquadPremium,
    canAccessFeature: store.canAccessFeature,
    fetchPremiumStatus: store.fetchPremiumStatus,
    reset: store.reset,
  }
}
