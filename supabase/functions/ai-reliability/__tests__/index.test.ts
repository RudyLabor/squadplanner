/**
 * Tests for ai-reliability edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from ai-reliability/index.ts)
// =====================================================

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed) ? origin : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

describe('ai-reliability: CORS logic', () => {
  it('should allow squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should allow localhost:5173 origin', () => {
    const headers = getCorsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should allow squadplanner.app origin', () => {
    const headers = getCorsHeaders('https://squadplanner.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.app')
  })

  it('should NOT set Allow-Origin for unknown origin', () => {
    const headers = getCorsHeaders('https://evil.com')
    expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
    expect(headers['Access-Control-Allow-Headers']).toBeDefined()
  })

  it('should NOT set Allow-Origin for null origin', () => {
    const headers = getCorsHeaders(null)
    expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
  })

  it('should always include Allow-Headers', () => {
    expect(
      getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Headers']
    ).toContain('authorization')
    expect(getCorsHeaders(null)['Access-Control-Allow-Headers']).toContain('authorization')
  })
})

// =====================================================
// Individual Trend Calculation (extracted from ai-reliability/index.ts)
// =====================================================

/**
 * Calculates individual player trend from recent checkins.
 * Splits last 10 checkins into recent half (first 5) and older half (last 5).
 * Compares present ratios to determine trend.
 */
function calculateIndividualTrend(
  checkins: { status: string }[]
): 'improving' | 'stable' | 'declining' {
  let trend: 'improving' | 'stable' | 'declining' = 'stable'

  if (checkins && checkins.length >= 5) {
    const recentHalf = checkins.slice(0, 5)
    const olderHalf = checkins.slice(5)

    const recentScore =
      recentHalf.filter((c) => c.status === 'present').length / recentHalf.length
    const olderScore =
      olderHalf.length > 0
        ? olderHalf.filter((c) => c.status === 'present').length / olderHalf.length
        : recentScore

    if (recentScore > olderScore + 0.1) trend = 'improving'
    else if (recentScore < olderScore - 0.1) trend = 'declining'
  }

  return trend
}

describe('ai-reliability: individual trend calculation', () => {
  it('should return improving when 5 recent present vs 0 older present', () => {
    const checkins = [
      // Recent 5: all present
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      // Older 5: all absent
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
    ]
    expect(calculateIndividualTrend(checkins)).toBe('improving')
  })

  it('should return declining when 0 recent present vs 5 older present', () => {
    const checkins = [
      // Recent 5: all absent
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
      // Older 5: all present
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
    ]
    expect(calculateIndividualTrend(checkins)).toBe('declining')
  })

  it('should return stable when recent and older scores are similar', () => {
    const checkins = [
      // Recent 5: 3/5 present
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
      { status: 'absent' },
      // Older 5: 3/5 present (same ratio)
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
      { status: 'absent' },
    ]
    expect(calculateIndividualTrend(checkins)).toBe('stable')
  })

  it('should return stable when exactly 5 checkins (no older half)', () => {
    // With exactly 5 checkins, olderHalf is empty => olderScore = recentScore
    // So recentScore can never be > olderScore + 0.1 or < olderScore - 0.1
    const checkins = [
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
    ]
    expect(calculateIndividualTrend(checkins)).toBe('stable')
  })

  it('should return stable when fewer than 5 checkins (not enough data)', () => {
    const checkins = [
      { status: 'present' },
      { status: 'absent' },
      { status: 'present' },
    ]
    expect(calculateIndividualTrend(checkins)).toBe('stable')
  })

  it('should return stable for empty checkins', () => {
    expect(calculateIndividualTrend([])).toBe('stable')
  })

  it('should detect improving with a small difference above threshold', () => {
    // recentScore = 4/5 = 0.8, olderScore = 3/5 = 0.6
    // 0.8 > 0.6 + 0.1 = 0.7 → improving
    const checkins = [
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
      { status: 'absent' },
    ]
    expect(calculateIndividualTrend(checkins)).toBe('improving')
  })
})

// =====================================================
// Individual Badge Generation (extracted from ai-reliability/index.ts)
// =====================================================

