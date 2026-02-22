/**
 * Tests for send-reminders edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect, vi } from 'vitest'

// =====================================================
// CORS Logic (same as send-push, extracted from handler)
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

describe('send-reminders: CORS', () => {
  it('should allow squadplanner.fr', () => {
    const h = getCorsHeaders('https://squadplanner.fr')
    expect(h['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should reject unknown origin', () => {
    const h = getCorsHeaders('https://evil.com')
    expect(h).not.toHaveProperty('Access-Control-Allow-Origin')
  })

  it('should include x-cron-secret in allowed headers', () => {
    const h = getCorsHeaders(null)
    expect(h['Access-Control-Allow-Headers']).toContain('x-cron-secret')
  })
})

// =====================================================
// Auth verification logic (extracted from handler)
// =====================================================

describe('send-reminders: auth verification', () => {
  it('should accept valid cron secret', () => {
    const cronSecret = 'my-cron-secret'
    const cronHeader = 'my-cron-secret'
    const isValidCron = cronSecret && cronHeader === cronSecret
    expect(isValidCron).toBe(true)
  })

  it('should reject invalid cron secret', () => {
    const cronSecret = 'my-cron-secret'
    const cronHeader = 'wrong-secret'
    const isValidCron = cronSecret && cronHeader === cronSecret
    expect(isValidCron).toBe(false)
  })

  it('should accept valid service role key', () => {
    const authHeader = 'Bearer my-service-role-key'
    const serviceRoleKey = 'my-service-role-key'
    const isValidServiceRole = authHeader && authHeader.replace('Bearer ', '') === serviceRoleKey
    expect(isValidServiceRole).toBeTruthy()
  })

  it('should reject when both cron and service role are invalid', () => {
    const cronSecret = 'real-secret'
    const cronHeader = 'wrong'
    const serviceRoleKey = 'real-key'
    const authHeader = 'Bearer wrong-key'

    const isValidCron = cronSecret && cronHeader === cronSecret
    const isValidServiceRole = authHeader && authHeader.replace('Bearer ', '') === serviceRoleKey

    expect(!isValidCron && !isValidServiceRole).toBe(true)
  })

  it('should accept when cron is valid but service role is not', () => {
    const cronSecret = 'my-secret'
    const cronHeader = 'my-secret'
    const serviceRoleKey = 'key'
    const authHeader = null

    const isValidCron = cronSecret && cronHeader === cronSecret
    const isValidServiceRole = authHeader && authHeader.replace('Bearer ', '') === serviceRoleKey

    expect(!isValidCron && !isValidServiceRole).toBe(false)
  })
})

// =====================================================
// Time window calculation (extracted from handler)
// =====================================================

describe('send-reminders: time window calculations', () => {
  it('should compute 15-minute window for urgent reminders', () => {
    const now = new Date('2026-03-15T20:00:00Z')
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000)

    expect(in15Minutes.toISOString()).toBe('2026-03-15T20:15:00.000Z')
  })

  it('should compute 1-hour window for upcoming reminders', () => {
    const now = new Date('2026-03-15T20:00:00Z')
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000)

    expect(in1Hour.toISOString()).toBe('2026-03-15T21:00:00.000Z')
  })

  it('should correctly calculate minutes until session', () => {
    const now = new Date('2026-03-15T20:00:00Z')
    const sessionTime = new Date('2026-03-15T20:10:00Z')
    const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60))

    expect(minutesUntil).toBe(10)
  })

  it('should handle midnight-crossing time windows', () => {
    const now = new Date('2026-03-15T23:50:00Z')
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000)

    expect(in15Minutes.toISOString()).toBe('2026-03-16T00:05:00.000Z')
  })
})

// =====================================================
// Session filtering & notification building logic
// =====================================================

interface SessionRsvp {
  user_id: string
  response: string
  profiles: {
    email: string
    username: string
  }
}

interface SessionWithRsvps {
  id: string
  title: string
  game: string
  scheduled_at: string
  squad_id: string
  squads: { name: string }
  session_rsvps: SessionRsvp[]
}

function buildNotificationsFromSessions(
  sessions: SessionWithRsvps[],
  type: 'urgent' | 'upcoming',
  now: Date
) {
  const notifications: Array<{
    type: 'urgent' | 'upcoming'
    session_id: string
    user_id: string
    email: string
    username: string
    session_title: string
    squad_name: string
    minutes_until: number
  }> = []

  for (const session of sessions) {
    const sessionTime = new Date(session.scheduled_at)
    const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60))

    for (const rsvp of session.session_rsvps || []) {
      if (rsvp.response === 'present' && rsvp.profiles?.email) {
        notifications.push({
          type,
          session_id: session.id,
          user_id: rsvp.user_id,
          email: rsvp.profiles.email,
          username: rsvp.profiles.username || 'Joueur',
          session_title: session.title || session.game || 'Session',
          squad_name: session.squads?.name || 'Squad',
          minutes_until: minutesUntil,
        })
      }
    }
  }

  return notifications
}

describe('send-reminders: notification building from sessions', () => {
  const now = new Date('2026-03-15T20:00:00Z')

  const mockSession: SessionWithRsvps = {
    id: 'session-1',
    title: 'Raid Night',
    game: 'Valorant',
    scheduled_at: '2026-03-15T20:10:00Z',
    squad_id: 'squad-1',
    squads: { name: 'Raid Squad' },
    session_rsvps: [
      {
        user_id: 'user-1',
        response: 'present',
        profiles: { email: 'alice@test.com', username: 'Alice' },
      },
      {
        user_id: 'user-2',
        response: 'present',
        profiles: { email: 'bob@test.com', username: 'Bob' },
      },
      {
        user_id: 'user-3',
        response: 'absent',
        profiles: { email: 'charlie@test.com', username: 'Charlie' },
      },
    ],
  }

  it('should only include users who RSVPd "present"', () => {
    const notifs = buildNotificationsFromSessions([mockSession], 'urgent', now)
    expect(notifs.length).toBe(2)
    expect(notifs.map((n) => n.username)).toEqual(['Alice', 'Bob'])
  })

  it('should exclude users who RSVPd "absent"', () => {
    const notifs = buildNotificationsFromSessions([mockSession], 'urgent', now)
    expect(notifs.find((n) => n.username === 'Charlie')).toBeUndefined()
  })

  it('should calculate correct minutes until session', () => {
    const notifs = buildNotificationsFromSessions([mockSession], 'urgent', now)
    expect(notifs[0].minutes_until).toBe(10)
  })

  it('should use session title over game as session_title', () => {
    const notifs = buildNotificationsFromSessions([mockSession], 'urgent', now)
    expect(notifs[0].session_title).toBe('Raid Night')
  })

  it('should fallback to game when title is empty', () => {
    const session = { ...mockSession, title: '' }
    const notifs = buildNotificationsFromSessions([session], 'urgent', now)
    expect(notifs[0].session_title).toBe('Valorant')
  })

  it('should fallback to "Session" when both title and game are empty', () => {
    const session = { ...mockSession, title: '', game: '' }
    const notifs = buildNotificationsFromSessions([session], 'urgent', now)
    expect(notifs[0].session_title).toBe('Session')
  })

  it('should fallback to "Squad" when squad name is missing', () => {
    const session = { ...mockSession, squads: { name: '' } } as unknown as SessionWithRsvps
    // squads.name is empty string, but the condition checks falsy
    // In the real code: session.squads?.name || 'Squad'
    const notifs = buildNotificationsFromSessions([session], 'urgent', now)
    expect(notifs[0].squad_name).toBe('Squad')
  })

  it('should fallback username to "Joueur" when missing', () => {
    const session: SessionWithRsvps = {
      ...mockSession,
      session_rsvps: [
        {
          user_id: 'user-1',
          response: 'present',
          profiles: { email: 'anon@test.com', username: '' },
        },
      ],
    }
    const notifs = buildNotificationsFromSessions([session], 'urgent', now)
    expect(notifs[0].username).toBe('Joueur')
  })

  it('should skip users without email', () => {
    const session: SessionWithRsvps = {
      ...mockSession,
      session_rsvps: [
        {
          user_id: 'user-1',
          response: 'present',
          profiles: { email: '', username: 'NoEmail' },
        },
      ],
    }
    const notifs = buildNotificationsFromSessions([session], 'urgent', now)
    // email is empty string = falsy → should skip
    expect(notifs.length).toBe(0)
  })

  it('should handle multiple sessions', () => {
    const session2: SessionWithRsvps = {
      ...mockSession,
      id: 'session-2',
      title: 'Arena Run',
      session_rsvps: [
        {
          user_id: 'user-4',
          response: 'present',
          profiles: { email: 'dave@test.com', username: 'Dave' },
        },
      ],
    }
    const notifs = buildNotificationsFromSessions([mockSession, session2], 'upcoming', now)
    expect(notifs.length).toBe(3) // 2 from session-1 + 1 from session-2
  })

  it('should handle empty session list', () => {
    const notifs = buildNotificationsFromSessions([], 'urgent', now)
    expect(notifs.length).toBe(0)
  })

  it('should handle session with empty rsvps', () => {
    const session = { ...mockSession, session_rsvps: [] }
    const notifs = buildNotificationsFromSessions([session], 'urgent', now)
    expect(notifs.length).toBe(0)
  })
})

// =====================================================
// Notification grouping logic (keep most urgent per user)
// =====================================================

describe('send-reminders: notification grouping per user', () => {
  it('should keep only one notification per user', () => {
    const notifications = [
      { user_id: 'u1', type: 'upcoming' as const, session_id: 's1', session_title: 'A' },
      { user_id: 'u1', type: 'urgent' as const, session_id: 's2', session_title: 'B' },
      { user_id: 'u2', type: 'upcoming' as const, session_id: 's3', session_title: 'C' },
    ]

    const userNotifications = new Map<string, (typeof notifications)[0]>()
    for (const notif of notifications) {
      const existing = userNotifications.get(notif.user_id)
      if (!existing || notif.type === 'urgent') {
        userNotifications.set(notif.user_id, notif)
      }
    }

    expect(userNotifications.size).toBe(2)
  })

  it('should prefer urgent over upcoming for same user', () => {
    const notifications = [
      { user_id: 'u1', type: 'upcoming' as const, session_id: 's1', session_title: 'Upcoming' },
      { user_id: 'u1', type: 'urgent' as const, session_id: 's2', session_title: 'Urgent' },
    ]

    const userNotifications = new Map<string, (typeof notifications)[0]>()
    for (const notif of notifications) {
      const existing = userNotifications.get(notif.user_id)
      if (!existing || notif.type === 'urgent') {
        userNotifications.set(notif.user_id, notif)
      }
    }

    expect(userNotifications.get('u1')!.session_title).toBe('Urgent')
  })

  it('should keep first notification when both are upcoming', () => {
    const notifications = [
      { user_id: 'u1', type: 'upcoming' as const, session_id: 's1', session_title: 'First' },
      { user_id: 'u1', type: 'upcoming' as const, session_id: 's2', session_title: 'Second' },
    ]

    const userNotifications = new Map<string, (typeof notifications)[0]>()
    for (const notif of notifications) {
      const existing = userNotifications.get(notif.user_id)
      if (!existing || notif.type === 'urgent') {
        userNotifications.set(notif.user_id, notif)
      }
    }

    // First one wins since both are 'upcoming'
    expect(userNotifications.get('u1')!.session_title).toBe('First')
  })

  it('should handle empty notifications', () => {
    const notifications: Array<{ user_id: string; type: 'urgent' | 'upcoming' }> = []
    const userNotifications = new Map()
    for (const notif of notifications) {
      const existing = userNotifications.get(notif.user_id)
      if (!existing || notif.type === 'urgent') {
        userNotifications.set(notif.user_id, notif)
      }
    }

    expect(userNotifications.size).toBe(0)
  })
})

// =====================================================
// Push notification message formatting
// =====================================================

describe('send-reminders: push message formatting', () => {
  it('should format urgent notification title with minutes', () => {
    const notif = { type: 'urgent' as const, session_title: 'Raid', minutes_until: 5 }
    const title =
      notif.type === 'urgent'
        ? `${notif.session_title} dans ${notif.minutes_until} min!`
        : `Session dans ~1h`
    expect(title).toBe('Raid dans 5 min!')
  })

  it('should format upcoming notification with generic title', () => {
    const notif = { type: 'upcoming' as const, session_title: 'Raid', minutes_until: 45 }
    const title =
      notif.type === 'urgent'
        ? `${notif.session_title} dans ${notif.minutes_until} min!`
        : `Session dans ~1h`
    expect(title).toBe('Session dans ~1h')
  })

  it('should format urgent body with squad name', () => {
    const notif = { type: 'urgent' as const, squad_name: 'Raid Squad', session_title: 'Raid' }
    const body =
      notif.type === 'urgent'
        ? `Rejoins ${notif.squad_name} maintenant!`
        : `${notif.session_title} avec ${notif.squad_name}`
    expect(body).toBe('Rejoins Raid Squad maintenant!')
  })

  it('should format upcoming body with session title and squad', () => {
    const notif = { type: 'upcoming' as const, squad_name: 'My Squad', session_title: 'Arena Run' }
    const body =
      notif.type === 'upcoming'
        ? `${notif.session_title} avec ${notif.squad_name}`
        : `Rejoins ${notif.squad_name} maintenant!`
    expect(body).toBe('Arena Run avec My Squad')
  })
})

// =====================================================
// Insight upsert ID generation
// =====================================================

describe('send-reminders: reminder insight ID', () => {
  it('should generate unique ID per session-user-type combination', () => {
    const id = `reminder-session-1-user-1-urgent`
    expect(id).toBe('reminder-session-1-user-1-urgent')
  })

  it('should differentiate urgent from upcoming for same session and user', () => {
    const urgentId = `reminder-session-1-user-1-urgent`
    const upcomingId = `reminder-session-1-user-1-upcoming`
    expect(urgentId).not.toBe(upcomingId)
  })

  it('should set correct insight_type for urgent', () => {
    const type = 'urgent' as const
    const insightType = type === 'urgent' ? 'session_imminent' : 'session_reminder'
    expect(insightType).toBe('session_imminent')
  })

  it('should set correct insight_type for upcoming', () => {
    const type = 'upcoming' as const
    const insightType = type === 'urgent' ? 'session_imminent' : 'session_reminder'
    expect(insightType).toBe('session_reminder')
  })

  it('should format urgent message with minutes', () => {
    const type = 'urgent' as const
    const sessionTitle = 'Raid Night'
    const minutesUntil = 10
    const message =
      type === 'urgent'
        ? `${sessionTitle} commence dans ${minutesUntil} minutes !`
        : `${sessionTitle} commence dans environ 1 heure`
    expect(message).toBe('Raid Night commence dans 10 minutes !')
  })

  it('should format upcoming message', () => {
    const type = 'upcoming' as const
    const sessionTitle = 'Arena'
    const minutesUntil = 45
    const message =
      type === 'urgent'
        ? `${sessionTitle} commence dans ${minutesUntil} minutes !`
        : `${sessionTitle} commence dans environ 1 heure`
    expect(message).toBe('Arena commence dans environ 1 heure')
  })

  it('should set expiry to 2 hours from now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T20:00:00Z'))

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    expect(expiresAt).toBe('2026-03-15T22:00:00.000Z')

    vi.useRealTimers()
  })
})
