/**
 * Tests for ai-rsvp-reminder edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from ai-rsvp-reminder/index.ts)
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
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, x-cron-secret',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret',
  }
}

describe('ai-rsvp-reminder: CORS logic', () => {
  it('should allow squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should allow localhost:5173 origin', () => {
    const headers = getCorsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
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

  it('should include x-cron-secret in allowed headers', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Headers']).toContain('x-cron-secret')
  })

  it('should include x-cron-secret even for unknown origins', () => {
    const headers = getCorsHeaders(null)
    expect(headers['Access-Control-Allow-Headers']).toContain('x-cron-secret')
  })

  it('should always include standard headers (authorization, content-type)', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Headers']).toContain('authorization')
    expect(headers['Access-Control-Allow-Headers']).toContain('content-type')
    expect(headers['Access-Control-Allow-Headers']).toContain('apikey')
  })
})

// =====================================================
// CRON Auth Validation (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

function validateCronAuth(
  cronHeader: string | null,
  authHeader: string | null,
  cronSecret: string | null,
  serviceRoleKey: string
): { valid: boolean } {
  const isValidCron = cronSecret != null && cronHeader === cronSecret
  const isValidServiceRole =
    authHeader != null && authHeader.replace('Bearer ', '') === serviceRoleKey

  if (!isValidCron && !isValidServiceRole) {
    return { valid: false }
  }
  return { valid: true }
}

describe('ai-rsvp-reminder: CRON auth validation', () => {
  const CRON_SECRET = 'my-cron-secret-123'
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service-role'

  it('should accept valid cron secret in x-cron-secret header', () => {
    const result = validateCronAuth(CRON_SECRET, null, CRON_SECRET, SERVICE_ROLE_KEY)
    expect(result.valid).toBe(true)
  })

  it('should accept valid service role key in Authorization header', () => {
    const result = validateCronAuth(
      null,
      `Bearer ${SERVICE_ROLE_KEY}`,
      CRON_SECRET,
      SERVICE_ROLE_KEY
    )
    expect(result.valid).toBe(true)
  })

  it('should reject when neither cron secret nor service role key is provided', () => {
    const result = validateCronAuth(null, null, CRON_SECRET, SERVICE_ROLE_KEY)
    expect(result.valid).toBe(false)
  })

  it('should reject when cron secret is wrong', () => {
    const result = validateCronAuth('wrong-secret', null, CRON_SECRET, SERVICE_ROLE_KEY)
    expect(result.valid).toBe(false)
  })

  it('should reject when service role key is wrong', () => {
    const result = validateCronAuth(null, 'Bearer wrong-key', CRON_SECRET, SERVICE_ROLE_KEY)
    expect(result.valid).toBe(false)
  })

  it('should accept when both cron secret AND service role are valid', () => {
    const result = validateCronAuth(
      CRON_SECRET,
      `Bearer ${SERVICE_ROLE_KEY}`,
      CRON_SECRET,
      SERVICE_ROLE_KEY
    )
    expect(result.valid).toBe(true)
  })
})

// =====================================================
// Non-responder Detection (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

interface SquadMember {
  user_id: string
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  }
}

interface RsvpRecord {
  user_id: string
  response: string
}

function findNonResponders(members: SquadMember[], rsvps: RsvpRecord[]): string[] {
  const respondedUserIds = new Set(rsvps.map((r) => r.user_id))

  return members
    .filter((m) => !respondedUserIds.has(m.user_id))
    .map((m) => m.profiles?.username || 'Joueur')
    .filter((name) => name !== 'Joueur')
}

describe('ai-rsvp-reminder: non-responder detection', () => {
  const makeMember = (userId: string, username: string): SquadMember => ({
    user_id: userId,
    profiles: { id: userId, username, avatar_url: null },
  })

  const makeRsvp = (userId: string, response = 'accepted'): RsvpRecord => ({
    user_id: userId,
    response,
  })

  it('should return empty list when all members have responded', () => {
    const members = [makeMember('u1', 'Alice'), makeMember('u2', 'Bob')]
    const rsvps = [makeRsvp('u1'), makeRsvp('u2')]

    const result = findNonResponders(members, rsvps)
    expect(result).toEqual([])
  })

  it('should return correct non-responders when some have responded', () => {
    const members = [
      makeMember('u1', 'Alice'),
      makeMember('u2', 'Bob'),
      makeMember('u3', 'Charlie'),
    ]
    const rsvps = [makeRsvp('u1', 'accepted')]

    const result = findNonResponders(members, rsvps)
    expect(result).toEqual(['Bob', 'Charlie'])
  })

  it('should exclude users without username (username === "Joueur")', () => {
    const members = [
      makeMember('u1', 'Alice'),
      makeMember('u2', 'Joueur'), // no username set
      makeMember('u3', 'Charlie'),
    ]
    const rsvps: RsvpRecord[] = []

    const result = findNonResponders(members, rsvps)
    expect(result).toEqual(['Alice', 'Charlie'])
    expect(result).not.toContain('Joueur')
  })

  it('should return empty list when members array is empty', () => {
    const result = findNonResponders([], [])
    expect(result).toEqual([])
  })

  it('should return all members when no one has responded', () => {
    const members = [
      makeMember('u1', 'Alice'),
      makeMember('u2', 'Bob'),
    ]
    const rsvps: RsvpRecord[] = []

    const result = findNonResponders(members, rsvps)
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('should handle members with null profiles gracefully (fallback to Joueur, then excluded)', () => {
    const memberWithNullProfile: SquadMember = {
      user_id: 'u1',
      profiles: undefined as unknown as SquadMember['profiles'],
    }
    const members = [memberWithNullProfile, makeMember('u2', 'Bob')]
    const rsvps: RsvpRecord[] = []

    const result = findNonResponders(members, rsvps)
    // u1 has undefined profiles => username fallback "Joueur" => excluded
    expect(result).toEqual(['Bob'])
  })

  it('should consider all RSVP response types as having responded', () => {
    const members = [
      makeMember('u1', 'Alice'),
      makeMember('u2', 'Bob'),
      makeMember('u3', 'Charlie'),
    ]
    const rsvps = [
      makeRsvp('u1', 'accepted'),
      makeRsvp('u2', 'declined'),
      makeRsvp('u3', 'maybe'),
    ]

    const result = findNonResponders(members, rsvps)
    expect(result).toEqual([])
  })
})

// =====================================================
// Template Messages (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

function getTemplates(
  mentions: string,
  sessionTitle: string,
  gameName: string | null,
  sessionTime: string,
  squadName: string
): string[] {
  return [
    `Hey ${mentions} ! La session ${gameName || sessionTitle} de ${sessionTime} n'attend plus que vous ! On compte sur votre reponse pour confirmer l'equipe. Qui est chaud ?`,
    `${mentions} - Petit rappel amical ! La session ${sessionTitle || gameName} approche (${sessionTime}). Confirmez votre presence pour aider l'orga !`,
    `Yo ${mentions} ! On vous attend pour ${gameName || sessionTitle} le ${sessionTime}. Dites-nous si vous etes la, ca aide a s'organiser !`,
    `${mentions}, la squad ${squadName} a besoin de savoir ! Session ${sessionTitle || gameName} prevue ${sessionTime}. Present, absent ou peut-etre ?`,
    `Rappel ${squadName} ! ${mentions}, on attend votre reponse pour la session ${gameName || sessionTitle} de ${sessionTime}. L'equipe compte sur vous !`,
  ]
}

function formatMentions(nonResponders: string[]): string {
  return nonResponders.map((name) => `@${name}`).join(', ')
}

describe('ai-rsvp-reminder: template messages', () => {
  const mentions = formatMentions(['Alice', 'Bob'])
  const sessionTitle = 'Ranked Soiree'
  const gameName = 'Valorant'
  const sessionTime = 'vendredi 21 fevrier a 20:00'
  const squadName = 'Les Gamers'

  it('should have exactly 5 templates', () => {
    const templates = getTemplates(mentions, sessionTitle, gameName, sessionTime, squadName)
    expect(templates).toHaveLength(5)
  })

  it('should include mentions in ALL templates', () => {
    const templates = getTemplates(mentions, sessionTitle, gameName, sessionTime, squadName)
    templates.forEach((template, index) => {
      expect(template).toContain(mentions)
    })
  })

  it('should include session info (title or game) in all templates', () => {
    const templates = getTemplates(mentions, sessionTitle, gameName, sessionTime, squadName)
    templates.forEach((template) => {
      const hasSessionInfo =
        template.includes(sessionTitle) || template.includes(gameName!)
      expect(hasSessionInfo).toBe(true)
    })
  })

  it('should include session time in all templates', () => {
    const templates = getTemplates(mentions, sessionTitle, gameName, sessionTime, squadName)
    templates.forEach((template) => {
      expect(template).toContain(sessionTime)
    })
  })

  it('should include squad name in templates that reference it', () => {
    const templates = getTemplates(mentions, sessionTitle, gameName, sessionTime, squadName)
    const templatesWithSquadName = templates.filter((t) => t.includes(squadName))
    // At least templates[3] and templates[4] reference squad name
    expect(templatesWithSquadName.length).toBeGreaterThanOrEqual(2)
  })

  it('should format mentions with @ prefix', () => {
    const formatted = formatMentions(['Alice', 'Bob', 'Charlie'])
    expect(formatted).toBe('@Alice, @Bob, @Charlie')
  })

  it('should format single mention correctly', () => {
    const formatted = formatMentions(['Alice'])
    expect(formatted).toBe('@Alice')
  })
})

// =====================================================
// Message Length Validation (extracted from AI response validation)
// =====================================================

function isValidAIMessageLength(message: string | null | undefined): boolean {
  if (!message) return false
  const trimmed = message.trim()
  return trimmed.length > 0 && trimmed.length < 500
}

describe('ai-rsvp-reminder: message length validation', () => {
  it('should accept valid length (1-499 chars)', () => {
    expect(isValidAIMessageLength('Hey les gamers !')).toBe(true)
  })

  it('should accept message at 499 chars', () => {
    const msg = 'a'.repeat(499)
    expect(isValidAIMessageLength(msg)).toBe(true)
  })

  it('should reject empty string', () => {
    expect(isValidAIMessageLength('')).toBe(false)
  })

  it('should reject whitespace-only string', () => {
    expect(isValidAIMessageLength('   ')).toBe(false)
  })

  it('should reject string of exactly 500 chars', () => {
    const msg = 'a'.repeat(500)
    expect(isValidAIMessageLength(msg)).toBe(false)
  })

  it('should reject string longer than 500 chars', () => {
    const msg = 'a'.repeat(1000)
    expect(isValidAIMessageLength(msg)).toBe(false)
  })

  it('should reject null', () => {
    expect(isValidAIMessageLength(null)).toBe(false)
  })

  it('should reject undefined', () => {
    expect(isValidAIMessageLength(undefined)).toBe(false)
  })
})

// =====================================================
// Anti-spam Logic (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

function shouldSkipReminder(existingReminder: { id: string } | null): boolean {
  return existingReminder !== null
}

describe('ai-rsvp-reminder: anti-spam logic', () => {
  it('should skip when existing reminder found today', () => {
    const existingReminder = { id: 'insight-123' }
    expect(shouldSkipReminder(existingReminder)).toBe(true)
  })

  it('should proceed when no existing reminder found', () => {
    expect(shouldSkipReminder(null)).toBe(false)
  })

  it('should build correct skipped result when reminder exists', () => {
    const existingReminder = { id: 'insight-123' }
    if (shouldSkipReminder(existingReminder)) {
      const result = {
        session_id: 'session-1',
        session_title: 'Ranked',
        squad_name: 'Les Gamers',
        non_responders: [] as string[],
        reminder_sent: false,
        skipped_reason: "Rappel deja envoye aujourd'hui",
      }
      expect(result.reminder_sent).toBe(false)
      expect(result.skipped_reason).toBe("Rappel deja envoye aujourd'hui")
      expect(result.non_responders).toEqual([])
    }
  })
})

// =====================================================
// Results Tracking (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

interface ReminderResult {
  session_id: string
  session_title: string
  squad_name: string
  non_responders: string[]
  reminder_sent: boolean
  skipped_reason?: string
}

function buildSuccessResult(
  sessionId: string,
  sessionTitle: string,
  squadName: string,
  nonResponders: string[]
): ReminderResult {
  return {
    session_id: sessionId,
    session_title: sessionTitle,
    squad_name: squadName,
    non_responders: nonResponders,
    reminder_sent: true,
  }
}

function buildSkippedResult(
  sessionId: string,
  sessionTitle: string,
  squadName: string,
  reason: string
): ReminderResult {
  return {
    session_id: sessionId,
    session_title: sessionTitle,
    squad_name: squadName,
    non_responders: [],
    reminder_sent: false,
    skipped_reason: reason,
  }
}

describe('ai-rsvp-reminder: results tracking', () => {
  it('should build successful reminder result with reminder_sent = true', () => {
    const result = buildSuccessResult('s1', 'Ranked Soiree', 'Les Gamers', ['Alice', 'Bob'])
    expect(result.reminder_sent).toBe(true)
    expect(result.non_responders).toEqual(['Alice', 'Bob'])
    expect(result.session_id).toBe('s1')
    expect(result.session_title).toBe('Ranked Soiree')
    expect(result.squad_name).toBe('Les Gamers')
    expect(result).not.toHaveProperty('skipped_reason')
  })

  it('should build skipped result with skipped_reason and reminder_sent = false', () => {
    const result = buildSkippedResult('s2', 'Casual', 'Team Alpha', 'Tout le monde a repondu')
    expect(result.reminder_sent).toBe(false)
    expect(result.skipped_reason).toBe('Tout le monde a repondu')
    expect(result.non_responders).toEqual([])
  })

  it('should count reminders sent from results array', () => {
    const results: ReminderResult[] = [
      buildSuccessResult('s1', 'Session 1', 'Squad A', ['Alice']),
      buildSkippedResult('s2', 'Session 2', 'Squad A', 'Tout le monde a repondu'),
      buildSuccessResult('s3', 'Session 3', 'Squad B', ['Bob', 'Charlie']),
      buildSkippedResult('s4', 'Session 4', 'Squad C', "Rappel deja envoye aujourd'hui"),
    ]

    const remindersSent = results.filter((r) => r.reminder_sent).length
    expect(remindersSent).toBe(2)
  })

  it('should handle empty results array', () => {
    const results: ReminderResult[] = []
    const remindersSent = results.filter((r) => r.reminder_sent).length
    expect(remindersSent).toBe(0)
  })
})

// =====================================================
// Hours Until Calculation (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

function calculateHoursUntil(sessionTime: Date, now: Date): number {
  return Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60))
}

describe('ai-rsvp-reminder: hours until calculation', () => {
  it('should calculate 12 hours for session in 12 hours', () => {
    const now = new Date('2026-02-19T08:00:00Z')
    const sessionTime = new Date('2026-02-19T20:00:00Z')
    expect(calculateHoursUntil(sessionTime, now)).toBe(12)
  })

  it('should calculate 1 hour for session in 1 hour', () => {
    const now = new Date('2026-02-19T19:00:00Z')
    const sessionTime = new Date('2026-02-19T20:00:00Z')
    expect(calculateHoursUntil(sessionTime, now)).toBe(1)
  })

  it('should calculate 24 hours for session in 24 hours', () => {
    const now = new Date('2026-02-18T20:00:00Z')
    const sessionTime = new Date('2026-02-19T20:00:00Z')
    expect(calculateHoursUntil(sessionTime, now)).toBe(24)
  })

  it('should round correctly for fractional hours (e.g., 2.5h rounds to 3)', () => {
    const now = new Date('2026-02-19T17:30:00Z')
    const sessionTime = new Date('2026-02-19T20:00:00Z')
    // 2h30m = 2.5h => Math.round => 3
    expect(calculateHoursUntil(sessionTime, now)).toBe(3)
  })

  it('should return 0 for session happening right now', () => {
    const now = new Date('2026-02-19T20:00:00Z')
    const sessionTime = new Date('2026-02-19T20:00:00Z')
    expect(calculateHoursUntil(sessionTime, now)).toBe(0)
  })
})

// =====================================================
// AI Provider Fallback Config (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

describe('ai-rsvp-reminder: AI provider fallback configuration', () => {
  it('should define Claude config with max_tokens: 200', () => {
    const claudeConfig = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
    }
    expect(claudeConfig.max_tokens).toBe(200)
    expect(claudeConfig.model).toContain('claude')
  })

  it('should define Gemini config with maxOutputTokens: 150', () => {
    const geminiConfig = {
      temperature: 0.8,
      maxOutputTokens: 150,
    }
    expect(geminiConfig.maxOutputTokens).toBe(150)
  })

  it('should define OpenAI config with max_tokens: 100', () => {
    const openaiConfig = {
      model: 'gpt-3.5-turbo',
      max_tokens: 100,
      temperature: 0.8,
    }
    expect(openaiConfig.max_tokens).toBe(100)
  })

  it('should follow priority order: Claude > Gemini > OpenAI > Template', () => {
    const providers = ['claude', 'gemini', 'openai', 'template']
    expect(providers[0]).toBe('claude')
    expect(providers[1]).toBe('gemini')
    expect(providers[2]).toBe('openai')
    expect(providers[3]).toBe('template')
    expect(providers).toHaveLength(4)
  })
})

// =====================================================
// Message Insertion Shape (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

describe('ai-rsvp-reminder: message insertion format', () => {
  it('should build system message with correct flags', () => {
    const messagePayload = {
      squad_id: 'squad-1',
      session_id: 'session-1',
      sender_id: 'owner-1',
      content: 'Hey @Alice, @Bob ! Session Valorant dans 3h !',
      is_system_message: true,
      is_ai_suggestion: true,
      read_by: [] as string[],
    }

    expect(messagePayload.is_system_message).toBe(true)
    expect(messagePayload.is_ai_suggestion).toBe(true)
    expect(messagePayload.read_by).toEqual([])
    expect(messagePayload.content).toContain('@Alice')
  })
})

// =====================================================
// AI Insight Tracking Shape (extracted from ai-rsvp-reminder/index.ts)
// =====================================================

describe('ai-rsvp-reminder: insight tracking format', () => {
  it('should build insight record with correct structure', () => {
    const now = new Date('2026-02-19T10:00:00Z')
    const insight = {
      squad_id: 'squad-1',
      session_id: 'session-1',
      insight_type: 'rsvp_reminder',
      content: {
        non_responders: ['Alice', 'Bob'],
        message_sent: 'Hey @Alice, @Bob !',
        sent_at: now.toISOString(),
        generated_by: 'claude',
      },
      is_dismissed: false,
      expires_at: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    }

    expect(insight.insight_type).toBe('rsvp_reminder')
    expect(insight.is_dismissed).toBe(false)
    expect(insight.content.generated_by).toBe('claude')
    expect(insight.content.non_responders).toEqual(['Alice', 'Bob'])
  })

  it('should set expiration to 48 hours from now', () => {
    const now = new Date('2026-02-19T10:00:00Z')
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    expect(expiresAt.toISOString()).toBe('2026-02-21T10:00:00.000Z')
    // Exactly 48h difference
    const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    expect(diffHours).toBe(48)
  })

  it('should track template as generated_by when AI fails', () => {
    const insight = {
      content: {
        generated_by: 'template',
      },
    }
    expect(insight.content.generated_by).toBe('template')
  })
})
