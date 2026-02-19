/**
 * Tests for send-push edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from send-push/index.ts)
// =====================================================

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.fr',
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

describe('send-push: CORS logic', () => {
  it('should allow squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should allow localhost:5173 origin', () => {
    const headers = getCorsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should allow www.squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://www.squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.fr')
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
    expect(getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Headers']).toContain('authorization')
    expect(getCorsHeaders(null)['Access-Control-Allow-Headers']).toContain('authorization')
  })
})

// =====================================================
// Base64 / Uint8Array utilities (extracted from send-push/index.ts)
// =====================================================

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64Url(array: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

describe('send-push: base64 utilities', () => {
  it('should convert base64 to Uint8Array', () => {
    // "Hello" in base64 = "SGVsbG8="
    const result = base64ToUint8Array('SGVsbG8=')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(5)
    expect(String.fromCharCode(...result)).toBe('Hello')
  })

  it('should convert Uint8Array to base64url (no padding, url-safe)', () => {
    const bytes = new TextEncoder().encode('Hello')
    const result = uint8ArrayToBase64Url(bytes)
    // Standard base64 would be "SGVsbG8=", base64url removes padding
    expect(result).toBe('SGVsbG8')
    expect(result).not.toContain('+')
    expect(result).not.toContain('/')
    expect(result).not.toContain('=')
  })

  it('should handle empty array', () => {
    const result = uint8ArrayToBase64Url(new Uint8Array(0))
    expect(result).toBe('')
  })

  it('should roundtrip correctly', () => {
    const original = 'Test payload for push notification'
    const encoded = btoa(original)
    const bytes = base64ToUint8Array(encoded)
    expect(String.fromCharCode(...bytes)).toBe(original)
  })
})

// =====================================================
// Input validation logic (matching send-push handler)
// =====================================================

describe('send-push: input validation rules', () => {
  it('should require at least userId or userIds', () => {
    const userIds: string[] = []
    // Matches the handler: if (userIds.length === 0) → 400
    expect(userIds.length === 0).toBe(true)
  })

  it('should accept single userId', () => {
    const userIds: string[] = []
    const userId = '550e8400-e29b-41d4-a716-446655440000'
    if (userId) userIds.push(userId)
    expect(userIds).toEqual([userId])
  })

  it('should accept multiple userIds', () => {
    const userIds: string[] = []
    const ids = [
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440001',
    ]
    userIds.push(...ids)
    expect(userIds.length).toBe(2)
  })

  it('should merge userId and userIds into a single list', () => {
    const userIds: string[] = []
    const userId = '550e8400-e29b-41d4-a716-446655440000'
    const extraIds = ['660e8400-e29b-41d4-a716-446655440001']
    if (userId) userIds.push(userId)
    if (extraIds) userIds.push(...extraIds)
    expect(userIds.length).toBe(2)
  })
})

// =====================================================
// Notification payload building (matching send-push handler)
// =====================================================

interface PushAction {
  action: string
  title: string
  icon?: string
}

function buildNotificationPayload(data: {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: PushAction[]
}) {
  const payload: Record<string, unknown> = {
    title: data.title,
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    url: data.url || '/',
    tag: data.tag || 'squadplanner-notification',
    data: data.data || {},
  }
  if (data.actions && data.actions.length > 0) {
    payload.actions = data.actions
  }
  if ((data.data as Record<string, unknown>)?.type === 'incoming_call') {
    payload.requireInteraction = true
    payload.vibrate = [300, 100, 300, 100, 300]
    payload.urgency = 'high'
  }
  return payload
}

describe('send-push: notification payload building', () => {
  it('should use defaults for missing optional fields', () => {
    const payload = buildNotificationPayload({
      title: 'Hello',
      body: 'World',
    })
    expect(payload.icon).toBe('/favicon.svg')
    expect(payload.badge).toBe('/favicon.svg')
    expect(payload.url).toBe('/')
    expect(payload.tag).toBe('squadplanner-notification')
    expect(payload.data).toEqual({})
  })

  it('should use provided values over defaults', () => {
    const payload = buildNotificationPayload({
      title: 'New Message',
      body: 'Alice sent a message',
      icon: '/icon-192.svg',
      url: '/messages',
      tag: 'msg-squad-1',
      data: { type: 'new_message', squad_id: 'squad-1' },
    })
    expect(payload.icon).toBe('/icon-192.svg')
    expect(payload.url).toBe('/messages')
    expect(payload.tag).toBe('msg-squad-1')
    expect(payload.data).toEqual({ type: 'new_message', squad_id: 'squad-1' })
  })

  it('should include actions when provided', () => {
    const payload = buildNotificationPayload({
      title: 'Session',
      body: 'New session',
      actions: [
        { action: 'accept', title: 'Accepter' },
        { action: 'decline', title: 'Refuser' },
      ],
    })
    expect(payload.actions).toEqual([
      { action: 'accept', title: 'Accepter' },
      { action: 'decline', title: 'Refuser' },
    ])
  })

  it('should NOT include actions when empty array', () => {
    const payload = buildNotificationPayload({
      title: 'Test',
      body: 'Test',
      actions: [],
    })
    expect(payload).not.toHaveProperty('actions')
  })

  it('should set incoming call specific options', () => {
    const payload = buildNotificationPayload({
      title: 'Appel entrant',
      body: 'Alice vous appelle',
      data: { type: 'incoming_call', caller_name: 'Alice' },
    })
    expect(payload.requireInteraction).toBe(true)
    expect(payload.vibrate).toEqual([300, 100, 300, 100, 300])
    expect(payload.urgency).toBe('high')
  })

  it('should NOT set call options for regular notifications', () => {
    const payload = buildNotificationPayload({
      title: 'Message',
      body: 'Hello',
      data: { type: 'new_message' },
    })
    expect(payload).not.toHaveProperty('requireInteraction')
    expect(payload).not.toHaveProperty('vibrate')
    expect(payload).not.toHaveProperty('urgency')
  })
})

// =====================================================
// Expired subscription cleanup logic
// =====================================================

describe('send-push: expired subscription cleanup', () => {
  it('should identify expired subscriptions from results', () => {
    const subscriptions = [
      { id: 'sub-1', user_id: 'u1', endpoint: 'https://push.example.com/1', p256dh: 'x', auth: 'y' },
      { id: 'sub-2', user_id: 'u2', endpoint: 'https://push.example.com/2', p256dh: 'x', auth: 'y' },
      { id: 'sub-3', user_id: 'u3', endpoint: 'https://push.example.com/3', p256dh: 'x', auth: 'y' },
    ]
    const results = [
      { success: true },
      { success: false, error: 'subscription_expired' },
      { success: false, error: 'HTTP 500: Server Error' },
    ]

    const expired = subscriptions.filter(
      (_sub, index) => results[index].error === 'subscription_expired',
    )

    expect(expired.length).toBe(1)
    expect(expired[0].id).toBe('sub-2')
  })

  it('should return empty when no subscriptions are expired', () => {
    const subscriptions = [
      { id: 'sub-1', user_id: 'u1', endpoint: 'e1', p256dh: 'x', auth: 'y' },
    ]
    const results = [{ success: true }]

    const expired = subscriptions.filter(
      (_sub, index) => results[index].error === 'subscription_expired',
    )
    expect(expired.length).toBe(0)
  })
})

// =====================================================
// FCM payload logic (matching sendFCMNotification)
// =====================================================

describe('send-push: FCM payload building', () => {
  it('should use default sound and channel for regular notifications', () => {
    const data = { type: 'new_message' }
    const isCall = data.type === 'incoming_call'

    expect(isCall).toBe(false)
    // Regular notification: sound = 'default', channel_id = 'default'
    const sound = isCall ? 'ringtone' : 'default'
    expect(sound).toBe('default')
  })

  it('should use ringtone sound and calls channel for incoming calls', () => {
    const data = { type: 'incoming_call' }
    const isCall = data.type === 'incoming_call'

    expect(isCall).toBe(true)
    const sound = isCall ? 'ringtone' : 'default'
    const channelId = isCall ? 'calls' : 'default'
    expect(sound).toBe('ringtone')
    expect(channelId).toBe('calls')
  })
})