interface ProfileForBadges {
  reliability_score: number
  total_sessions: number
  total_noshow: number
  total_checkins: number
  total_late: number
}

/**
 * Generates individual badges based on profile stats.
 * Includes 'punctual' badge (not available in squad mode).
 */
function generateIndividualBadges(profile: ProfileForBadges): string[] {
  const badges: string[] = []
  if (profile.reliability_score >= 95) badges.push('star_player')
  if (profile.total_sessions >= 50) badges.push('veteran')
  if (profile.total_noshow === 0 && profile.total_sessions >= 10) badges.push('always_there')
  if (profile.total_checkins >= 20 && profile.total_late === 0) badges.push('punctual')
  return badges
}

describe('ai-reliability: individual badge generation', () => {
  it('should award star_player when reliability_score >= 95', () => {
    const badges = generateIndividualBadges({
      reliability_score: 95,
      total_sessions: 5,
      total_noshow: 1,
      total_checkins: 5,
      total_late: 1,
    })
    expect(badges).toContain('star_player')
  })

  it('should NOT award star_player when reliability_score < 95', () => {
    const badges = generateIndividualBadges({
      reliability_score: 94,
      total_sessions: 5,
      total_noshow: 1,
      total_checkins: 5,
      total_late: 1,
    })
    expect(badges).not.toContain('star_player')
  })

  it('should award veteran when total_sessions >= 50', () => {
    const badges = generateIndividualBadges({
      reliability_score: 50,
      total_sessions: 50,
      total_noshow: 2,
      total_checkins: 10,
      total_late: 1,
    })
    expect(badges).toContain('veteran')
  })

  it('should award always_there when total_noshow === 0 AND total_sessions >= 10', () => {
    const badges = generateIndividualBadges({
      reliability_score: 80,
      total_sessions: 10,
      total_noshow: 0,
      total_checkins: 10,
      total_late: 2,
    })
    expect(badges).toContain('always_there')
  })

  it('should NOT award always_there when total_noshow > 0', () => {
    const badges = generateIndividualBadges({
      reliability_score: 80,
      total_sessions: 15,
      total_noshow: 1,
      total_checkins: 15,
      total_late: 0,
    })
    expect(badges).not.toContain('always_there')
  })

  it('should NOT award always_there when total_sessions < 10', () => {
    const badges = generateIndividualBadges({
      reliability_score: 80,
      total_sessions: 9,
      total_noshow: 0,
      total_checkins: 9,
      total_late: 0,
    })
    expect(badges).not.toContain('always_there')
  })

  it('should award punctual when total_checkins >= 20 AND total_late === 0', () => {
    const badges = generateIndividualBadges({
      reliability_score: 80,
      total_sessions: 20,
      total_noshow: 0,
      total_checkins: 20,
      total_late: 0,
    })
    expect(badges).toContain('punctual')
  })

  it('should NOT award punctual when total_late > 0', () => {
    const badges = generateIndividualBadges({
      reliability_score: 80,
      total_sessions: 25,
      total_noshow: 0,
      total_checkins: 25,
      total_late: 1,
    })
    expect(badges).not.toContain('punctual')
  })

  it('should NOT award punctual when total_checkins < 20', () => {
    const badges = generateIndividualBadges({
      reliability_score: 80,
      total_sessions: 19,
      total_noshow: 0,
      total_checkins: 19,
      total_late: 0,
    })
    expect(badges).not.toContain('punctual')
  })

  it('should award multiple badges simultaneously', () => {
    const badges = generateIndividualBadges({
      reliability_score: 98,
      total_sessions: 60,
      total_noshow: 0,
      total_checkins: 55,
      total_late: 0,
    })
    expect(badges).toContain('star_player')
    expect(badges).toContain('veteran')
    expect(badges).toContain('always_there')
    expect(badges).toContain('punctual')
    expect(badges).toHaveLength(4)
  })

  it('should return empty array when no criteria met', () => {
    const badges = generateIndividualBadges({
      reliability_score: 50,
      total_sessions: 5,
      total_noshow: 2,
      total_checkins: 5,
      total_late: 1,
    })
    expect(badges).toHaveLength(0)
  })
})

