import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import type { SubscriptionTier } from '../types/database'
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
  SQUAD_LEADER_PRICE_MONTHLY,
  SQUAD_LEADER_PRICE_YEARLY,
  CLUB_PRICE_MONTHLY,
  CLUB_PRICE_YEARLY,
} from './usePremium'

interface Subscription {
  id: string
  squad_id: string | null
  user_id: string
  stripe_subscription_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export interface PricingPlan {
  id: string
  name: string
  tier: SubscriptionTier
  price: number
  interval: 'month' | 'year'
  features: string[]
  stripePriceId: string
  popular?: boolean
}

interface SubscriptionState {
  subscription: Subscription | null
  isLoading: boolean
  plans: PricingPlan[]

  // Actions
  fetchSubscription: (squadId?: string) => Promise<void>
  createCheckoutSession: (
    priceId: string,
    tier: SubscriptionTier,
    squadId?: string
  ) => Promise<{ url: string | null; error: Error | null }>
  createPortalSession: () => Promise<{ url: string | null; error: Error | null }>
  cancelSubscription: (squadId?: string) => Promise<{ error: Error | null }>
}

// Stripe Price IDs from environment variables
const STRIPE_PRICE_PREMIUM_MONTHLY =
  import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY ||
  import.meta.env.VITE_STRIPE_PRICE_MONTHLY ||
  ''
const STRIPE_PRICE_PREMIUM_YEARLY =
  import.meta.env.VITE_STRIPE_PRICE_PREMIUM_YEARLY || import.meta.env.VITE_STRIPE_PRICE_YEARLY || ''
const STRIPE_PRICE_SL_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_SL_MONTHLY || ''
const STRIPE_PRICE_SL_YEARLY = import.meta.env.VITE_STRIPE_PRICE_SL_YEARLY || ''
const STRIPE_PRICE_CLUB_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_CLUB_MONTHLY || ''
const STRIPE_PRICE_CLUB_YEARLY = import.meta.env.VITE_STRIPE_PRICE_CLUB_YEARLY || ''

// Pricing plans — 8 plans total (Free + 3 tiers × 2 intervals)
const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    tier: 'free',
    price: 0,
    interval: 'month',
    features: [
      '1 squad',
      '3 sessions/semaine',
      'Historique 7 jours',
      'Chat basique',
      'Score de fiabilité',
      'Notifications push',
    ],
    stripePriceId: '',
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    tier: 'premium',
    price: PREMIUM_PRICE_MONTHLY,
    interval: 'month',
    features: [
      '5 squads',
      'Sessions illimitées',
      'Historique 90 jours',
      'Chat complet (GIF, voice msg, polls)',
      'Stats avancées & tendances',
      'IA Coach basique',
      'Badge Premium violet',
      'Thèmes personnalisés',
    ],
    stripePriceId: STRIPE_PRICE_PREMIUM_MONTHLY,
  },
  {
    id: 'premium_yearly',
    name: 'Premium Annuel',
    tier: 'premium',
    price: PREMIUM_PRICE_YEARLY,
    interval: 'year',
    features: ['Tout le Premium', 'Économise 28%'],
    stripePriceId: STRIPE_PRICE_PREMIUM_YEARLY,
  },
  {
    id: 'squad_leader_monthly',
    name: 'Squad Leader',
    tier: 'squad_leader',
    price: SQUAD_LEADER_PRICE_MONTHLY,
    interval: 'month',
    popular: true,
    features: [
      'Squads illimités',
      'Historique illimité',
      'Audio HD Party',
      'IA Coach avancé (tactiques, compositions)',
      'Dashboard analytics équipe',
      'Rôles avancés (Leader, Co-leader, Modérateur)',
      'Export calendrier (Google, iCal)',
      'Sessions auto-récurrentes',
      'Priorité matchmaking Discover',
      'Badge Squad Leader doré',
    ],
    stripePriceId: STRIPE_PRICE_SL_MONTHLY,
  },
  {
    id: 'squad_leader_yearly',
    name: 'Squad Leader Annuel',
    tier: 'squad_leader',
    price: SQUAD_LEADER_PRICE_YEARLY,
    interval: 'year',
    popular: true,
    features: ['Tout Squad Leader', 'Économise 20%'],
    stripePriceId: STRIPE_PRICE_SL_YEARLY,
  },
  {
    id: 'club_monthly',
    name: 'Club',
    tier: 'club',
    price: CLUB_PRICE_MONTHLY,
    interval: 'month',
    features: [
      'Tout Squad Leader inclus',
      'Dashboard multi-squads (10+ équipes)',
      'Statistiques cross-squad',
      'Branding personnalisé (logo club)',
      'Export CSV avancé',
      'Onboarding guidé pas-à-pas',
      'Support prioritaire par email',
      'Facturation entreprise (PDF)',
      'Export CSV/PDF statistiques',
    ],
    stripePriceId: STRIPE_PRICE_CLUB_MONTHLY,
  },
  {
    id: 'club_yearly',
    name: 'Club Annuel',
    tier: 'club',
    price: CLUB_PRICE_YEARLY,
    interval: 'year',
    features: ['Tout le Club', 'Économise 20%'],
    stripePriceId: STRIPE_PRICE_CLUB_YEARLY,
  },
]

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  isLoading: false,
  plans: PLANS,

  fetchSubscription: async (squadId?: string) => {
    try {
      set({ isLoading: true })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ subscription: null, isLoading: false })
        return
      }

      // Try fetching personal subscription first, then squad-based
      let query = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (squadId) {
        query = supabase
          .from('subscriptions')
          .select('*')
          .eq('squad_id', squadId)
          .eq('status', 'active')
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') {
        console.warn('[Subscription] Error fetching:', error)
      }

      set({ subscription: data || null, isLoading: false })
    } catch (error) {
      console.warn('[Subscription] Error in fetchSubscription:', error)
      set({ subscription: null, isLoading: false })
    }
  },

  createCheckoutSession: async (priceId: string, tier: SubscriptionTier, squadId?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          ...(squadId && { squad_id: squadId }),
          price_id: priceId,
          tier,
          success_url: squadId
            ? `${window.location.origin}/squad/${squadId}?checkout=success`
            : `${window.location.origin}/profile?checkout=success`,
          cancel_url: squadId
            ? `${window.location.origin}/squad/${squadId}?checkout=cancelled`
            : `${window.location.origin}/premium?checkout=cancelled`,
        },
      })

      if (error) throw error

      return { url: data?.url || null, error: null }
    } catch (error) {
      return { url: null, error: error as Error }
    }
  },

  createPortalSession: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (!profile?.stripe_customer_id) {
        throw new Error('No Stripe customer found')
      }

      const { data, error } = await supabase.functions.invoke('create-portal', {
        body: {
          customer_id: profile.stripe_customer_id,
          return_url: `${window.location.origin}/profile`,
        },
      })

      if (error) throw error

      return { url: data?.url || null, error: null }
    } catch (error) {
      return { url: null, error: error as Error }
    }
  },

  cancelSubscription: async (squadId?: string) => {
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { ...(squadId && { squad_id: squadId }) },
      })

      if (error) throw error

      set({ subscription: null })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },
}))
