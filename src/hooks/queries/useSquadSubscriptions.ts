/**
 * PRIORITE 1 - React Query hook for Squad Subscriptions
 *
 * Centralizes all subscriptions fetching with automatic caching.
 * Query key: ['subscriptions', squadId]
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface Subscription {
  id: string
  squad_id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

// Fetch subscription for a squad
async function fetchSquadSubscription(squadId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('squad_id', squadId)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

// Fetch all active subscriptions for user's squads
async function fetchUserSubscriptions(squadIds: string[]): Promise<Subscription[]> {
  if (squadIds.length === 0) return []

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .in('squad_id', squadIds)
    .eq('status', 'active')

  if (error) throw error
  return data || []
}

/**
 * Hook to fetch subscription for a specific squad
 * Query key: ['subscriptions', squadId]
 */
export function useSquadSubscriptionQuery(squadId: string | undefined) {
  return useQuery({
    queryKey: ['subscriptions', squadId] as const,
    queryFn: () => (squadId ? fetchSquadSubscription(squadId) : null),
    enabled: !!squadId,
    staleTime: 60_000, // 1 minute - subscriptions don't change often
  })
}

/**
 * Hook to fetch all subscriptions for user's squads
 * Query key: ['subscriptions', 'user', squadIds]
 */
export function useUserSubscriptionsQuery(squadIds: string[]) {
  return useQuery({
    queryKey: ['subscriptions', 'user', squadIds] as const,
    queryFn: () => fetchUserSubscriptions(squadIds),
    enabled: squadIds.length > 0,
    staleTime: 60_000,
  })
}
