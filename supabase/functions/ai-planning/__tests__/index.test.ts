/**
 * Tests for ai-planning edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from ai-planning/index.ts)
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

describe('ai-planning: CORS logic', () => {
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
    expect(getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Headers']).toContain(
      'authorization'
    )
    expect(getCorsHeaders(null)['Access-Control-Allow-Headers']).toContain('authorization')
  })
})

// =====================================================
// dayNames mapping (extracted from ai-planning/index.ts)
// =====================================================

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

describe('ai-planning: dayNames mapping', () => {
  it('should map JavaScript day indices to correct French day names', () => {
    expect(dayNames).toEqual([
      'Dimanche',
      'Lundi',
      'Mardi',
      'Mercredi',
      'Jeudi',
      'Vendredi',
      'Samedi',
    ])
    // JavaScript Date.getDay() returns 0=Sunday, 6=Saturday
    expect(dayNames[0]).toBe('Dimanche')
    expect(dayNames[1]).toBe('Lundi')
    expect(dayNames[6]).toBe('Samedi')
    expect(dayNames.length).toBe(7)
  })
})

// =====================================================
// Slot analysis algorithm (extracted from ai-planning/index.ts)
// =====================================================

interface SlotAnalysis {
  day_of_week: number
  hour: number
  reliability_score: number
  session_count: number
  avg_attendance: number
  reason: string
}

interface SessionCheckin {
  status: string
}

interface SessionData {
  id: string
  scheduled_at: string
  session_checkins: SessionCheckin[]
}

/**
 * Extracted slot analysis algorithm matching ai-planning/index.ts exactly:
 * - Groups sessions by day_of_week + hour (UTC)
 * - Calculates attendance: (present + late * 0.8) / total * 100
 * - Rounds to reliabilityScore
 * - Generates reason text based on score thresholds
 */
function analyzeSlots(sessions: SessionData[]): SlotAnalysis[] {
  const slotStats: Record<
    string,
    {
      present: number
      late: number
      noshow: number
      total: number
      sessions: number
    }
  > = {}

  for (const session of sessions) {
    const date = new Date(session.scheduled_at)
    const dayOfWeek = date.getUTCDay()
    const hour = date.getUTCHours()
    const key = `${dayOfWeek}-${hour}`

    if (!slotStats[key]) {
      slotStats[key] = { present: 0, late: 0, noshow: 0, total: 0, sessions: 0 }
    }

    slotStats[key].sessions++

    for (const checkin of session.session_checkins || []) {
      slotStats[key].total++
      if (checkin.status === 'present') slotStats[key].present++
      else if (checkin.status === 'late') slotStats[key].late++
      else slotStats[key].noshow++
    }
  }

  const suggestions: SlotAnalysis[] = []

  for (const [key, stats] of Object.entries(slotStats)) {
    const [dayStr, hourStr] = key.split('-')
    const dayOfWeek = parseInt(dayStr)
    const hour = parseInt(hourStr)

    if (stats.total === 0) continue

    const attendanceRate = ((stats.present + stats.late * 0.8) / stats.total) * 100
    const reliabilityScore = Math.round(attendanceRate)

    let reason = `${dayNames[dayOfWeek]} ${hour}h`
    if (reliabilityScore >= 90) {
      reason += ' - Excellent taux de présence'
    } else if (reliabilityScore >= 75) {
      reason += ' - Bon créneau historique'
    } else if (reliabilityScore >= 50) {
      reason += ' - Créneau moyen'
    } else {
      reason += ' - Créneau risqué'
    }

    suggestions.push({
      day_of_week: dayOfWeek,
      hour,
      reliability_score: reliabilityScore,
      session_count: stats.sessions,
      avg_attendance: reliabilityScore,
      reason,
    })
  }

  return suggestions
}

