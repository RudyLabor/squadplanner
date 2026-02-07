import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Types for AI features
interface SlotSuggestion {
  day_of_week: number
  hour: number
  reliability_score: number
  session_count: number
  avg_attendance: number
  reason: string
}

interface DecisionDetails {
  present_count: number
  absent_count: number
  maybe_count: number
  no_response_count: number
  total_members: number
  min_players: number
  response_rate: number
  time_until_session: number
}

interface DecisionRecommendation {
  recommended_action: 'confirm' | 'cancel' | 'reschedule' | 'wait'
  confidence: number
  reason: string
  details: DecisionDetails
  alternative_slots?: SlotSuggestion[]
}

interface PlayerReliability {
  user_id: string
  username: string
  avatar_url: string | null
  reliability_score: number
  trend: 'improving' | 'stable' | 'declining'
  stats: {
    total_sessions: number
    present_count: number
    late_count: number
    noshow_count: number
    maybe_to_present_rate: number
  }
  badges: string[]
  warning: string | null
}

interface SquadReliabilityReport {
  squad_id: string
  squad_name: string
  avg_reliability: number
  total_sessions: number
  players: PlayerReliability[]
  insights: string[]
}

interface CoachTip {
  id: string
  type: 'planning' | 'engagement' | 'timing' | 'general'
  content: string
  data?: Record<string, unknown>
}

interface AICoachTip {
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

interface AIInsight {
  id: string
  insight_type: string
  content: Record<string, unknown>
  is_dismissed: boolean
  created_at: string
}

interface AIState {
  slotSuggestions: SlotSuggestion[]
  hasSlotHistory: boolean
  decisionRecommendation: DecisionRecommendation | null
  reliabilityReport: SquadReliabilityReport | null
  coachTips: CoachTip[]
  aiCoachTip: AICoachTip | null
  aiCoachTipLoading: boolean
  insights: AIInsight[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchSlotSuggestions: (squadId: string) => Promise<void>
  fetchDecisionRecommendation: (sessionId: string) => Promise<void>
  fetchReliabilityReport: (squadId: string) => Promise<void>
  fetchPlayerReliability: (userId: string) => Promise<PlayerReliability | null>
  fetchCoachTips: (squadId: string) => Promise<void>
  fetchAICoachTip: (userId: string, contextType?: 'profile' | 'home') => Promise<AICoachTip | null>
  fetchInsights: (squadId: string) => Promise<void>
  dismissInsight: (insightId: string) => Promise<void>
  getSlotReliability: (squadId: string, dayOfWeek: number, hour: number) => Promise<number>
  triggerRsvpReminder: (squadId?: string, sessionId?: string) => Promise<{ success: boolean; remindersSent: number }>
  clearError: () => void
}

// Day names for display
const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

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