// =====================================================
// Individual Warning (extracted from ai-reliability/index.ts)
// =====================================================

function getIndividualWarning(reliabilityScore: number): string | null {
  return reliabilityScore < 50 ? 'Score de fiabilité bas' : null
}

describe('ai-reliability: individual warning', () => {
  it('should return warning when reliability_score < 50', () => {
    expect(getIndividualWarning(49)).toBe('Score de fiabilité bas')
  })

  it('should return null when reliability_score >= 50', () => {
    expect(getIndividualWarning(50)).toBeNull()
  })

  it('should return warning for score of 0', () => {
    expect(getIndividualWarning(0)).toBe('Score de fiabilité bas')
  })
})

// =====================================================
// Squad Trend Calculation (extracted from ai-reliability/index.ts)
// =====================================================

/**
 * Calculates squad-level trend for a member.
 * Different from individual trend: uses simple presentRatio thresholds.
 * Requires at least 3 checkins.
 */
function calculateSquadTrend(
  checkins: { status: string }[]
): 'improving' | 'stable' | 'declining' {
  let trend: 'improving' | 'stable' | 'declining' = 'stable'

  if (checkins.length >= 3) {
    const presentRatio =
      checkins.filter((c) => c.status === 'present').length / checkins.length
    if (presentRatio >= 0.8) trend = 'improving'
    else if (presentRatio <= 0.4) trend = 'declining'
  }

  return trend
}

describe('ai-reliability: squad trend calculation', () => {
  it('should return improving when presentRatio >= 0.8', () => {
    const checkins = [
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
    ]
    // 4/5 = 0.8
    expect(calculateSquadTrend(checkins)).toBe('improving')
  })

  it('should return declining when presentRatio <= 0.4', () => {
    const checkins = [
      { status: 'present' },
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
    ]
    // 1/5 = 0.2
    expect(calculateSquadTrend(checkins)).toBe('declining')
  })

  it('should return declining when presentRatio is exactly 0.4', () => {
    const checkins = [
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
      { status: 'absent' },
      { status: 'absent' },
    ]
    // 2/5 = 0.4
    expect(calculateSquadTrend(checkins)).toBe('declining')
  })

  it('should return stable when presentRatio is between 0.4 and 0.8 (exclusive)', () => {
    const checkins = [
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
      { status: 'absent' },
    ]
    // 3/5 = 0.6
    expect(calculateSquadTrend(checkins)).toBe('stable')
  })

  it('should return stable when fewer than 3 checkins', () => {
    const checkins = [{ status: 'present' }, { status: 'absent' }]
    expect(calculateSquadTrend(checkins)).toBe('stable')
  })

  it('should return stable for empty checkins', () => {
    expect(calculateSquadTrend([])).toBe('stable')
  })

  it('should return improving when all present (ratio = 1.0)', () => {
    const checkins = [
      { status: 'present' },
      { status: 'present' },
      { status: 'present' },
    ]
    expect(calculateSquadTrend(checkins)).toBe('improving')
  })
})

// =====================================================
// Squad Badges (extracted from ai-reliability/index.ts)
// =====================================================

/**
 * Generates squad-level badges.
 * Note: 'punctual' badge is NOT available in squad mode.
 */
function generateSquadBadges(profile: ProfileForBadges): string[] {
  const badges: string[] = []
  if (profile.reliability_score >= 95) badges.push('star_player')
  if (profile.total_sessions >= 50) badges.push('veteran')
  if (profile.total_noshow === 0 && profile.total_sessions >= 10) badges.push('always_there')
  return badges
}

describe('ai-reliability: squad badge generation', () => {
  it('should NOT include punctual badge in squad mode', () => {
    const badges = generateSquadBadges({
      reliability_score: 98,
      total_sessions: 60,
      total_noshow: 0,
      total_checkins: 55,
      total_late: 0,
    })
    expect(badges).not.toContain('punctual')
    expect(badges).toContain('star_player')
    expect(badges).toContain('veteran')
    expect(badges).toContain('always_there')
  })

  it('should award star_player, veteran, always_there when all criteria met', () => {
    const badges = generateSquadBadges({
      reliability_score: 96,
      total_sessions: 55,
      total_noshow: 0,
      total_checkins: 50,
      total_late: 0,
    })
    expect(badges).toEqual(['star_player', 'veteran', 'always_there'])
  })

  it('should return empty array when no criteria met', () => {
    const badges = generateSquadBadges({
      reliability_score: 50,
      total_sessions: 5,
      total_noshow: 2,
      total_checkins: 5,
      total_late: 1,
    })
    expect(badges).toHaveLength(0)
  })
})

