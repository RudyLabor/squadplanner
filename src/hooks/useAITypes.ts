export async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
      }
    }
  }
  throw lastError
}

export interface SlotSuggestion {
  day_of_week: number
  hour: number
  reliability_score: number
  session_count: number
  avg_attendance: number
  reason: string
}

export interface DecisionDetails {
  present_count: number
  absent_count: number
  maybe_count: number
  no_response_count: number
  total_members: number
  min_players: number
  response_rate: number
  time_until_session: number
}

export interface DecisionRecommendation {
  recommended_action: 'confirm' | 'cancel' | 'reschedule' | 'wait'
  confidence: number
  reason: string
  details: DecisionDetails
  alternative_slots?: SlotSuggestion[]
}

export interface PlayerReliability {
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

export interface SquadReliabilityReport {
  squad_id: string
  squad_name: string
  avg_reliability: number
  total_sessions: number
  players: PlayerReliability[]
  insights: string[]
}

export interface CoachTip {
  id: string
  type: 'planning' | 'engagement' | 'timing' | 'general'
  content: string
  data?: Record<string, unknown>
}

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

export interface AIInsight {
  id: string
  insight_type: string
  content: Record<string, unknown>
  is_dismissed: boolean
  created_at: string
}

export interface AIState {
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
  fetchSlotSuggestions: (squadId: string) => Promise<void>
  fetchDecisionRecommendation: (sessionId: string) => Promise<void>
  fetchReliabilityReport: (squadId: string) => Promise<void>
  fetchPlayerReliability: (userId: string) => Promise<PlayerReliability | null>
  fetchCoachTips: (squadId: string) => Promise<void>
  fetchAICoachTip: (userId: string, contextType?: 'profile' | 'home') => Promise<AICoachTip | null>
  fetchInsights: (squadId: string) => Promise<void>
  dismissInsight: (insightId: string) => Promise<void>
  getSlotReliability: (squadId: string, dayOfWeek: number, hour: number) => Promise<number>
  triggerRsvpReminder: (
    squadId?: string,
    sessionId?: string
  ) => Promise<{ success: boolean; remindersSent: number }>
  clearError: () => void
}

export const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
