import { create } from 'zustand'
import { supabase, isSupabaseReady } from '../lib/supabaseMinimal'
import type { AIState, CoachTip, AICoachTip, AIInsight } from './useAITypes'
import { withBackoff } from './useAITypes'

export const useAIStore = create<AIState>((set) => ({
  slotSuggestions: [],
  hasSlotHistory: false,
  decisionRecommendation: null,
  reliabilityReport: null,
  coachTips: [],
  aiCoachTip: null,
  aiCoachTipLoading: false,
  insights: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchSlotSuggestions: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const { data, error } = await withBackoff(() =>
        supabase.functions.invoke('ai-planning', { body: { squad_id: squadId, limit: 5 } })
      ) as any
      if (error) throw new Error(error.message || "Erreur lors de l'analyse des cr\u00e9neaux")
      if (data?.suggestions) {
        set({
          slotSuggestions: data.suggestions,
          hasSlotHistory: data.has_history || false,
          isLoading: false,
        })
      } else {
        set({ slotSuggestions: [], hasSlotHistory: false, isLoading: false })
      }
    } catch {
      set({
        slotSuggestions: [],
        hasSlotHistory: false,
        isLoading: false,
        error: 'Pas assez de donn\u00e9es pour sugg\u00e9rer des cr\u00e9neaux',
      })
    }
  },

  fetchDecisionRecommendation: async (sessionId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const { data, error } = await supabase.functions.invoke('ai-decision', {
        body: { session_id: sessionId },
      })
      if (error) throw new Error(error.message || "Erreur lors de l'analyse de d\u00e9cision")
      set({ decisionRecommendation: data?.recommendation || null, isLoading: false })
    } catch {
      set({
        decisionRecommendation: null,
        isLoading: false,
        error: "Impossible d'obtenir la recommandation",
      })
    }
  },

  fetchReliabilityReport: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const { data, error } = await supabase.functions.invoke('ai-reliability', {
        body: { squad_id: squadId },
      })
      if (error) throw new Error(error.message || "Erreur lors de l'analyse de fiabilit\u00e9")
      set({ reliabilityReport: data?.report || null, isLoading: false })
    } catch {
      set({
        reliabilityReport: null,
        isLoading: false,
        error: "Impossible d'obtenir le rapport de fiabilit\u00e9",
      })
    }
  },

  fetchPlayerReliability: async (userId: string) => {
    if (!isSupabaseReady()) return null
    try {
      const { data, error } = await supabase.functions.invoke('ai-reliability', {
        body: { user_id: userId },
      })
      if (error) return null
      return data?.player || null
    } catch {
      return null
    }
  },

  fetchCoachTips: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const [{ data: squad }, { data: sessions }] = await withBackoff(() =>
        Promise.all([
          supabase
            .from('squads')
            .select('total_sessions, total_members')
            .eq('id', squadId)
            .single(),
          supabase
            .from('sessions')
            .select('scheduled_at, status, created_at')
            .eq('squad_id', squadId)
            .order('scheduled_at', { ascending: false })
            .limit(20),
        ])
      )

      const tips: CoachTip[] = []
      const completedSessions = sessions?.filter((s) => s.status === 'completed') || []

      if (completedSessions.length > 0) {
        const avgLeadTime =
          completedSessions.reduce((acc, s) => {
            return (
              acc +
              (new Date(s.scheduled_at).getTime() - new Date(s.created_at).getTime()) /
                (1000 * 60 * 60)
            )
          }, 0) / completedSessions.length
        if (avgLeadTime < 48) {
          tips.push({
            id: 'plan-ahead',
            type: 'planning',
            content:
              "Vos sessions ont +40% de pr\u00e9sence quand elles sont planifi\u00e9es 48h \u00e0 l'avance.",
            data: { avgLeadTimeHours: Math.round(avgLeadTime) },
          })
        }
      }

      if (squad && squad.total_sessions < 5) {
        tips.push({
          id: 'more-sessions',
          type: 'engagement',
          content:
            'Les squads qui jouent r\u00e9guli\u00e8rement (2+ fois/semaine) ont des membres 3x plus engag\u00e9s.',
        })
      }

      const eveningSessions = completedSessions.filter(
        (s) => new Date(s.scheduled_at).getHours() >= 22
      ).length
      if (completedSessions.length > 0 && eveningSessions > completedSessions.length * 0.5) {
        tips.push({
          id: 'late-sessions',
          type: 'timing',
          content:
            'Les sessions apr\u00e8s 22h ont +35% de no-show. Essayez des cr\u00e9neaux plus t\u00f4t.',
          data: { eveningRatio: Math.round((eveningSessions / completedSessions.length) * 100) },
        })
      }

      const weekendSessions = completedSessions.filter((s) => {
        const d = new Date(s.scheduled_at).getDay()
        return d === 0 || d === 6
      }).length
      if (completedSessions.length >= 5 && weekendSessions < completedSessions.length * 0.3) {
        tips.push({
          id: 'try-weekends',
          type: 'timing',
          content: 'Les sessions du week-end ont g\u00e9n\u00e9ralement +20% de participation.',
        })
      }

      if (tips.length === 0) {
        tips.push({
          id: 'general',
          type: 'general',
          content: "Utilisez le RSVP obligatoire pour augmenter l'engagement de votre squad.",
        })
      }

      set({ coachTips: tips, isLoading: false })
    } catch {
      set({ coachTips: [], isLoading: false })
    }
  },

  fetchAICoachTip: async (
    userId: string,
    contextType: 'profile' | 'home' = 'profile'
  ): Promise<AICoachTip | null> => {
    if (!isSupabaseReady()) return null
    const fallback: AICoachTip = {
      tip: "Pr\u00eat pour la prochaine session ? Tes potes t'attendent !",
      tone: 'encouragement',
    }
    try {
      set({ aiCoachTipLoading: true })
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { user_id: userId, context_type: contextType },
      })
      if (error) {
        set({ aiCoachTip: fallback, aiCoachTipLoading: false })
        return fallback
      }
      if (data) {
        const tip = data as AICoachTip
        set({ aiCoachTip: tip, aiCoachTipLoading: false })
        return tip
      }
      set({ aiCoachTipLoading: false })
      return null
    } catch {
      set({ aiCoachTip: fallback, aiCoachTipLoading: false })
      return fallback
    }
  },

  fetchInsights: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      const { data } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('squad_id', squadId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10)
      set({ insights: (data || []) as AIInsight[] })
    } catch {
      /* non-critical */
    }
  },

  dismissInsight: async (insightId: string) => {
    try {
      await supabase.from('ai_insights').update({ is_dismissed: true }).eq('id', insightId)
      set((state) => ({ insights: state.insights.filter((i) => i.id !== insightId) }))
    } catch {
      /* non-critical */
    }
  },

  getSlotReliability: async (squadId: string, dayOfWeek: number, hour: number) => {
    try {
      const { data, error } = await supabase.rpc('get_slot_reliability', {
        p_squad_id: squadId,
        p_day_of_week: dayOfWeek,
        p_hour: hour,
      })
      if (error) return 50
      return data || 50
    } catch {
      return 50
    }
  },

  triggerRsvpReminder: async (squadId?: string, sessionId?: string) => {
    try {
      const body: Record<string, string> = {}
      if (squadId) body.squad_id = squadId
      if (sessionId) body.session_id = sessionId
      const { data, error } = await supabase.functions.invoke('ai-rsvp-reminder', { body })
      if (error) return { success: false, remindersSent: 0 }
      return { success: data?.success || false, remindersSent: data?.reminders_sent || 0 }
    } catch {
      return { success: false, remindersSent: 0 }
    }
  },
}))

export const useAI = () => {
  const store = useAIStore()
  return {
    ...store,
    reliabilityInsights:
      store.reliabilityReport?.players.map((p) => ({
        user_id: p.user_id,
        username: p.username,
        reliability_score: p.reliability_score,
        trend: p.trend,
        warning: p.warning,
      })) || [],
  }
}
