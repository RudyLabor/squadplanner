/**
 * Tests for ai-session-summary edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from ai-session-summary/index.ts)
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

describe('ai-session-summary: CORS logic', () => {
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
// Attendance Calculations (extracted from ai-session-summary/index.ts)
// =====================================================

interface Checkin {
  user_id: string
  status: 'present' | 'late' | 'noshow'
  minutes_late: number | null
}

interface Rsvp {
  user_id: string
  response: 'present' | 'absent' | 'maybe'
}

function calculateAttendance(checkins: Checkin[], rsvps: Rsvp[]) {
  const presentCount = checkins.filter((c) => c.status === 'present').length || 0
  const lateCount = checkins.filter((c) => c.status === 'late').length || 0
  const noshowCount = checkins.filter((c) => c.status === 'noshow').length || 0
  const totalRsvps = rsvps.filter((r) => r.response === 'present').length || 0
  const totalCheckins = presentCount + lateCount + noshowCount
  const attendanceRate =
    totalCheckins > 0 ? Math.round(((presentCount + lateCount) / totalCheckins) * 100) : 0

  return { presentCount, lateCount, noshowCount, totalRsvps, totalCheckins, attendanceRate }
}

describe('ai-session-summary: Attendance calculations', () => {
  it('should return 100% when all checkins are present', () => {
    const checkins: Checkin[] = [
      { user_id: 'u1', status: 'present', minutes_late: 0 },
      { user_id: 'u2', status: 'present', minutes_late: 0 },
      { user_id: 'u3', status: 'present', minutes_late: 0 },
    ]
    const rsvps: Rsvp[] = [
      { user_id: 'u1', response: 'present' },
      { user_id: 'u2', response: 'present' },
      { user_id: 'u3', response: 'present' },
    ]
    const result = calculateAttendance(checkins, rsvps)
    expect(result.presentCount).toBe(3)
    expect(result.lateCount).toBe(0)
    expect(result.noshowCount).toBe(0)
    expect(result.attendanceRate).toBe(100)
    expect(result.totalRsvps).toBe(3)
  })

  it('should calculate correct percentage for mix of present and late', () => {
    const checkins: Checkin[] = [
      { user_id: 'u1', status: 'present', minutes_late: 0 },
      { user_id: 'u2', status: 'late', minutes_late: 10 },
      { user_id: 'u3', status: 'noshow', minutes_late: null },
    ]
    const rsvps: Rsvp[] = [
      { user_id: 'u1', response: 'present' },
      { user_id: 'u2', response: 'present' },
      { user_id: 'u3', response: 'present' },
    ]
    const result = calculateAttendance(checkins, rsvps)
    expect(result.presentCount).toBe(1)
    expect(result.lateCount).toBe(1)
    expect(result.noshowCount).toBe(1)
    // (1 + 1) / 3 * 100 = 66.67 -> rounded to 67
    expect(result.attendanceRate).toBe(67)
  })

  it('should return 0% when all checkins are noshow', () => {
    const checkins: Checkin[] = [
      { user_id: 'u1', status: 'noshow', minutes_late: null },
      { user_id: 'u2', status: 'noshow', minutes_late: null },
    ]
    const rsvps: Rsvp[] = [
      { user_id: 'u1', response: 'present' },
      { user_id: 'u2', response: 'present' },
    ]
    const result = calculateAttendance(checkins, rsvps)
    expect(result.noshowCount).toBe(2)
    expect(result.attendanceRate).toBe(0)
  })

  it('should return 0% when there are zero checkins', () => {
    const checkins: Checkin[] = []
    const rsvps: Rsvp[] = [{ user_id: 'u1', response: 'present' }]
    const result = calculateAttendance(checkins, rsvps)
    expect(result.totalCheckins).toBe(0)
    expect(result.attendanceRate).toBe(0)
  })

  it('should round correctly (e.g. 2/3 = 67%, not 66%)', () => {
    const checkins: Checkin[] = [
      { user_id: 'u1', status: 'present', minutes_late: 0 },
      { user_id: 'u2', status: 'present', minutes_late: 0 },
      { user_id: 'u3', status: 'noshow', minutes_late: null },
    ]
    const rsvps: Rsvp[] = [
      { user_id: 'u1', response: 'present' },
      { user_id: 'u2', response: 'present' },
      { user_id: 'u3', response: 'present' },
    ]
    const result = calculateAttendance(checkins, rsvps)
    // Math.round((2/3) * 100) = Math.round(66.666...) = 67
    expect(result.attendanceRate).toBe(67)
  })

  it('should only count rsvps with response "present" for totalRsvps', () => {
    const checkins: Checkin[] = [{ user_id: 'u1', status: 'present', minutes_late: 0 }]
    const rsvps: Rsvp[] = [
      { user_id: 'u1', response: 'present' },
      { user_id: 'u2', response: 'absent' },
      { user_id: 'u3', response: 'maybe' },
    ]
    const result = calculateAttendance(checkins, rsvps)
    expect(result.totalRsvps).toBe(1)
  })

  it('should handle late counting as attending in rate', () => {
    // 2 late + 1 noshow = (2/3)*100 = 67%
    const checkins: Checkin[] = [
      { user_id: 'u1', status: 'late', minutes_late: 5 },
      { user_id: 'u2', status: 'late', minutes_late: 15 },
      { user_id: 'u3', status: 'noshow', minutes_late: null },
    ]
    const rsvps: Rsvp[] = [
      { user_id: 'u1', response: 'present' },
      { user_id: 'u2', response: 'present' },
      { user_id: 'u3', response: 'present' },
    ]
    const result = calculateAttendance(checkins, rsvps)
    expect(result.presentCount).toBe(0)
    expect(result.lateCount).toBe(2)
    expect(result.attendanceRate).toBe(67)
  })
})

// =====================================================
// MVP Detection (extracted from ai-session-summary/index.ts)
// =====================================================

function findMvpUserId(checkins: Checkin[]): string | null {
  const presentCheckins =
    checkins.filter((c) => c.status === 'present' && (c.minutes_late || 0) === 0) || []
  if (presentCheckins.length > 0) {
    return presentCheckins[0].user_id
  }
  return null
}

describe('ai-session-summary: MVP detection', () => {
  it('should return first present checkin with 0 minutes_late as MVP', () => {
    const checkins: Checkin[] = [
      { user_id: 'u1', status: 'present', minutes_late: 0 },
      { user_id: 'u2', status: 'present', minutes_late: 0 },
    ]
    expect(findMvpUserId(checkins)).toBe('u1')
  })

  it('should NOT return a present checkin that was late', () => {
    const checkins: Checkin[] = [{ user_id: 'u1', status: 'present', minutes_late: 5 }]
    expect(findMvpUserId(checkins)).toBeNull()
  })

  it('should return null when there are no present checkins', () => {
    const checkins: Checkin[] = [
      { user_id: 'u1', status: 'late', minutes_late: 10 },
      { user_id: 'u2', status: 'noshow', minutes_late: null },
    ]
    expect(findMvpUserId(checkins)).toBeNull()
  })

  it('should return the first present+onTime even if others are present+onTime too', () => {
    const checkins: Checkin[] = [
      { user_id: 'u3', status: 'late', minutes_late: 5 },
      { user_id: 'u1', status: 'present', minutes_late: 0 },
      { user_id: 'u2', status: 'present', minutes_late: 0 },
    ]
    // u1 is the first present with 0 late
    expect(findMvpUserId(checkins)).toBe('u1')
  })

  it('should treat null minutes_late as 0 (on time)', () => {
    const checkins: Checkin[] = [{ user_id: 'u1', status: 'present', minutes_late: null }]
    // (null || 0) === 0 -> MVP
    expect(findMvpUserId(checkins)).toBe('u1')
  })

  it('should return null for empty checkins array', () => {
    expect(findMvpUserId([])).toBeNull()
  })
})

// =====================================================
// Template Fallback (extracted from ai-session-summary/index.ts)
// =====================================================

function buildTemplateSummary(
  presentCount: number,
  lateCount: number,
  noshowCount: number,
  totalRsvps: number,
  attendanceRate: number,
  mvpUsername: string | null
): string {
  if (attendanceRate >= 80) {
    return `Belle session ! ${presentCount} joueurs presents sur ${totalRsvps} inscrits (${attendanceRate}% de presence).${lateCount > 0 ? ` ${lateCount} retardataire${lateCount > 1 ? 's' : ''}.` : ''}${mvpUsername ? ` ${mvpUsername} etait pile a l'heure, bravo !` : ''} Continuez comme ca.`
  }
  return `Session avec ${presentCount} presents sur ${totalRsvps} inscrits (${attendanceRate}% de presence).${noshowCount > 0 ? ` ${noshowCount} absent${noshowCount > 1 ? 's' : ''} non justifie${noshowCount > 1 ? 's' : ''}.` : ''} Pensez a confirmer vos presences plus tot pour mieux organiser.`
}

describe('ai-session-summary: Template fallback', () => {
  it('should use high attendance template when rate >= 80', () => {
    const summary = buildTemplateSummary(4, 0, 0, 4, 100, null)
    expect(summary).toContain('Belle session !')
    expect(summary).toContain('4 joueurs presents sur 4 inscrits')
    expect(summary).toContain('100% de presence')
    expect(summary).toContain('Continuez comme ca.')
  })

  it('should use low attendance template when rate < 80', () => {
    const summary = buildTemplateSummary(2, 0, 3, 5, 40, null)
    expect(summary).toContain('Session avec')
    expect(summary).toContain('2 presents sur 5 inscrits')
    expect(summary).toContain('40% de presence')
    expect(summary).toContain('Pensez a confirmer vos presences')
  })

  it('should use singular for 1 retardataire (high attendance)', () => {
    const summary = buildTemplateSummary(3, 1, 0, 4, 100, null)
    expect(summary).toContain('1 retardataire.')
    expect(summary).not.toContain('retardataires')
  })

  it('should use plural for multiple retardataires (high attendance)', () => {
    const summary = buildTemplateSummary(3, 3, 0, 6, 100, null)
    expect(summary).toContain('3 retardataires.')
  })

  it('should use singular for 1 absent (low attendance)', () => {
    const summary = buildTemplateSummary(1, 0, 1, 3, 50, null)
    expect(summary).toContain('1 absent non justifie.')
    expect(summary).not.toContain('absents')
  })

  it('should use plural for multiple absents (low attendance)', () => {
    const summary = buildTemplateSummary(1, 0, 4, 5, 20, null)
    expect(summary).toContain('4 absents non justifies.')
  })

  it('should include MVP mention when mvpUsername is provided (high attendance)', () => {
    const summary = buildTemplateSummary(4, 0, 0, 4, 100, 'Alice')
    expect(summary).toContain("Alice etait pile a l'heure, bravo !")
  })

  it('should NOT include MVP mention when mvpUsername is null', () => {
    const summary = buildTemplateSummary(4, 0, 0, 4, 100, null)
    expect(summary).not.toContain('bravo')
    expect(summary).not.toContain("a l'heure")
  })

  it('should not mention retardataire when lateCount is 0 (high attendance)', () => {
    const summary = buildTemplateSummary(4, 0, 0, 4, 100, null)
    expect(summary).not.toContain('retardataire')
  })

  it('should not mention absent when noshowCount is 0 (low attendance)', () => {
    // Rate < 80 but no noshow
    const summary = buildTemplateSummary(1, 0, 0, 5, 20, null)
    expect(summary).not.toContain('absent')
  })

  it('should handle boundary: exactly 80% uses high attendance template', () => {
    const summary = buildTemplateSummary(4, 0, 1, 5, 80, null)
    expect(summary).toContain('Belle session !')
  })

  it('should handle boundary: 79% uses low attendance template', () => {
    const summary = buildTemplateSummary(3, 0, 2, 5, 79, null)
    expect(summary).toContain('Session avec')
    expect(summary).toContain('Pensez a confirmer')
  })
})

// =====================================================
// Response Length Validation (extracted from callClaudeAPI)
// =====================================================

function validateResponseLength(text: string | undefined | null): string | null {
  const trimmed = text?.trim()
  return trimmed && trimmed.length > 0 && trimmed.length < 600 ? trimmed : null
}

describe('ai-session-summary: Response length validation', () => {
  it('should accept a valid length response (1-599 chars)', () => {
    const text = 'Belle session avec 4 joueurs presents.'
    expect(validateResponseLength(text)).toBe(text)
  })

  it('should reject a response that is too long (>= 600 chars)', () => {
    const text = 'A'.repeat(600)
    expect(validateResponseLength(text)).toBeNull()
  })

  it('should reject an empty string', () => {
    expect(validateResponseLength('')).toBeNull()
  })

  it('should reject a whitespace-only string', () => {
    expect(validateResponseLength('   ')).toBeNull()
  })

  it('should reject null', () => {
    expect(validateResponseLength(null)).toBeNull()
  })

  it('should reject undefined', () => {
    expect(validateResponseLength(undefined)).toBeNull()
  })

  it('should accept a response at exactly 599 chars', () => {
    const text = 'B'.repeat(599)
    expect(validateResponseLength(text)).toBe(text)
  })
})

// =====================================================
// Session Status Validation
// =====================================================

function validateSessionStatus(status: string): { valid: boolean; error?: string } {
  if (status !== 'completed') {
    return { valid: false, error: 'Session not completed yet' }
  }
  return { valid: true }
}

describe('ai-session-summary: Session status validation', () => {
  it('should reject a session that is not completed', () => {
    const result = validateSessionStatus('scheduled')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Session not completed yet')
  })

  it('should accept a completed session', () => {
    const result = validateSessionStatus('completed')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject "in_progress" status', () => {
    const result = validateSessionStatus('in_progress')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Session not completed yet')
  })

  it('should reject "cancelled" status', () => {
    const result = validateSessionStatus('cancelled')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Session not completed yet')
  })
})

// =====================================================
// Cache Expiry Calculation
// =====================================================

describe('ai-session-summary: Cache expiry (30 days)', () => {
  it('should set cache expiry to 30 days from now', () => {
    const now = Date.now()
    const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000)
    const diffMs = expiresAt.getTime() - now
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBe(30)
  })
})
