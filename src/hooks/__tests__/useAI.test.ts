import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockFunctionsInvoke, mockFrom, mockRpc, mockSupabase } = vi.hoisted(() => {
  const mockFunctionsInvoke = vi.fn()
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockSupabase = {
    functions: { invoke: mockFunctionsInvoke },
    from: mockFrom,
    rpc: mockRpc,
  }
  return { mockFunctionsInvoke, mockFrom, mockRpc, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

import { useAIStore } from '../useAI'

describe('useAIStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useAIStore.setState({
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
      })
    })
  })

  it('has correct initial state', () => {
    const state = useAIStore.getState()
    expect(state.slotSuggestions).toEqual([])
    expect(state.hasSlotHistory).toBe(false)
    expect(state.decisionRecommendation).toBeNull()
    expect(state.reliabilityReport).toBeNull()
    expect(state.coachTips).toEqual([])
    expect(state.aiCoachTip).toBeNull()
    expect(state.aiCoachTipLoading).toBe(false)
    expect(state.insights).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  describe('clearError', () => {
    it('sets error to null', () => {
      act(() => {
        useAIStore.setState({ error: 'some error' })
      })
      expect(useAIStore.getState().error).toBe('some error')

      act(() => {
        useAIStore.getState().clearError()
      })
      expect(useAIStore.getState().error).toBeNull()
    })
  })

  describe('fetchSlotSuggestions', () => {
    it('sets suggestions on success', async () => {
      const mockSuggestions = [
        {
          day_of_week: 6,
          hour: 20,
          reliability_score: 80,
          session_count: 5,
          avg_attendance: 85,
          reason: 'Popular slot',
        },
      ]
      mockFunctionsInvoke.mockResolvedValue({
        data: { suggestions: mockSuggestions, has_history: true },
        error: null,
      })

      await act(async () => {
        await useAIStore.getState().fetchSlotSuggestions('squad-1')
      })

      const state = useAIStore.getState()
      expect(state.slotSuggestions).toEqual(mockSuggestions)
      expect(state.hasSlotHistory).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('ai-planning', {
        body: { squad_id: 'squad-1', limit: 5 },
      })
    })

    it('returns empty suggestions on error', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      })

      await act(async () => {
        await useAIStore.getState().fetchSlotSuggestions('squad-1')
      })

      const state = useAIStore.getState()
      expect(state.slotSuggestions).toHaveLength(0)
      expect(state.hasSlotHistory).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Pas assez de données pour suggérer des créneaux')
    })
  })

  describe('fetchDecisionRecommendation', () => {
    it('sets recommendation on success', async () => {
      const mockRecommendation = {
        recommended_action: 'confirm' as const,
        confidence: 0.85,
        reason: 'Enough players',
        details: {
          present_count: 5,
          absent_count: 1,
          maybe_count: 0,
          no_response_count: 0,
          total_members: 6,
          min_players: 4,
          response_rate: 1.0,
          time_until_session: 3600,
        },
      }
      mockFunctionsInvoke.mockResolvedValue({
        data: { recommendation: mockRecommendation },
        error: null,
      })

      await act(async () => {
        await useAIStore.getState().fetchDecisionRecommendation('session-1')
      })

      const state = useAIStore.getState()
      expect(state.decisionRecommendation).toEqual(mockRecommendation)
      expect(state.isLoading).toBe(false)
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('ai-decision', {
        body: { session_id: 'session-1' },
      })
    })

    it('sets null on error', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      })

      await act(async () => {
        await useAIStore.getState().fetchDecisionRecommendation('session-1')
      })

      const state = useAIStore.getState()
      expect(state.decisionRecommendation).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeTruthy()
    })
  })

  describe('fetchReliabilityReport', () => {
    it('sets report on success', async () => {
      const mockReport = {
        squad_id: 'squad-1',
        squad_name: 'Test Squad',
        avg_reliability: 85,
        total_sessions: 20,
        players: [],
        insights: ['Great attendance!'],
      }
      mockFunctionsInvoke.mockResolvedValue({
        data: { report: mockReport },
        error: null,
      })

      await act(async () => {
        await useAIStore.getState().fetchReliabilityReport('squad-1')
      })

      const state = useAIStore.getState()
      expect(state.reliabilityReport).toEqual(mockReport)
      expect(state.isLoading).toBe(false)
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('ai-reliability', {
        body: { squad_id: 'squad-1' },
      })
    })

    it('sets null on error', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      })

      await act(async () => {
        await useAIStore.getState().fetchReliabilityReport('squad-1')
      })

      const state = useAIStore.getState()
      expect(state.reliabilityReport).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeTruthy()
    })
  })

  describe('fetchPlayerReliability', () => {
    it('returns player data on success', async () => {
      const mockPlayer = {
        user_id: 'user-1',
        username: 'TestPlayer',
        avatar_url: null,
        reliability_score: 90,
        trend: 'stable' as const,
        stats: {
          total_sessions: 10,
          present_count: 9,
          late_count: 1,
          noshow_count: 0,
          maybe_to_present_rate: 0.8,
        },
        badges: ['reliable'],
        warning: null,
      }
      mockFunctionsInvoke.mockResolvedValue({
        data: { player: mockPlayer },
        error: null,
      })

      let result: any
      await act(async () => {
        result = await useAIStore.getState().fetchPlayerReliability('user-1')
      })

      expect(result).toEqual(mockPlayer)
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('ai-reliability', {
        body: { user_id: 'user-1' },
      })
    })

    it('returns null on error', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      })

      let result: any
      await act(async () => {
        result = await useAIStore.getState().fetchPlayerReliability('user-1')
      })

      expect(result).toBeNull()
    })
  })

  describe('fetchInsights', () => {
    it('sets insights from database', async () => {
      const mockInsights = [
        {
          id: 'ins-1',
          insight_type: 'attendance',
          content: { message: 'Good' },
          is_dismissed: false,
          created_at: '2025-01-01',
        },
        {
          id: 'ins-2',
          insight_type: 'timing',
          content: { message: 'Try earlier' },
          is_dismissed: false,
          created_at: '2025-01-02',
        },
      ]

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockInsights }),
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useAIStore.getState().fetchInsights('squad-1')
      })

      expect(useAIStore.getState().insights).toEqual(mockInsights)
      expect(mockFrom).toHaveBeenCalledWith('ai_insights')
    })
  })

  describe('dismissInsight', () => {
    it('removes insight from list', async () => {
      // Set up initial insights
      act(() => {
        useAIStore.setState({
          insights: [
            {
              id: 'ins-1',
              insight_type: 'attendance',
              content: {},
              is_dismissed: false,
              created_at: '2025-01-01',
            },
            {
              id: 'ins-2',
              insight_type: 'timing',
              content: {},
              is_dismissed: false,
              created_at: '2025-01-02',
            },
          ],
        })
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      await act(async () => {
        await useAIStore.getState().dismissInsight('ins-1')
      })

      const state = useAIStore.getState()
      expect(state.insights).toHaveLength(1)
      expect(state.insights[0].id).toBe('ins-2')
      expect(mockFrom).toHaveBeenCalledWith('ai_insights')
    })
  })

  describe('getSlotReliability', () => {
    it('returns data from RPC', async () => {
      mockRpc.mockResolvedValue({ data: 85, error: null })

      let result: number = 0
      await act(async () => {
        result = await useAIStore.getState().getSlotReliability('squad-1', 6, 20)
      })

      expect(result).toBe(85)
      expect(mockRpc).toHaveBeenCalledWith('get_slot_reliability', {
        p_squad_id: 'squad-1',
        p_day_of_week: 6,
        p_hour: 20,
      })
    })

    it('returns 50 as fallback on error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } })

      let result: number = 0
      await act(async () => {
        result = await useAIStore.getState().getSlotReliability('squad-1', 6, 20)
      })

      expect(result).toBe(50)
    })
  })

  describe('triggerRsvpReminder', () => {
    it('returns success result', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { success: true, reminders_sent: 3 },
        error: null,
      })

      let result: any
      await act(async () => {
        result = await useAIStore.getState().triggerRsvpReminder('squad-1', 'session-1')
      })

      expect(result).toEqual({ success: true, remindersSent: 3 })
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('ai-rsvp-reminder', {
        body: { squad_id: 'squad-1', session_id: 'session-1' },
      })
    })

    it('returns failure on error', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      })

      let result: any
      await act(async () => {
        result = await useAIStore.getState().triggerRsvpReminder('squad-1')
      })

      expect(result).toEqual({ success: false, remindersSent: 0 })
    })
  })

  describe('fetchAICoachTip', () => {
    it('returns tip on success', async () => {
      const mockTip = {
        tip: 'Keep up the great work!',
        tone: 'celebration' as const,
        context: {
          reliability_score: 95,
          trend: 'improving' as const,
          days_since_last_session: 1,
          recent_noshows: 0,
          upcoming_sessions: 2,
        },
      }
      mockFunctionsInvoke.mockResolvedValue({
        data: mockTip,
        error: null,
      })

      let result: any
      await act(async () => {
        result = await useAIStore.getState().fetchAICoachTip('user-1', 'profile')
      })

      expect(result).toEqual(mockTip)
      expect(useAIStore.getState().aiCoachTip).toEqual(mockTip)
      expect(useAIStore.getState().aiCoachTipLoading).toBe(false)
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('ai-coach', {
        body: { user_id: 'user-1', context_type: 'profile' },
      })
    })

    it('returns fallback tip on error', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      })

      let result: any
      await act(async () => {
        result = await useAIStore.getState().fetchAICoachTip('user-1')
      })

      expect(result).toEqual({
        tip: "Pr\u00eat pour la prochaine session ? Tes potes t'attendent !",
        tone: 'encouragement',
      })
      expect(useAIStore.getState().aiCoachTip).toEqual({
        tip: "Pr\u00eat pour la prochaine session ? Tes potes t'attendent !",
        tone: 'encouragement',
      })
      expect(useAIStore.getState().aiCoachTipLoading).toBe(false)
    })
  })
})