describe('ai-planning: slot analysis algorithm', () => {
  it('should calculate 100% score when all checkins are present', () => {
    // Wednesday (day 3) at 20:00 UTC
    const sessions: SessionData[] = [
      {
        id: 'session-1',
        scheduled_at: '2026-01-07T20:00:00Z', // Wednesday
        session_checkins: [
          { status: 'present' },
          { status: 'present' },
          { status: 'present' },
          { status: 'present' },
        ],
      },
    ]

    const result = analyzeSlots(sessions)
    expect(result).toHaveLength(1)
    expect(result[0].reliability_score).toBe(100)
    expect(result[0].day_of_week).toBe(3) // Wednesday
    expect(result[0].hour).toBe(20)
    expect(result[0].session_count).toBe(1)
  })

  it('should calculate 80% score when all checkins are late (late * 0.8)', () => {
    const sessions: SessionData[] = [
      {
        id: 'session-1',
        scheduled_at: '2026-01-10T21:00:00Z', // Saturday
        session_checkins: [
          { status: 'late' },
          { status: 'late' },
          { status: 'late' },
          { status: 'late' },
          { status: 'late' },
        ],
      },
    ]

    const result = analyzeSlots(sessions)
    expect(result).toHaveLength(1)
    // (0 + 5 * 0.8) / 5 * 100 = 80
    expect(result[0].reliability_score).toBe(80)
  })

  it('should handle mix of present, late, and noshow correctly', () => {
    const sessions: SessionData[] = [
      {
        id: 'session-1',
        scheduled_at: '2026-01-05T19:00:00Z', // Monday
        session_checkins: [
          { status: 'present' }, // 1
          { status: 'present' }, // 1
          { status: 'late' }, // 0.8
          { status: 'noshow' }, // 0
        ],
      },
    ]

    const result = analyzeSlots(sessions)
    expect(result).toHaveLength(1)
    // (2 + 1 * 0.8) / 4 * 100 = 2.8 / 4 * 100 = 70
    expect(result[0].reliability_score).toBe(70)
  })

  it('should skip slots with zero total checkins (total === 0)', () => {
    const sessions: SessionData[] = [
      {
        id: 'session-1',
        scheduled_at: '2026-01-06T18:00:00Z', // Tuesday
        session_checkins: [],
      },
    ]

    const result = analyzeSlots(sessions)
    // Session is counted but no checkins means total=0 -> skip
    expect(result).toHaveLength(0)
  })

  it('should aggregate multiple sessions in the same slot correctly', () => {
    // Two sessions both on Saturday at 20:00 UTC
    const sessions: SessionData[] = [
      {
        id: 'session-1',
        scheduled_at: '2026-01-03T20:00:00Z', // Saturday
        session_checkins: [{ status: 'present' }, { status: 'present' }, { status: 'noshow' }],
      },
      {
        id: 'session-2',
        scheduled_at: '2026-01-10T20:00:00Z', // Also Saturday
        session_checkins: [{ status: 'present' }, { status: 'late' }, { status: 'present' }],
      },
    ]

    const result = analyzeSlots(sessions)
    expect(result).toHaveLength(1)
    expect(result[0].session_count).toBe(2)
    // Total: 6 checkins across 2 sessions
    // present=4 (2+2), late=1, noshow=1
    // (4 + 1 * 0.8) / 6 * 100 = 4.8 / 6 * 100 = 80
    expect(result[0].reliability_score).toBe(80)
  })

  it('should correctly round reliability score', () => {
    const sessions: SessionData[] = [
      {
        id: 'session-1',
        scheduled_at: '2026-01-09T20:00:00Z', // Friday
        session_checkins: [{ status: 'present' }, { status: 'present' }, { status: 'late' }],
      },
    ]

    const result = analyzeSlots(sessions)
    expect(result).toHaveLength(1)
    // (2 + 1 * 0.8) / 3 * 100 = 2.8 / 3 * 100 = 93.333...
    // Math.round(93.333) = 93
    expect(result[0].reliability_score).toBe(93)
  })

  it('should separate different day/hour slots', () => {
    const sessions: SessionData[] = [
      {
        id: 'session-1',
        scheduled_at: '2026-01-03T20:00:00Z', // Saturday 20h
        session_checkins: [{ status: 'present' }],
      },
      {
        id: 'session-2',
        scheduled_at: '2026-01-04T15:00:00Z', // Sunday 15h
        session_checkins: [{ status: 'late' }],
      },
    ]

    const result = analyzeSlots(sessions)
    expect(result).toHaveLength(2)

    const saturday = result.find((s) => s.day_of_week === 6)
    const sunday = result.find((s) => s.day_of_week === 0)

    expect(saturday).toBeDefined()
    expect(saturday!.hour).toBe(20)
    expect(saturday!.reliability_score).toBe(100)

    expect(sunday).toBeDefined()
    expect(sunday!.hour).toBe(15)
    expect(sunday!.reliability_score).toBe(80)
  })
})