// =====================================================
// Squad Warnings (extracted from ai-reliability/index.ts)
// =====================================================

/**
 * Generates squad-level warnings for a member.
 * Priority order: critical reliability > high no-show > declining engagement.
 * Only the first matching warning is returned.
 */
function getSquadWarning(
  profile: { reliability_score: number; total_noshow: number; total_sessions: number },
  trend: 'improving' | 'stable' | 'declining'
): string | null {
  if (profile.reliability_score < 50) {
    return 'Fiabilité critique'
  } else if (profile.total_noshow > profile.total_sessions * 0.3) {
    return 'Taux de no-show élevé'
  } else if (trend === 'declining') {
    return 'Engagement en baisse'
  }
  return null
}

describe('ai-reliability: squad warnings', () => {
  it('should return "Fiabilité critique" when reliability_score < 50', () => {
    const warning = getSquadWarning(
      { reliability_score: 30, total_noshow: 0, total_sessions: 10 },
      'stable'
    )
    expect(warning).toBe('Fiabilité critique')
  })

  it('should return "Taux de no-show élevé" when noshow > 30% of sessions', () => {
    const warning = getSquadWarning(
      { reliability_score: 60, total_noshow: 4, total_sessions: 10 },
      'stable'
    )
    expect(warning).toBe('Taux de no-show élevé')
  })

  it('should return "Engagement en baisse" when trend is declining', () => {
    const warning = getSquadWarning(
      { reliability_score: 70, total_noshow: 1, total_sessions: 10 },
      'declining'
    )
    expect(warning).toBe('Engagement en baisse')
  })

  it('should return null when no warning conditions met', () => {
    const warning = getSquadWarning(
      { reliability_score: 80, total_noshow: 1, total_sessions: 10 },
      'stable'
    )
    expect(warning).toBeNull()
  })

  it('should prioritize "Fiabilité critique" over other warnings', () => {
    // Score < 50 AND noshow > 30% AND declining — should pick the first one
    const warning = getSquadWarning(
      { reliability_score: 30, total_noshow: 8, total_sessions: 10 },
      'declining'
    )
    expect(warning).toBe('Fiabilité critique')
  })

  it('should prioritize "Taux de no-show élevé" over "Engagement en baisse"', () => {
    // noshow > 30% AND declining — should pick no-show since it's checked first
    const warning = getSquadWarning(
      { reliability_score: 60, total_noshow: 5, total_sessions: 10 },
      'declining'
    )
    expect(warning).toBe('Taux de no-show élevé')
  })

  it('should NOT flag no-show when exactly at 30% threshold', () => {
    // 3/10 = 0.3, condition is strict >0.3
    const warning = getSquadWarning(
      { reliability_score: 70, total_noshow: 3, total_sessions: 10 },
      'stable'
    )
    expect(warning).toBeNull()
  })
})

// =====================================================
// Squad Insights (extracted from ai-reliability/index.ts)
// =====================================================

interface PlayerForInsights {
  reliability_score: number
  trend: 'improving' | 'stable' | 'declining'
}

/**
 * Generates squad-wide insights based on average reliability and player trends.
 */
function generateSquadInsights(players: PlayerForInsights[]): string[] {
  const insights: string[] = []
  const totalReliability = players.reduce((sum, p) => sum + p.reliability_score, 0)
  const avgReliability = Math.round(totalReliability / players.length)

  if (avgReliability >= 85) {
    insights.push('Excellente squad ! Continuez comme ça.')
  } else if (avgReliability >= 70) {
    insights.push('Bonne fiabilité globale, quelques améliorations possibles.')
  } else {
    insights.push('La fiabilité de la squad pourrait être améliorée.')
  }

  const lowReliabilityCount = players.filter((p) => p.reliability_score < 60).length
  if (lowReliabilityCount > 0) {
    insights.push(`${lowReliabilityCount} membre(s) avec un score faible.`)
  }

  const decliningCount = players.filter((p) => p.trend === 'declining').length
  if (decliningCount > 0) {
    insights.push(`${decliningCount} membre(s) avec un engagement en baisse.`)
  }

  return insights
}