  // ===== AI PLANNING - Edge Function =====
  fetchSlotSuggestions: async (squadId: string) => {
    try {
      set({ isLoading: true, error: null })

      const { data, error } = await supabase.functions.invoke('ai-planning', {
        body: { squad_id: squadId, limit: 5 }
      })

      if (error) {
        console.error('Edge Function error:', error)
        throw new Error(error.message || 'Erreur lors de l\'analyse des créneaux')
      }

      if (data?.suggestions) {
        set({
          slotSuggestions: data.suggestions,
          hasSlotHistory: data.has_history || false,
          isLoading: false
        })
      } else {
        // Fallback if no data
        set({
          slotSuggestions: [],
          hasSlotHistory: false,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Error in fetchSlotSuggestions:', error)
      // Fallback to default suggestions
      const fallbackSuggestions: SlotSuggestion[] = [
        { day_of_week: 6, hour: 20, reliability_score: 80, session_count: 0, avg_attendance: 80, reason: `${dayNames[6]} 20h - Créneau populaire le week-end` },
        { day_of_week: 0, hour: 15, reliability_score: 75, session_count: 0, avg_attendance: 75, reason: `${dayNames[0]} 15h - Après-midi détente` },
        { day_of_week: 4, hour: 21, reliability_score: 70, session_count: 0, avg_attendance: 70, reason: `${dayNames[4]} 21h - Soirée en semaine` },
      ]
      set({
        slotSuggestions: fallbackSuggestions,
        hasSlotHistory: false,
        isLoading: false,
        error: 'Suggestions par défaut (pas assez d\'historique)'
      })
    }
  },

  // ===== AI DECISION - Edge Function =====
  fetchDecisionRecommendation: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null })

      const { data, error } = await supabase.functions.invoke('ai-decision', {
        body: { session_id: sessionId }
      })

      if (error) {
        console.error('Edge Function error:', error)
        throw new Error(error.message || 'Erreur lors de l\'analyse de décision')
      }

      if (data?.recommendation) {
        set({
          decisionRecommendation: data.recommendation,
          isLoading: false
        })
      } else {
        set({
          decisionRecommendation: null,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Error in fetchDecisionRecommendation:', error)
      set({
        decisionRecommendation: null,
        isLoading: false,
        error: 'Impossible d\'obtenir la recommandation'
      })
    }
  },

  // ===== AI RELIABILITY - Edge Function (Squad Report) =====
  fetchReliabilityReport: async (squadId: string) => {
    try {
      set({ isLoading: true, error: null })

      const { data, error } = await supabase.functions.invoke('ai-reliability', {
        body: { squad_id: squadId }
      })

      if (error) {
        console.error('Edge Function error:', error)
        throw new Error(error.message || 'Erreur lors de l\'analyse de fiabilité')
      }

      if (data?.report) {
        set({
          reliabilityReport: data.report,
          isLoading: false
        })
      } else {
        set({
          reliabilityReport: null,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Error in fetchReliabilityReport:', error)
      set({
        reliabilityReport: null,
        isLoading: false,
        error: 'Impossible d\'obtenir le rapport de fiabilité'
      })
    }
  },

  // ===== AI RELIABILITY - Edge Function (Individual Player) =====
  fetchPlayerReliability: async (userId: string): Promise<PlayerReliability | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-reliability', {
        body: { user_id: userId }
      })

      if (error) {
        console.error('Edge Function error:', error)
        return null
      }

      return data?.player || null
    } catch (error) {
      console.error('Error in fetchPlayerReliability:', error)
      return null
    }
  },

  // ===== COACH TIPS - Client-side analysis =====
  fetchCoachTips: async (squadId: string) => {
    try {
      set({ isLoading: true, error: null })

      // Fetch squad stats
      const { data: squad } = await supabase
        .from('squads')
        .select('total_sessions, total_members')
        .eq('id', squadId)
        .single()

      // Fetch recent sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('scheduled_at, status, created_at')
        .eq('squad_id', squadId)
        .order('scheduled_at', { ascending: false })
        .limit(20)

      const tips: CoachTip[] = []
      const completedSessions = sessions?.filter(s => s.status === 'completed') || []

      // Tip 1: Check if they plan ahead
      if (completedSessions.length > 0) {
        const avgLeadTime = completedSessions.reduce((acc, s) => {
          const scheduled = new Date(s.scheduled_at)
          const created = new Date(s.created_at)
          return acc + (scheduled.getTime() - created.getTime()) / (1000 * 60 * 60)
        }, 0) / completedSessions.length

        if (avgLeadTime < 48) {
          tips.push({
            id: 'plan-ahead',
            type: 'planning',
            content: 'Vos sessions ont +40% de présence quand elles sont planifiées 48h à l\'avance.',
            data: { avgLeadTimeHours: Math.round(avgLeadTime) }
          })
        }
      }

      // Tip 2: Check session frequency
      if (squad && squad.total_sessions < 5) {
        tips.push({
          id: 'more-sessions',
          type: 'engagement',
          content: 'Les squads qui jouent régulièrement (2+ fois/semaine) ont des membres 3x plus engagés.',
        })
      }

      // Tip 3: Time-based insights
      const eveningSessions = completedSessions.filter(s => {
        const hour = new Date(s.scheduled_at).getHours()
        return hour >= 22
      }).length

      if (completedSessions.length > 0 && eveningSessions > completedSessions.length * 0.5) {
        tips.push({
          id: 'late-sessions',
          type: 'timing',
          content: 'Les sessions après 22h ont +35% de no-show. Essayez des créneaux plus tôt.',
          data: { eveningRatio: Math.round((eveningSessions / completedSessions.length) * 100) }
        })
      }

      // Tip 4: Weekend vs weekday
      const weekendSessions = completedSessions.filter(s => {
        const day = new Date(s.scheduled_at).getDay()
        return day === 0 || day === 6
      }).length

      if (completedSessions.length >= 5 && weekendSessions < completedSessions.length * 0.3) {
        tips.push({
          id: 'try-weekends',
          type: 'timing',
          content: 'Les sessions du week-end ont généralement +20% de participation.',
        })
      }

      // Default tip if no specific insights
      if (tips.length === 0) {
        tips.push({
          id: 'general',
          type: 'general',
          content: 'Utilisez le RSVP obligatoire pour augmenter l\'engagement de votre squad.',
        })
      }

      set({ coachTips: tips, isLoading: false })
    } catch (error) {
      console.error('Error in fetchCoachTips:', error)
      set({ coachTips: [], isLoading: false })
    }
  },

  // ===== AI COACH TIP - Edge Function (Personal Coach) =====
  fetchAICoachTip: async (userId: string, contextType: 'profile' | 'home' = 'profile'): Promise<AICoachTip | null> => {
    try {
      set({ aiCoachTipLoading: true })

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { user_id: userId, context_type: contextType }
      })

      if (error) {
        console.error('Edge Function error:', error)
        // Return a fallback tip
        const fallback: AICoachTip = {
          tip: 'Prêt pour la prochaine session ? Tes potes t\'attendent !',
          tone: 'encouragement'
        }
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
    } catch (error) {
      console.error('Error in fetchAICoachTip:', error)
      // Return a fallback tip
      const fallback: AICoachTip = {
        tip: 'Prêt pour la prochaine session ? Tes potes t\'attendent !',
        tone: 'encouragement'
      }
      set({ aiCoachTip: fallback, aiCoachTipLoading: false })
      return fallback
    }
  },

