import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from './useAuth'
import { showSuccess, showError } from '../lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AmbassadorProfile {
  id: string
  user_id: string
  promo_code: string
  commission_rate: number
  status: 'pending' | 'approved' | 'rejected'
  referral_count: number
  total_earned: number
  platform: string
  channel_link: string
  followers: string
  motivation: string
  created_at: string
}

export interface AmbassadorApplication {
  pseudo: string
  platform: string
  link: string
  followers: string
  message: string
}

export interface AmbassadorStats {
  promoCode: string
  commissionRate: number
  referralCount: number
  totalEarned: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const ambassadorKeys = {
  all: ['ambassador'] as const,
  profile: () => [...ambassadorKeys.all, 'profile'] as const,
  stats: () => [...ambassadorKeys.all, 'stats'] as const,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a promo code from username: SQUAD-USERNAME (uppercased, no spaces) */
function generatePromoCode(username: string): string {
  const clean = username
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
  return `SQUAD-${clean || 'USER'}`
}

// ─── Fetch Functions ──────────────────────────────────────────────────────────

async function fetchAmbassadorProfile(userId: string): Promise<AmbassadorProfile | null> {
  const { data, error } = await supabase
    .from('ambassador_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    // Table may not exist yet -- treat as "no application"
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return null
    }
    throw error
  }

  return data as AmbassadorProfile | null
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useAmbassador — Get current user's ambassador profile and stats.
 *
 * Returns the ambassador profile if the user has applied, null otherwise.
 * Also exposes the application status for conditional UI rendering.
 */
export function useAmbassador() {
  const user = useAuthStore((s) => s.user)

  const query = useQuery({
    queryKey: ambassadorKeys.profile(),
    queryFn: () => fetchAmbassadorProfile(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000, // 1 min
    retry: 1,
  })

  const profile = query.data ?? null
  const isAmbassador = profile?.status === 'approved'
  const isPending = profile?.status === 'pending'
  const isRejected = profile?.status === 'rejected'
  const hasApplied = profile !== null

  const stats: AmbassadorStats | null = profile
    ? {
        promoCode: profile.promo_code,
        commissionRate: profile.commission_rate,
        referralCount: profile.referral_count,
        totalEarned: profile.total_earned,
        status: profile.status,
        createdAt: profile.created_at,
      }
    : null

  return {
    ...query,
    profile,
    stats,
    isAmbassador,
    isPending,
    isRejected,
    hasApplied,
  }
}

/**
 * useApplyAsAmbassador — Submit an ambassador application.
 *
 * Inserts a row into `ambassador_applications` with the user's info,
 * a generated promo code, and default values.
 */
export function useApplyAsAmbassador() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  return useMutation({
    mutationFn: async (application: AmbassadorApplication) => {
      if (!user) throw new Error('Non authentifié')

      const promoCode = generatePromoCode(application.pseudo || profile?.username || 'user')

      const { data, error } = await supabase
        .from('ambassador_applications')
        .insert({
          user_id: user.id,
          promo_code: promoCode,
          commission_rate: 0.2,
          status: 'pending' as const,
          referral_count: 0,
          total_earned: 0,
          platform: application.platform,
          channel_link: application.link,
          followers: application.followers,
          motivation: application.message,
        })
        .select()
        .single()

      if (error) {
        // If the table doesn't exist, provide a clear message
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          throw new Error(
            'Le programme ambassadeur est en cours de mise en place. Réessaie bientôt !'
          )
        }
        // Duplicate application
        if (error.code === '23505') {
          throw new Error('Tu as déjà soumis une candidature.')
        }
        throw error
      }

      return data as AmbassadorProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ambassadorKeys.all })
      showSuccess('Candidature envoyée ! On te répond sous 48h.')
    },
    onError: (error) => {
      showError(error.message || "Erreur lors de l'envoi de la candidature")
    },
  })
}

/**
 * useAmbassadorStats — Get ambassador stats (convenience alias).
 */
export function useAmbassadorStats() {
  const { stats, isAmbassador, isLoading } = useAmbassador()
  return { stats, isAmbassador, isLoading }
}
