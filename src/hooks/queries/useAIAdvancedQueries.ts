/**
 * PHASE 6 - React Query hooks for Advanced AI features
 *
 * Session summaries and predictive suggestions.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryClient'

// --- AI Session Summary ---

export interface SessionSummaryData {
  summary: string
  stats: {
    total_rsvps: number
    present_count: number
    late_count: number
    noshow_count: number
    attendance_rate: number
    mvp_username: string | null
  }
  ai_generated: boolean
}

async function fetchSessionSummary(sessionId: string): Promise<SessionSummaryData | null> {
  // Check cache first
  const { data: cached } = await supabase
    .from('ai_insights')
    .select('content')
    .eq('session_id', sessionId)
    .eq('insight_type', 'session_summary')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (cached?.content) {
    return cached.content as unknown as SessionSummaryData
  }

  // Generate via Edge Function
  const { data, error } = await supabase.functions.invoke('ai-session-summary', {
    body: { session_id: sessionId }
  })

  if (error) {
    console.warn('ai-session-summary error:', error.message)
    return null
  }

  return data as SessionSummaryData | null
}

export function useSessionSummaryQuery(sessionId: string | undefined, sessionStatus?: string) {
  return useQuery({
    queryKey: queryKeys.aiAdvanced.sessionSummary(sessionId || ''),
    queryFn: () => sessionId ? fetchSessionSummary(sessionId) : null,
    enabled: !!sessionId && sessionStatus === 'completed',
    staleTime: Infinity, // Summaries don't change
    retry: false,
  })
}

// --- AI Predictive Suggestion ---

export interface PredictiveSuggestion {
  day_of_week: number
  hour: number
  reliability_score: number
  session_count: number
  avg_attendance: number
  reason: string
}

async function fetchPredictions(squadId: string): Promise<PredictiveSuggestion[]> {
  const { data, error } = await supabase.rpc('get_best_slots', {
    p_squad_id: squadId,
    p_limit: 3,
  })

  if (error) {
    console.warn('get_best_slots error:', error.message)
    return []
  }

  if (!data || data.length === 0) return []

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  return data.map((slot: { day_of_week: number; hour: number; avg_attendance: number; session_count: number }) => ({
    day_of_week: slot.day_of_week,
    hour: slot.hour,
    reliability_score: Math.round(slot.avg_attendance),
    session_count: slot.session_count,
    avg_attendance: slot.avg_attendance,
    reason: `${dayNames[slot.day_of_week]} ${slot.hour}h — ${slot.session_count} sessions, ${Math.round(slot.avg_attendance)}% de presence`,
  }))
}

export function useAIPredictionsQuery(squadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aiAdvanced.predictions(squadId || ''),
    queryFn: () => squadId ? fetchPredictions(squadId) : [],
    enabled: !!squadId,
    staleTime: 5 * 60_000, // 5 minutes
    retry: false,
  })
}
