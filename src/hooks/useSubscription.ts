import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

interface Subscription {
  id: string
  squad_id: string
  user_id: string
  stripe_subscription_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

interface PricingPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  stripePriceId: string
}

interface SubscriptionState {
  subscription: Subscription | null
  isLoading: boolean
  plans: PricingPlan[]

  // Actions
  fetchSubscription: (squadId: string) => Promise<void>
  createCheckoutSession: (
    squadId: string,
    priceId: string
  ) => Promise<{ url: string | null; error: Error | null }>
  createPortalSession: () => Promise<{ url: string | null; error: Error | null }>
  cancelSubscription: (squadId: string) => Promise<{ error: Error | null }>
}

// Stripe Price IDs from environment variables
// These IDs are different between Test and Live modes!
const STRIPE_PRICE_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_MONTHLY || ''
const STRIPE_PRICE_YEARLY = import.meta.env.VITE_STRIPE_PRICE_YEARLY || ''

// Pricing plans
const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    interval: 'month',
    features: ['2 squads maximum', 'Planning basique', 'Rappels simples', 'Chat limité'],
    stripePriceId: '',
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    price: 4.99,
    interval: 'month',
    features: [
      'Squads illimités',
      'IA Coach personnalisé',
      'Stats avancées & tendances',
      'Historique illimité',
      'Export calendrier',
      'Audio HD Party',
      'Support prioritaire',
    ],
    stripePriceId: STRIPE_PRICE_MONTHLY,
  },
  {
    id: 'premium_yearly',
    name: 'Premium Annuel',
    price: 47.88, // 3.99€/mois × 12 = 47.88€ (~2 mois offerts vs 59.88€)
    interval: 'year',
    features: ['Tout le Premium', '2 mois gratuits', 'Accès anticipé aux nouveautés'],
    stripePriceId: STRIPE_PRICE_YEARLY,
  },
]

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  isLoading: false,
  plans: PLANS,

  fetchSubscription: async (squadId: string) => {
    try {
      set({ isLoading: true })

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('squad_id', squadId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.warn('[Subscription] Error fetching:', error)
      }

      set({ subscription: data || null, isLoading: false })
    } catch (error) {
      console.warn('[Subscription] Error in fetchSubscription:', error)
      set({ subscription: null, isLoading: false })
    }
  },

  createCheckoutSession: async (squadId: string, priceId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          squad_id: squadId,
          price_id: priceId,
          success_url: `${window.location.origin}/squads/${squadId}?checkout=success`,
          cancel_url: `${window.location.origin}/squads/${squadId}?checkout=cancelled`,
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

      // Get user's stripe customer ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (!profile?.stripe_customer_id) {
        throw new Error('No Stripe customer found')
      }

      // Call Edge Function to create portal session
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

  cancelSubscription: async (squadId: string) => {
    try {
      // Call Edge Function to cancel subscription
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { squad_id: squadId },
      })

      if (error) throw error

      set({ subscription: null })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },
}))