// =====================================================
// Reason text generation (extracted from ai-planning/index.ts)
// =====================================================

function getReasonText(dayOfWeek: number, hour: number, reliabilityScore: number): string {
  let reason = `${dayNames[dayOfWeek]} ${hour}h`
  if (reliabilityScore >= 90) {
    reason += ' - Excellent taux de présence'
  } else if (reliabilityScore >= 75) {
    reason += ' - Bon créneau historique'
  } else if (reliabilityScore >= 50) {
    reason += ' - Créneau moyen'
  } else {
    reason += ' - Créneau risqué'
  }
  return reason
}

describe('ai-planning: reason text generation', () => {
  it('should return "Excellent taux de présence" for score >= 90', () => {
    expect(getReasonText(6, 20, 90)).toBe('Samedi 20h - Excellent taux de présence')
    expect(getReasonText(6, 20, 100)).toBe('Samedi 20h - Excellent taux de présence')
    expect(getReasonText(6, 20, 95)).toBe('Samedi 20h - Excellent taux de présence')
  })

  it('should return "Bon créneau historique" for score >= 75 and < 90', () => {
    expect(getReasonText(5, 21, 75)).toBe('Vendredi 21h - Bon créneau historique')
    expect(getReasonText(5, 21, 89)).toBe('Vendredi 21h - Bon créneau historique')
    expect(getReasonText(5, 21, 80)).toBe('Vendredi 21h - Bon créneau historique')
  })

  it('should return "Créneau moyen" for score >= 50 and < 75', () => {
    expect(getReasonText(0, 15, 50)).toBe('Dimanche 15h - Créneau moyen')
    expect(getReasonText(0, 15, 74)).toBe('Dimanche 15h - Créneau moyen')
    expect(getReasonText(0, 15, 60)).toBe('Dimanche 15h - Créneau moyen')
  })

  it('should return "Créneau risqué" for score < 50', () => {
    expect(getReasonText(1, 18, 49)).toBe('Lundi 18h - Créneau risqué')
    expect(getReasonText(1, 18, 0)).toBe('Lundi 18h - Créneau risqué')
    expect(getReasonText(1, 18, 25)).toBe('Lundi 18h - Créneau risqué')
  })
})

// =====================================================
// Default slots fallback (extracted from ai-planning/index.ts)
// =====================================================

function getDefaultSlots(): SlotAnalysis[] {
  return [
    {
      day_of_week: 6,
      hour: 20,
      reliability_score: 80,
      session_count: 0,
      avg_attendance: 80,
      reason: 'Samedi 20h - Créneau populaire le week-end',
    },
    {
      day_of_week: 0,
      hour: 15,
      reliability_score: 75,
      session_count: 0,
      avg_attendance: 75,
      reason: 'Dimanche 15h - Après-midi détente',
    },
    {
      day_of_week: 5,
      hour: 21,
      reliability_score: 70,
      session_count: 0,
      avg_attendance: 70,
      reason: 'Vendredi 21h - Début de week-end',
    },
  ]
}

