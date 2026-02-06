/**
 * PRIORITE 1 & 2 - React Query hook for AI Coach
 *
 * Replaces direct ai-coach Edge Function calls with cached query.
 * Query key: ['ai-coach', userId, contextType]
 *
 * Features:
 * - Called once per session, not on every mount
 * - Fallback tip if Edge Function fails
 * - No retry on error (silent failure)
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// Flag to enable/disable AI Coach globally
const AI_COACH_ENABLED = true

export interface AICoachTip {
  tip: string
  tone: 'encouragement' | 'warning' | 'celebration'
  context?: {
    reliability_score: number
    trend: 'improving' | 'stable' | 'declining'
    days_since_last_session: number
    recent_noshows: number
    upcoming_sessions: number
  }
}

// Default fallback tip
const FALLBACK_TIP: AICoachTip = {
  tip: 'Pret pour la prochaine session ? Tes potes t\'attendent !',
  tone: 'encouragement'
}

// Fetch AI Coach tip from Edge Function
async function fetchAICoachTip(userId: string, contextType: 'profile' | 'home'): Promise<AICoachTip> {
  if (!AI_COACH_ENABLED) {
    return FALLBACK_TIP
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: { user_id: userId, context_type: contextType }
    })

    if (error) {
      // Silent failure - don't log to console to avoid noise
      return FALLBACK_TIP
    }

    return data as AICoachTip || FALLBACK_TIP
  } catch {
    // Silent failure - return fallback
    return FALLBACK_TIP
  }
}

/**
 * Hook to fetch AI Coach tip
 * Query key: ['ai-coach', userId, contextType]
 *
 * Uses Infinity staleTime so it only fetches once per session
 */
export function useAICoachQuery(userId: string | undefined, contextType: 'profile' | 'home' = 'profile') {
  return useQuery({
    queryKey: ['ai-coach', userId, contextType] as const,
    queryFn: () => userId ? fetchAICoachTip(userId, contextType) : FALLBACK_TIP,
    enabled: !!userId && AI_COACH_ENABLED,
    staleTime: Infinity, // Never refetch - once per session
    gcTime: Infinity, // Keep in cache forever during session
    retry: false, // Don't retry on failure
  })
}
