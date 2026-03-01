import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

export interface ReferralStats {
  referralCode: string | null
  totalReferrals: number
  signedUp: number
  converted: number
  pending: number
  totalXpEarned: number
  milestones: {
    recruiter3: boolean
    recruiter10: boolean
    recruiter25: boolean
  }
}

export interface ReferralHistoryItem {
  id: string
  referred_id: string | null
  referral_code: string
  status: 'pending' | 'signed_up' | 'converted'
  reward_claimed: boolean
  created_at: string
}

interface ReferralState {
  stats: ReferralStats | null
  history: ReferralHistoryItem[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchReferralStats: () => Promise<void>
  fetchReferralHistory: () => Promise<void>
  generateShareUrl: () => string | null
  copyShareUrl: () => Promise<boolean>
  processReferralCode: (code: string) => Promise<{ success: boolean; error?: string }>
}

const DEFAULT_STATS: ReferralStats = {
  referralCode: null,
  totalReferrals: 0,
  signedUp: 0,
  converted: 0,
  pending: 0,
  totalXpEarned: 0,
  milestones: {
    recruiter3: false,
    recruiter10: false,
    recruiter25: false,
  },
}

export const useReferralStore = create<ReferralState>((set, get) => ({
  stats: null,
  history: [],
  isLoading: false,
  error: null,

  fetchReferralStats: async () => {
    try {
      set({ isLoading: true, error: null })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ stats: null, isLoading: false })
        return
      }

      // Call the DB function
      const { data, error } = await supabase.rpc('get_referral_stats', {
        p_user_id: user.id,
      })

      if (error) {
        // If function doesn't exist yet (migration not deployed), fallback gracefully
        if (error.message?.includes('function') || error.code === '42883') {
          // Fallback: read directly from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('referral_code, username')
            .eq('id', user.id)
            .single()

          let code = profile?.referral_code || null

          // Auto-generate referral code if missing
          if (!code && profile?.username) {
            code = profile.username.replace(/\s+/g, '').slice(0, 12).toUpperCase() + '-SP26'
            await supabase
              .from('profiles')
              .update({ referral_code: code })
              .eq('id', user.id)
          }

          set({
            stats: { ...DEFAULT_STATS, referralCode: code },
            isLoading: false,
          })
          return
        }
        throw error
      }

      const result = data as Record<string, unknown> | null
      if (result) {
        let referralCode = (result.referral_code as string) || null

        // Auto-generate referral code if missing
        if (!referralCode) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()
          if (profile?.username) {
            referralCode = profile.username.replace(/\s+/g, '').slice(0, 12).toUpperCase() + '-SP26'
            await supabase
              .from('profiles')
              .update({ referral_code: referralCode })
              .eq('id', user.id)
          }
        }

        const milestones = result.milestones as Record<string, boolean> | undefined
        set({
          stats: {
            referralCode,
            totalReferrals: (result.total_referrals as number) || 0,
            signedUp: (result.signed_up as number) || 0,
            converted: (result.converted as number) || 0,
            pending: (result.pending as number) || 0,
            totalXpEarned: (result.total_xp_earned as number) || 0,
            milestones: {
              recruiter3: milestones?.recruiter_3 || false,
              recruiter10: milestones?.recruiter_10 || false,
              recruiter25: milestones?.recruiter_25 || false,
            },
          },
          isLoading: false,
        })
      } else {
        set({ stats: DEFAULT_STATS, isLoading: false })
      }
    } catch (error) {
      console.warn('[Referral] Error fetching stats:', error)
      set({ stats: DEFAULT_STATS, isLoading: false, error: 'Erreur lors du chargement' })
    }
  },

  fetchReferralHistory: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('referrals')
        .select('id, referred_id, referral_code, status, reward_claimed, created_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          set({ history: [] })
          return
        }
        throw error
      }

      set({ history: (data || []) as ReferralHistoryItem[] })
    } catch (error) {
      console.warn('[Referral] Error fetching history:', error)
    }
  },

  generateShareUrl: () => {
    const { stats } = get()
    if (!stats?.referralCode) return null
    return `${window.location.origin}/auth?ref=${encodeURIComponent(stats.referralCode)}`
  },

  copyShareUrl: async () => {
    const url = get().generateShareUrl()
    if (!url) return false
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return false
    }
  },

  processReferralCode: async (code: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Non connecté' }

      const { data, error } = await supabase.functions.invoke('process-referral', {
        body: { referral_code: code },
      })

      if (error) throw error

      if (data?.success) {
        // Refresh stats after successful referral
        get().fetchReferralStats()
        return { success: true }
      }

      return { success: false, error: data?.error || 'Erreur inconnue' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du traitement'
      return { success: false, error: message }
    }
  },
}))

// Simple hook wrapper
export function useReferral() {
  const store = useReferralStore()
  return {
    stats: store.stats,
    history: store.history,
    isLoading: store.isLoading,
    error: store.error,
    shareUrl: store.generateShareUrl(),
    fetchReferralStats: store.fetchReferralStats,
    fetchReferralHistory: store.fetchReferralHistory,
    copyShareUrl: store.copyShareUrl,
    processReferralCode: store.processReferralCode,
  }
}