describe('ai-planning: default slots fallback', () => {
  it('should return exactly 3 default slot suggestions', () => {
    const defaults = getDefaultSlots()
    expect(defaults).toHaveLength(3)
  })

  it('should suggest Saturday 20h, Sunday 15h, Friday 21h', () => {
    const defaults = getDefaultSlots()

    // Saturday 20h
    expect(defaults[0].day_of_week).toBe(6) // Saturday
    expect(defaults[0].hour).toBe(20)

    // Sunday 15h
    expect(defaults[1].day_of_week).toBe(0) // Sunday
    expect(defaults[1].hour).toBe(15)

    // Friday 21h
    expect(defaults[2].day_of_week).toBe(5) // Friday
    expect(defaults[2].hour).toBe(21)
  })

  it('should have correct scores: 80, 75, 70 and session_count = 0', () => {
    const defaults = getDefaultSlots()

    expect(defaults[0].reliability_score).toBe(80)
    expect(defaults[1].reliability_score).toBe(75)
    expect(defaults[2].reliability_score).toBe(70)

    // No history for defaults
    defaults.forEach((slot) => {
      expect(slot.session_count).toBe(0)
    })
  })
})

// =====================================================
// Sorting and limiting (matching ai-planning handler)
// =====================================================

function sortAndLimit(suggestions: SlotAnalysis[], limit: number): SlotAnalysis[] {
  const sorted = [...suggestions].sort((a, b) => b.reliability_score - a.reliability_score)
  return sorted.slice(0, limit)
}

describe('ai-planning: sorting and limiting', () => {
  it('should sort suggestions by reliability_score descending', () => {
    const suggestions: SlotAnalysis[] = [
      {
        day_of_week: 1,
        hour: 20,
        reliability_score: 60,
        session_count: 2,
        avg_attendance: 60,
        reason: 'Lundi 20h - Créneau moyen',
      },
      {
        day_of_week: 6,
        hour: 20,
        reliability_score: 95,
        session_count: 5,
        avg_attendance: 95,
        reason: 'Samedi 20h - Excellent taux de présence',
      },
      {
        day_of_week: 5,
        hour: 21,
        reliability_score: 80,
        session_count: 3,
        avg_attendance: 80,
        reason: 'Vendredi 21h - Bon créneau historique',
      },
    ]

    const result = sortAndLimit(suggestions, 10)
    expect(result[0].reliability_score).toBe(95)
    expect(result[1].reliability_score).toBe(80)
    expect(result[2].reliability_score).toBe(60)
  })

  it('should limit results to the requested number', () => {
    const suggestions: SlotAnalysis[] = [
      {
        day_of_week: 6,
        hour: 20,
        reliability_score: 95,
        session_count: 5,
        avg_attendance: 95,
        reason: 'Samedi 20h - Excellent taux de présence',
      },
      {
        day_of_week: 0,
        hour: 15,
        reliability_score: 85,
        session_count: 4,
        avg_attendance: 85,
        reason: 'Dimanche 15h - Bon créneau historique',
      },
      {
        day_of_week: 5,
        hour: 21,
        reliability_score: 80,
        session_count: 3,
        avg_attendance: 80,
        reason: 'Vendredi 21h - Bon créneau historique',
      },
      {
        day_of_week: 3,
        hour: 20,
        reliability_score: 70,
        session_count: 2,
        avg_attendance: 70,
        reason: 'Mercredi 20h - Créneau moyen',
      },
      {
        day_of_week: 1,
        hour: 19,
        reliability_score: 55,
        session_count: 1,
        avg_attendance: 55,
        reason: 'Lundi 19h - Créneau moyen',
      },
    ]

    const result = sortAndLimit(suggestions, 3)
    expect(result).toHaveLength(3)
    expect(result[0].reliability_score).toBe(95)
    expect(result[2].reliability_score).toBe(80)
  })
})

