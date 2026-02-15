import { describe, it, expect } from 'vitest'
import { withBackoff, dayNames } from '../useAITypes'
import type {
  SlotSuggestion,
  DecisionDetails,
  DecisionRecommendation,
  PlayerReliability,
  SquadReliabilityReport,
  CoachTip,
  AICoachTip,
  AIInsight,
  AIState,
} from '../useAITypes'

describe('useAITypes', () => {
  it('module can be imported', () => {
    expect(withBackoff).toBeDefined()
    expect(dayNames).toBeDefined()
  })

  it('dayNames is a 7-element array starting with Dimanche', () => {
    expect(dayNames).toHaveLength(7)
    expect(dayNames[0]).toBe('Dimanche')
    expect(dayNames[6]).toBe('Samedi')
  })

  describe('withBackoff', () => {
    it('returns value on success', async () => {
      const result = await withBackoff(() => Promise.resolve('ok'))
      expect(result).toBe('ok')
    })

    it('retries on failure and succeeds', async () => {
      let attempt = 0
      const result = await withBackoff(() => {
        attempt++
        if (attempt < 2) throw new Error('fail')
        return Promise.resolve('recovered')
      }, 3)
      expect(result).toBe('recovered')
      expect(attempt).toBe(2)
    })

    it('throws after max retries', async () => {
      await expect(
        withBackoff(() => Promise.reject(new Error('always fails')), 1)
      ).rejects.toThrow('always fails')
    })
  })

  it('SlotSuggestion type is usable', () => {
    const slot: SlotSuggestion = {
      day_of_week: 3,
      hour: 21,
      reliability_score: 85,
      session_count: 10,
      avg_attendance: 4.5,
      reason: 'Best slot',
    }
    expect(slot.day_of_week).toBe(3)
  })

  it('DecisionRecommendation type is usable', () => {
    const details: DecisionDetails = {
      present_count: 3,
      absent_count: 1,
      maybe_count: 2,
      no_response_count: 0,
      total_members: 6,
      min_players: 3,
      response_rate: 100,
      time_until_session: 3600,
    }
    const rec: DecisionRecommendation = {
      recommended_action: 'confirm',
      confidence: 0.9,
      reason: 'Enough players',
      details,
    }
    expect(rec.recommended_action).toBe('confirm')
  })

  it('PlayerReliability type is usable', () => {
    const player: PlayerReliability = {
      user_id: 'u1',
      username: 'test',
      avatar_url: null,
      reliability_score: 90,
      trend: 'improving',
      stats: {
        total_sessions: 10,
        present_count: 9,
        late_count: 1,
        noshow_count: 0,
        maybe_to_present_rate: 0.8,
      },
      badges: ['mvp'],
      warning: null,
    }
    expect(player.trend).toBe('improving')
  })

  it('SquadReliabilityReport type is usable', () => {
    const report: SquadReliabilityReport = {
      squad_id: 's1',
      squad_name: 'Test Squad',
      avg_reliability: 85,
      total_sessions: 20,
      players: [],
      insights: ['Good squad'],
    }
    expect(report.squad_name).toBe('Test Squad')
  })

  it('CoachTip type is usable', () => {
    const tip: CoachTip = {
      id: 't1',
      type: 'planning',
      content: 'Plan more sessions',
    }
    expect(tip.type).toBe('planning')
  })

  it('AICoachTip type is usable', () => {
    const tip: AICoachTip = {
      tip: 'Great job!',
      tone: 'celebration',
    }
    expect(tip.tone).toBe('celebration')
  })

  it('AIInsight type is usable', () => {
    const insight: AIInsight = {
      id: 'i1',
      insight_type: 'slot_suggestion',
      content: {},
      is_dismissed: false,
      created_at: '2026-01-01',
    }
    expect(insight.is_dismissed).toBe(false)
  })

  it('AIState type is structurally valid', () => {
    // Just verify the type can be referenced in a type assertion
    const partial: Partial<AIState> = {
      isLoading: false,
      error: null,
    }
    expect(partial.isLoading).toBe(false)
  })
})
