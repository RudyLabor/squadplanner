import { create } from 'zustand'
import { supabase, isSupabaseReady } from '../lib/supabase'
import type { AIState, SlotSuggestion, CoachTip, AICoachTip, AIInsight } from './useAITypes'
import { withBackoff, dayNames } from './useAITypes'

export const useAIStore = create<AIState>((set) => ({
  slotSuggestions: [], hasSlotHistory: false, decisionRecommendation: null,
  reliabilityReport: null, coachTips: [], aiCoachTip: null, aiCoachTipLoading: false,
  insights: [], isLoading: false, error: null,

  clearError: () => set({ error: null }),

  fetchSlotSuggestions: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const { data, error } = await withBackoff(() =>
        supabase.functions.invoke('ai-planning', { body: { squad_id: squadId, limit: 5 } })
      )
      if (error) throw new Error(error.message || 'Erreur lors de l\'analyse des creneaux')
      if (data?.suggestions) {
        set({ slotSuggestions: data.suggestions, hasSlotHistory: data.has_history || false, isLoading: false })
      } else {
        set({ slotSuggestions: [], hasSlotHistory: false, isLoading: false })
      }
    } catch {
      const fallbackSuggestions: SlotSuggestion[] = [
        { day_of_week: 6, hour: 20, reliability_score: 80, session_count: 0, avg_attendance: 80, reason: `${dayNames[6]} 20h - Creneau populaire le week-end` },
        { day_of_week: 0, hour: 15, reliability_score: 75, session_count: 0, avg_attendance: 75, reason: `${dayNames[0]} 15h - Apres-midi detente` },
        { day_of_week: 4, hour: 21, reliability_score: 70, session_count: 0, avg_attendance: 70, reason: `${dayNames[4]} 21h - Soiree en semaine` },
      ]
      set({ slotSuggestions: fallbackSuggestions, hasSlotHistory: false, isLoading: false, error: 'Suggestions par defaut (pas assez d\'historique)' })
    }
  },

  fetchDecisionRecommendation: async (sessionId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const { data, error } = await supabase.functions.invoke('ai-decision', { body: { session_id: sessionId } })
      if (error) throw new Error(error.message || 'Erreur lors de l\'analyse de decision')
      set({ decisionRecommendation: data?.recommendation || null, isLoading: false })
    } catch {
      set({ decisionRecommendation: null, isLoading: false, error: 'Impossible d\'obtenir la recommandation' })
    }
  },

  fetchReliabilityReport: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const { data, error } = await supabase.functions.invoke('ai-reliability', { body: { squad_id: squadId } })
      if (error) throw new Error(error.message || 'Erreur lors de l\'analyse de fiabilite')
      set({ reliabilityReport: data?.report || null, isLoading: false })
    } catch {
      set({ reliabilityReport: null, isLoading: false, error: 'Impossible d\'obtenir le rapport de fiabilite' })
    }
  },

  fetchPlayerReliability: async (userId: string) => {
    if (!isSupabaseReady()) return null
    try {
      const { data, error } = await supabase.functions.invoke('ai-reliability', { body: { user_id: userId } })
      if (error) return null
      return data?.player || null
    } catch { return null }
  },

  fetchCoachTips: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true, error: null })
      const [{ data: squad }, { data: sessions }] = await withBackoff(() =>
        Promise.all([
          supabase.from('squads').select('total_sessions, total_members').eq('id', squadId).single(),
          supabase.from('sessions').select('scheduled_at, status, created_at').eq('squad_id', squadId)
            .order('scheduled_at', { ascending: false }).limit(20),
        ])
      )

      const tips: CoachTip[] = []
      const completedSessions = sessions?.filter(s => s.status === 'completed') || []

      if (completedSessions.length > 0) {
        const avgLeadTime = completedSessions.reduce((acc, s) => {
          return acc + (new Date(s.scheduled_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60)
        }, 0) / completedSessions.length
        if (avgLeadTime < 48) {
          tips.push({ id: 'plan-ahead', type: 'planning', content: 'Vos sessions ont +40% de presence quand elles sont planifiees 48h a l\'avance.', data: { avgLeadTimeHours: Math.round(avgLeadTime) } })
        }
      }

      if (squad && squad.total_sessions < 5) {
        tips.push({ id: 'more-sessions', type: 'engagement', content: 'Les squads qui jouent regulierement (2+ fois/semaine) ont des membres 3x plus engages.' })
      }

      const eveningSessions = completedSessions.filter(s => new Date(s.scheduled_at).getHours() >= 22).length
      if (completedSessions.length > 0 && eveningSessions > completedSessions.length * 0.5) {
        tips.push({ id: 'late-sessions', type: 'timing', content: 'Les sessions apres 22h ont +35% de no-show. Essayez des creneaux plus tot.', data: { eveningRatio: Math.round((eveningSessions / completedSessions.length) * 100) } })
      }

      const weekendSessions = completedSessions.filter(s => { const d = new Date(s.scheduled_at).getDay(); return d === 0 || d === 6 }).length
      if (completedSessions.length >= 5 && weekendSessions < completedSessions.length * 0.3) {
        tips.push({ id: 'try-weekends', type: 'timing', content: 'Les sessions du week-end ont generalement +20% de participation.' })
      }

      if (tips.length === 0) {
        tips.push({ id: 'general', type: 'general', content: 'Utilisez le RSVP obligatoire pour augmenter l\'engagement de votre squad.' })
      }

      set({ coachTips: tips, isLoading: false })
    } catch {
      set({ coachTips: [], isLoading: false })
    }
  },

  fetchAICoachTip: async (userId: string, contextType: 'profile' | 'home' = 'profile'): Promise<AICoachTip | null> => {
    if (!isSupabaseReady()) return null
    const fallback: AICoachTip = { tip: 'Pret pour la prochaine session ? Tes potes t\'attendent !', tone: 'encouragement' }
    try {
      set({ aiCoachTipLoading: true })
      const { data, error } = await supabase.functions.invoke('ai-coach', { body: { user_id: userId, context_type: contextType } })
      if (error) { set({ aiCoachTip: fallback, aiCoachTipLoading: false }); return fallback }
      if (data) { const tip = data as AICoachTip; set({ aiCoachTip: tip, aiCoachTipLoading: false }); return tip }
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
      const { data } = await supabase.from('ai_insights').select('*')
        .eq('squad_id', squadId).eq('is_dismissed', false)
        .order('created_at', { ascending: false }).limit(10)
      set({ insights: (data || []) as AIInsight[] })
    } catch { /* non-critical */ }
  },

  dismissInsight: async (insightId: string) => {
    try {
      await supabase.from('ai_insights').update({ is_dismissed: true }).eq('id', insightId)
      set(state => ({ insights: state.insights.filter(i => i.id !== insightId) }))
    } catch { /* non-critical */ }
  },

  getSlotReliability: async (squadId: string, dayOfWeek: number, hour: number) => {
    try {
      const { data, error } = await supabase.rpc('get_slot_reliability', { p_squad_id: squadId, p_day_of_week: dayOfWeek, p_hour: hour })
      if (error) return 50
      return data || 50
    } catch { return 50 }
  },

  triggerRsvpReminder: async (squadId?: string, sessionId?: string) => {
    try {
      const body: Record<string, string> = {}
      if (squadId) body.squad_id = squadId
      if (sessionId) body.session_id = sessionId
      const { data, error } = await supabase.functions.invoke('ai-rsvp-reminder', { body })
      if (error) return { success: false, remindersSent: 0 }
      return { success: data?.success || false, remindersSent: data?.reminders_sent || 0 }
    } catch { return { success: false, remindersSent: 0 } }
  },
}))

export const useAI = () => {
  const store = useAIStore()
  return {
    ...store,
    reliabilityInsights: store.reliabilityReport?.players.map(p => ({
      user_id: p.user_id, username: p.username,
      reliability_score: p.reliability_score, trend: p.trend, warning: p.warning
    })) || []
  }
}