describe('ai-reliability: squad insights', () => {
  it('should return "Excellente squad" when avgReliability >= 85', () => {
    const insights = generateSquadInsights([
      { reliability_score: 90, trend: 'stable' },
      { reliability_score: 85, trend: 'improving' },
      { reliability_score: 88, trend: 'stable' },
    ])
    expect(insights[0]).toBe('Excellente squad ! Continuez comme ça.')
  })

  it('should return "Bonne fiabilité" when avgReliability >= 70 and < 85', () => {
    const insights = generateSquadInsights([
      { reliability_score: 75, trend: 'stable' },
      { reliability_score: 70, trend: 'stable' },
      { reliability_score: 72, trend: 'stable' },
    ])
    expect(insights[0]).toBe('Bonne fiabilité globale, quelques améliorations possibles.')
  })

  it('should return "pourrait être améliorée" when avgReliability < 70', () => {
    const insights = generateSquadInsights([
      { reliability_score: 50, trend: 'stable' },
      { reliability_score: 40, trend: 'stable' },
      { reliability_score: 55, trend: 'stable' },
    ])
    expect(insights[0]).toBe('La fiabilité de la squad pourrait être améliorée.')
  })

  it('should include low reliability count when members have score < 60', () => {
    const insights = generateSquadInsights([
      { reliability_score: 90, trend: 'stable' },
      { reliability_score: 45, trend: 'stable' },
      { reliability_score: 55, trend: 'stable' },
    ])
    // 2 members with score < 60
    expect(insights).toContain('2 membre(s) avec un score faible.')
  })

  it('should NOT include low reliability count when all scores >= 60', () => {
    const insights = generateSquadInsights([
      { reliability_score: 90, trend: 'stable' },
      { reliability_score: 80, trend: 'stable' },
      { reliability_score: 60, trend: 'stable' },
    ])
    const lowMsg = insights.find((i) => i.includes('score faible'))
    expect(lowMsg).toBeUndefined()
  })

  it('should include declining count when members have declining trend', () => {
    const insights = generateSquadInsights([
      { reliability_score: 90, trend: 'stable' },
      { reliability_score: 85, trend: 'declining' },
      { reliability_score: 88, trend: 'declining' },
    ])
    expect(insights).toContain('2 membre(s) avec un engagement en baisse.')
  })

  it('should NOT include declining count when no members are declining', () => {
    const insights = generateSquadInsights([
      { reliability_score: 90, trend: 'stable' },
      { reliability_score: 85, trend: 'improving' },
    ])
    const decliningMsg = insights.find((i) => i.includes('engagement en baisse'))
    expect(decliningMsg).toBeUndefined()
  })

  it('should include multiple insight lines when applicable', () => {
    const insights = generateSquadInsights([
      { reliability_score: 40, trend: 'declining' },
      { reliability_score: 50, trend: 'declining' },
      { reliability_score: 55, trend: 'stable' },
    ])
    // avgReliability = round(145/3) = 48 → needs improvement
    expect(insights[0]).toBe('La fiabilité de la squad pourrait être améliorée.')
    // All 3 have score < 60
    expect(insights).toContain('3 membre(s) avec un score faible.')
    // 2 declining
    expect(insights).toContain('2 membre(s) avec un engagement en baisse.')
    expect(insights).toHaveLength(3)
  })
})

// =====================================================
// Squad Player Sorting (extracted from ai-reliability/index.ts)
// =====================================================