  // ===== AI INSIGHTS from Database =====
  fetchInsights: async (squadId: string) => {
    try {
      const { data } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('squad_id', squadId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10)

      set({ insights: (data || []) as AIInsight[] })
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  },

  dismissInsight: async (insightId: string) => {
    try {
      await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', insightId)

      set(state => ({
        insights: state.insights.filter(i => i.id !== insightId)
      }))
    } catch (error) {
      console.error('Error dismissing insight:', error)
    }
  },

  // ===== SLOT RELIABILITY - Database RPC =====
  getSlotReliability: async (squadId: string, dayOfWeek: number, hour: number) => {
    try {
      const { data, error } = await supabase.rpc('get_slot_reliability', {
        p_squad_id: squadId,
        p_day_of_week: dayOfWeek,
        p_hour: hour
      })

      if (error) {
        console.error('Error getting slot reliability:', error)
        return 50 // Default fallback
      }

      return data || 50
    } catch (error) {
      console.error('Error in getSlotReliability:', error)
      return 50
    }
  },

  // ===== AI RSVP REMINDER - Edge Function =====
  triggerRsvpReminder: async (squadId?: string, sessionId?: string) => {
    try {
      const body: Record<string, string> = {}
      if (squadId) body.squad_id = squadId
      if (sessionId) body.session_id = sessionId

      const { data, error } = await supabase.functions.invoke('ai-rsvp-reminder', {
        body
      })

      if (error) {
        console.error('Edge Function error:', error)
        return { success: false, remindersSent: 0 }
      }

      return {
        success: data?.success || false,
        remindersSent: data?.reminders_sent || 0
      }
    } catch (error) {
      console.error('Error in triggerRsvpReminder:', error)
      return { success: false, remindersSent: 0 }
    }
  },
}))

// Backward compatibility export for reliabilityInsights
export const useAI = () => {
  const store = useAIStore()
  return {
    ...store,
    // Map reliabilityReport.players to old reliabilityInsights format
    reliabilityInsights: store.reliabilityReport?.players.map(p => ({
      user_id: p.user_id,
      username: p.username,
      reliability_score: p.reliability_score,
      trend: p.trend,
      warning: p.warning
    })) || []
  }
}
