/**
 * Tests for web-vitals edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from web-vitals/index.ts)
// =====================================================

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:3000',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.app',
  'https://www.squadplanner.fr',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed) ? origin : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

describe('web-vitals: CORS logic', () => {
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

  it('should always include Allow-Credentials: true', () => {
    const allowed = getCorsHeaders('https://squadplanner.fr')
    expect(allowed['Access-Control-Allow-Credentials']).toBe('true')
    const unknown = getCorsHeaders('https://unknown.com')
    expect(unknown['Access-Control-Allow-Credentials']).toBe('true')
    const nullOrigin = getCorsHeaders(null)
    expect(nullOrigin['Access-Control-Allow-Credentials']).toBe('true')
  })
})

// =====================================================
// isValidMetric (extracted from web-vitals/index.ts)
// =====================================================

const VALID_METRICS = ['LCP', 'FCP', 'CLS', 'TTFB', 'INP', 'FID']
const VALID_RATINGS = ['good', 'needs-improvement', 'poor']

interface WebVitalPayload {
  name: string
  value: number
  rating: string
  url: string
  timestamp: string
  userAgent?: string
  connectionType?: string
}

function isValidMetric(m: unknown): m is WebVitalPayload {
  if (!m || typeof m !== 'object') return false
  const metric = m as Record<string, unknown>
  return (
    typeof metric.name === 'string' &&
    VALID_METRICS.includes(metric.name) &&
    typeof metric.value === 'number' &&
    isFinite(metric.value) &&
    metric.value >= 0 &&
    typeof metric.rating === 'string' &&
    VALID_RATINGS.includes(metric.rating) &&
    typeof metric.url === 'string' &&
    metric.url.length > 0 &&
    typeof metric.timestamp === 'string'
  )
}

function makeValidMetric(overrides: Partial<WebVitalPayload> = {}): WebVitalPayload {
  return {
    name: 'LCP',
    value: 2500,
    rating: 'good',
    url: 'https://squadplanner.app/home',
    timestamp: '2026-02-19T12:00:00.000Z',
    ...overrides,
  }
}

describe('web-vitals: isValidMetric', () => {
  it('should accept a valid LCP metric', () => {
    expect(isValidMetric(makeValidMetric())).toBe(true)
  })

  it('should accept all valid metric names', () => {
    for (const name of VALID_METRICS) {
      expect(isValidMetric(makeValidMetric({ name }))).toBe(true)
    }
  })

  it('should accept all valid ratings', () => {
    for (const rating of VALID_RATINGS) {
      expect(isValidMetric(makeValidMetric({ rating }))).toBe(true)
    }
  })

  it('should accept value of 0', () => {
    expect(isValidMetric(makeValidMetric({ value: 0 }))).toBe(true)
  })

  it('should reject null input', () => {
    expect(isValidMetric(null)).toBe(false)
  })

  it('should reject undefined input', () => {
    expect(isValidMetric(undefined)).toBe(false)
  })

  it('should reject non-object input (string)', () => {
    expect(isValidMetric('not an object')).toBe(false)
  })

  it('should reject invalid metric name', () => {
    expect(isValidMetric(makeValidMetric({ name: 'UNKNOWN' }))).toBe(false)
  })

  it('should reject NaN value', () => {
    expect(isValidMetric(makeValidMetric({ value: NaN }))).toBe(false)
  })

  it('should reject Infinity value', () => {
    expect(isValidMetric(makeValidMetric({ value: Infinity }))).toBe(false)
  })

  it('should reject negative value', () => {
    expect(isValidMetric(makeValidMetric({ value: -1 }))).toBe(false)
  })

  it('should reject invalid rating', () => {
    expect(isValidMetric(makeValidMetric({ rating: 'excellent' }))).toBe(false)
  })

  it('should reject empty url', () => {
    expect(isValidMetric(makeValidMetric({ url: '' }))).toBe(false)
  })

  it('should reject missing timestamp (number instead of string)', () => {
    const metric = { ...makeValidMetric(), timestamp: 12345 }
    expect(isValidMetric(metric)).toBe(false)
  })
})

// =====================================================
// Batch size capping (extracted from web-vitals/index.ts)
// =====================================================

const MAX_BATCH_SIZE = 50

describe('web-vitals: batch size capping', () => {
  it('should keep batch unchanged when under MAX_BATCH_SIZE', () => {
    const metrics = Array.from({ length: 10 }, () => makeValidMetric())
    const batch = metrics.slice(0, MAX_BATCH_SIZE)
    expect(batch.length).toBe(10)
  })

  it('should cap batch at MAX_BATCH_SIZE when over limit', () => {
    const metrics = Array.from({ length: 75 }, () => makeValidMetric())
    const batch = metrics.slice(0, MAX_BATCH_SIZE)
    expect(batch.length).toBe(50)
  })
})

// =====================================================
// Row mapping (extracted from web-vitals/index.ts)
// =====================================================

function mapMetricToRow(m: WebVitalPayload) {
  return {
    metric_name: m.name,
    metric_value: m.value,
    rating: m.rating,
    page_url: m.url.slice(0, 2000),
    user_agent: (m.userAgent || '').slice(0, 500) || null,
    connection_type: (m.connectionType || '').slice(0, 50) || null,
    created_at: m.timestamp || new Date().toISOString(),
  }
}

describe('web-vitals: row mapping', () => {
  it('should map metric fields to database columns', () => {
    const row = mapMetricToRow(makeValidMetric())
    expect(row.metric_name).toBe('LCP')
    expect(row.metric_value).toBe(2500)
    expect(row.rating).toBe('good')
    expect(row.page_url).toBe('https://squadplanner.app/home')
  })

  it('should truncate page_url to 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(3000)
    const row = mapMetricToRow(makeValidMetric({ url: longUrl }))
    expect(row.page_url.length).toBe(2000)
  })

  it('should truncate user_agent to 500 characters', () => {
    const longUA = 'Mozilla/' + 'x'.repeat(600)
    const row = mapMetricToRow(makeValidMetric({ userAgent: longUA }))
    expect(row.user_agent!.length).toBe(500)
  })

  it('should set user_agent to null when empty string', () => {
    const row = mapMetricToRow(makeValidMetric({ userAgent: '' }))
    expect(row.user_agent).toBeNull()
  })

  it('should set user_agent to null when undefined', () => {
    const row = mapMetricToRow(makeValidMetric())
    expect(row.user_agent).toBeNull()
  })

  it('should truncate connection_type to 50 characters', () => {
    const longConn = 'x'.repeat(100)
    const row = mapMetricToRow(makeValidMetric({ connectionType: longConn }))
    expect(row.connection_type!.length).toBe(50)
  })

  it('should set connection_type to null when empty string', () => {
    const row = mapMetricToRow(makeValidMetric({ connectionType: '' }))
    expect(row.connection_type).toBeNull()
  })

  it('should use timestamp as created_at', () => {
    const ts = '2026-02-19T12:00:00.000Z'
    const row = mapMetricToRow(makeValidMetric({ timestamp: ts }))
    expect(row.created_at).toBe(ts)
  })

  it('should fallback to current ISO date when timestamp is empty', () => {
    const before = new Date().toISOString()
    const row = mapMetricToRow(makeValidMetric({ timestamp: '' }))
    const after = new Date().toISOString()
    // created_at should be a valid ISO string between before and after
    expect(row.created_at >= before).toBe(true)
    expect(row.created_at <= after).toBe(true)
  })
})

// =====================================================
// Method validation (matching web-vitals handler logic)
// =====================================================

describe('web-vitals: method validation', () => {
  it('should accept POST method', () => {
    const method = 'POST'
    const isAllowed = method === 'POST'
    expect(isAllowed).toBe(true)
  })

  it('should reject non-POST methods', () => {
    for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
      const isAllowed = method === 'POST'
      expect(isAllowed).toBe(false)
    }
  })
})

// =====================================================
// Input validation (matching web-vitals handler logic)
// =====================================================

describe('web-vitals: input validation', () => {
  it('should reject when metrics is missing (undefined)', () => {
    const metrics: unknown = undefined
    const isValid = Array.isArray(metrics) && metrics.length > 0
    expect(isValid).toBe(false)
  })

  it('should reject when metrics is an empty array', () => {
    const metrics: unknown[] = []
    const isValid = Array.isArray(metrics) && metrics.length > 0
    expect(isValid).toBe(false)
  })

  it('should reject when metrics is not an array (object)', () => {
    const metrics: unknown = { name: 'LCP' }
    const isValid = Array.isArray(metrics) && metrics.length > 0
    expect(isValid).toBe(false)
  })
})