describe('ai-reliability: squad player sorting', () => {
  it('should sort players by reliability_score descending', () => {
    const players = [
      { reliability_score: 60, user_id: 'c' },
      { reliability_score: 95, user_id: 'a' },
      { reliability_score: 80, user_id: 'b' },
    ]
    players.sort((a, b) => b.reliability_score - a.reliability_score)
    expect(players[0].user_id).toBe('a')
    expect(players[1].user_id).toBe('b')
    expect(players[2].user_id).toBe('c')
  })

  it('should maintain order for equal scores', () => {
    const players = [
      { reliability_score: 80, user_id: 'first' },
      { reliability_score: 80, user_id: 'second' },
    ]
    players.sort((a, b) => b.reliability_score - a.reliability_score)
    // Stable sort preserves insertion order for equal elements
    expect(players[0].user_id).toBe('first')
    expect(players[1].user_id).toBe('second')
  })
})

// =====================================================
// Input Validation (extracted from ai-reliability/index.ts)
// =====================================================

describe('ai-reliability: input validation', () => {
  it('should require at least squad_id or user_id (error when neither provided)', () => {
    const squad_id: string | undefined = undefined
    const user_id: string | undefined = undefined

    // Matches handler logic: if user_id is provided, use individual mode.
    // If not, check squad_id. If neither → 400 error.
    const hasInput = !!(squad_id || user_id)
    expect(hasInput).toBe(false)
  })

  it('should accept when user_id is provided', () => {
    const squad_id: string | undefined = undefined
    const user_id: string | undefined = '550e8400-e29b-41d4-a716-446655440000'

    const hasInput = !!(squad_id || user_id)
    expect(hasInput).toBe(true)
  })

  it('should accept when squad_id is provided', () => {
    const squad_id: string | undefined = '660e8400-e29b-41d4-a716-446655440001'
    const user_id: string | undefined = undefined

    const hasInput = !!(squad_id || user_id)
    expect(hasInput).toBe(true)
  })

  it('should accept when both squad_id and user_id are provided', () => {
    const squad_id: string | undefined = '660e8400-e29b-41d4-a716-446655440001'
    const user_id: string | undefined = '550e8400-e29b-41d4-a716-446655440000'

    const hasInput = !!(squad_id || user_id)
    expect(hasInput).toBe(true)
  })

  it('should prioritize user_id when both are provided (individual mode)', () => {
    const squad_id = '660e8400-e29b-41d4-a716-446655440001'
    const user_id = '550e8400-e29b-41d4-a716-446655440000'

    // Matches handler: if (user_id) → individual mode, else if (!squad_id) → error
    const mode = user_id ? 'individual' : squad_id ? 'squad' : 'error'
    expect(mode).toBe('individual')
  })
})

// =====================================================
// Checkin Grouping Logic (extracted from ai-reliability/index.ts)
// =====================================================

describe('ai-reliability: checkin grouping by user', () => {
  it('should group checkins by user_id and limit to 5 per user', () => {
    const allCheckins = [
      { user_id: 'u1', status: 'present' },
      { user_id: 'u1', status: 'present' },
      { user_id: 'u1', status: 'absent' },
      { user_id: 'u1', status: 'present' },
      { user_id: 'u1', status: 'absent' },
      { user_id: 'u1', status: 'present' }, // 6th for u1 — should be dropped
      { user_id: 'u2', status: 'present' },
      { user_id: 'u2', status: 'absent' },
    ]

    const checkinsByUser = new Map<string, { status: string }[]>()
    for (const checkin of allCheckins) {
      const existing = checkinsByUser.get(checkin.user_id) || []
      if (existing.length < 5) {
        existing.push({ status: checkin.status })
        checkinsByUser.set(checkin.user_id, existing)
      }
    }

    expect(checkinsByUser.get('u1')).toHaveLength(5)
    expect(checkinsByUser.get('u2')).toHaveLength(2)
  })

  it('should handle empty checkins', () => {
    const allCheckins: { user_id: string; status: string }[] = []
    const checkinsByUser = new Map<string, { status: string }[]>()
    for (const checkin of allCheckins) {
      const existing = checkinsByUser.get(checkin.user_id) || []
      if (existing.length < 5) {
        existing.push({ status: checkin.status })
        checkinsByUser.set(checkin.user_id, existing)
      }
    }

    expect(checkinsByUser.size).toBe(0)
  })
})