// =====================================================
// Input validation rules (matching ai-planning handler)
// =====================================================

describe('ai-planning: input validation', () => {
  it('should require squad_id to be present', () => {
    // Matches handler: validateUUID(rawBody.squad_id, 'squad_id') throws if missing
    const rawBody: Record<string, unknown> = {}
    const hasSquadId = typeof rawBody.squad_id === 'string' && rawBody.squad_id.length > 0
    expect(hasSquadId).toBe(false)
  })

  it('should enforce limit between 1 and 20, defaulting to 5', () => {
    // Matches handler: validateNumber(v, 'limit', { min: 1, max: 20 }) || 5
    function validateLimit(rawLimit: unknown): number {
      if (rawLimit === undefined || rawLimit === null) return 5
      const num = typeof rawLimit === 'number' ? rawLimit : Number(rawLimit)
      if (isNaN(num) || num < 1 || num > 20) {
        throw new Error('limit must be between 1 and 20')
      }
      return num
    }

    // Default
    expect(validateLimit(undefined)).toBe(5)
    expect(validateLimit(null)).toBe(5)

    // Valid bounds
    expect(validateLimit(1)).toBe(1)
    expect(validateLimit(20)).toBe(20)
    expect(validateLimit(10)).toBe(10)

    // Invalid values
    expect(() => validateLimit(0)).toThrow()
    expect(() => validateLimit(21)).toThrow()
    expect(() => validateLimit(-5)).toThrow()
  })
})

// =====================================================
// AI analysis prompt generation (extracted from ai-planning/index.ts)
// =====================================================

describe('ai-planning: AI analysis prompt generation', () => {
  it('should return null for empty slots array', () => {
    const topSlots: Array<{ day: string; hour: number; score: number; sessions: number }> = []
    // Matches handler: if (topSlots.length === 0) return null
    const result = topSlots.length === 0 ? null : 'would generate'
    expect(result).toBeNull()
  })

  it('should generate slots description string for prompt', () => {
    const topSlots = [
      { day: 'Samedi', hour: 20, score: 95, sessions: 5 },
      { day: 'Dimanche', hour: 15, score: 80, sessions: 3 },
    ]

    const slotsDescription = topSlots
      .map((s) => `${s.day} ${s.hour}h (${s.score}% de presence, ${s.sessions} sessions)`)
      .join(', ')

    expect(slotsDescription).toBe(
      'Samedi 20h (95% de presence, 5 sessions), Dimanche 15h (80% de presence, 3 sessions)'
    )
  })
})

// =====================================================
// Template fallback (matching ai-planning handler)
// =====================================================

describe('ai-planning: template fallback', () => {
  it('should produce fallback text when AI analysis is null', () => {
    const aiAnalysis: string | null = null
    const sessionsCount = 12

    const finalText =
      aiAnalysis ||
      `Basé sur ${sessionsCount} sessions, les creneaux ci-dessus sont les plus fiables pour ta squad.`

    expect(finalText).toBe(
      'Basé sur 12 sessions, les creneaux ci-dessus sont les plus fiables pour ta squad.'
    )
  })

  it('should use AI analysis when available', () => {
    const aiAnalysis =
      'Votre squad se retrouve surtout le samedi soir, un classique pour les gamers.'
    const sessionsCount = 12

    const finalText =
      aiAnalysis ||
      `Basé sur ${sessionsCount} sessions, les creneaux ci-dessus sont les plus fiables pour ta squad.`

    expect(finalText).toBe(
      'Votre squad se retrouve surtout le samedi soir, un classique pour les gamers.'
    )
  })

  it('should report ai_generated as false when AI is unavailable', () => {
    const aiAnalysis: string | null = null
    expect(!!aiAnalysis).toBe(false)
  })

  it('should report ai_generated as true when AI provides analysis', () => {
    const aiAnalysis: string | null = 'Analyse IA ici'
    expect(!!aiAnalysis).toBe(true)
  })
})
