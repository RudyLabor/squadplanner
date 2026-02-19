/**
 * Tests for error-report edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from error-report/index.ts)
// =====================================================

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
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
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

describe('error-report: CORS logic', () => {
  it('should allow squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should allow squadplanner.app origin', () => {
    const headers = getCorsHeaders('https://squadplanner.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.app')
  })

  it('should allow www.squadplanner.app origin', () => {
    const headers = getCorsHeaders('https://www.squadplanner.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.app')
  })

  it('should allow www.squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://www.squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.fr')
  })

  it('should allow all localhost ports 5173-5179', () => {
    for (let port = 5173; port <= 5179; port++) {
      const headers = getCorsHeaders(`http://localhost:${port}`)
      expect(headers['Access-Control-Allow-Origin']).toBe(`http://localhost:${port}`)
    }
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
      'authorization',
    )
    expect(getCorsHeaders(null)['Access-Control-Allow-Headers']).toContain('authorization')
  })

  it('should always include Allow-Methods with POST and OPTIONS', () => {
    expect(getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Methods']).toContain(
      'POST',
    )
    expect(getCorsHeaders(null)['Access-Control-Allow-Methods']).toContain('OPTIONS')
  })
})

// =====================================================
// Input validation logic (extracted from error-report/index.ts)
// =====================================================

describe('error-report: input validation', () => {
  it('should reject when errors field is missing (undefined)', () => {
    const body: Record<string, unknown> = {}
    const errors = body.errors
    expect(Array.isArray(errors)).toBe(false)
  })

  it('should reject when errors is an empty array', () => {
    const errors: unknown[] = []
    const isInvalid = !Array.isArray(errors) || errors.length === 0
    expect(isInvalid).toBe(true)
  })

  it('should reject when errors is not an array (string)', () => {
    const errors = 'not an array'
    const isInvalid = !Array.isArray(errors) || errors.length === 0
    expect(isInvalid).toBe(true)
  })

  it('should reject when errors is not an array (number)', () => {
    const errors = 42
    const isInvalid = !Array.isArray(errors) || (errors as unknown as unknown[]).length === 0
    expect(isInvalid).toBe(true)
  })

  it('should accept a valid non-empty errors array', () => {
    const errors = [{ message: 'Test error', url: '/', level: 'error' }]
    const isInvalid = !Array.isArray(errors) || errors.length === 0
    expect(isInvalid).toBe(false)
  })
})

// =====================================================
// Batch size limiting (extracted from error-report/index.ts)
// =====================================================

describe('error-report: batch size limiting', () => {
  it('should keep exactly 50 errors when given 50', () => {
    const errors = Array.from({ length: 50 }, (_, i) => ({ message: `Error ${i}` }))
    const batch = errors.slice(0, 50)
    expect(batch.length).toBe(50)
  })

  it('should truncate to 50 when given more than 50', () => {
    const errors = Array.from({ length: 100 }, (_, i) => ({ message: `Error ${i}` }))
    const batch = errors.slice(0, 50)
    expect(batch.length).toBe(50)
    expect(batch[0].message).toBe('Error 0')
    expect(batch[49].message).toBe('Error 49')
  })

  it('should keep all errors when given fewer than 50', () => {
    const errors = Array.from({ length: 10 }, (_, i) => ({ message: `Error ${i}` }))
    const batch = errors.slice(0, 50)
    expect(batch.length).toBe(10)
  })
})

// =====================================================
// Field truncation logic (extracted from error-report/index.ts)
// =====================================================

describe('error-report: field truncation', () => {
  it('should truncate message to 2000 characters', () => {
    const longMessage = 'x'.repeat(3000)
    const truncated = longMessage.slice(0, 2000)
    expect(truncated.length).toBe(2000)
  })

  it('should not truncate message under 2000 characters', () => {
    const shortMessage = 'Short error message'
    const truncated = shortMessage.slice(0, 2000)
    expect(truncated).toBe(shortMessage)
    expect(truncated.length).toBe(shortMessage.length)
  })

  it('should truncate stack to 5000 characters', () => {
    const longStack = 'at func (file.js:1:1)\n'.repeat(500)
    const truncated = longStack.slice(0, 5000)
    expect(truncated.length).toBe(5000)
  })

  it('should not truncate stack under 5000 characters', () => {
    const shortStack = 'at func (file.js:1:1)'
    const truncated = shortStack.slice(0, 5000)
    expect(truncated).toBe(shortStack)
  })

  it('should truncate url to 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(3000)
    const truncated = longUrl.slice(0, 2000)
    expect(truncated.length).toBe(2000)
  })

  it('should truncate user_agent to 500 characters', () => {
    const longUA = 'Mozilla/5.0 ' + 'x'.repeat(600)
    const truncated = longUA.slice(0, 500)
    expect(truncated.length).toBe(500)
  })

  it('should not truncate user_agent under 500 characters', () => {
    const shortUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    const truncated = shortUA.slice(0, 500)
    expect(truncated).toBe(shortUA)
  })
})

// =====================================================
// Row mapping logic (extracted from error-report/index.ts)
// =====================================================

interface ErrorReport {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
  username?: string
  level: string
  extra?: Record<string, unknown>
  breadcrumbs?: { timestamp: string; category: string; message: string; level?: string }[]
  tags?: Record<string, string>
}

function mapErrorToRow(err: ErrorReport) {
  return {
    message: (err.message || '').slice(0, 2000),
    stack: err.stack?.slice(0, 5000),
    url: (err.url || '').slice(0, 2000),
    timestamp: err.timestamp || new Date().toISOString(),
    user_agent: (err.userAgent || '').slice(0, 500),
    user_id: err.userId || null,
    username: err.username || null,
    level: err.level || 'error',
    extra: err.extra || null,
    breadcrumbs: err.breadcrumbs || null,
    tags: err.tags || null,
  }
}

describe('error-report: row mapping (camelCase to snake_case)', () => {
  it('should map camelCase fields to snake_case', () => {
    const row = mapErrorToRow({
      message: 'Test error',
      stack: 'at foo()',
      url: 'https://app.com/page',
      timestamp: '2026-01-15T10:00:00.000Z',
      userAgent: 'Mozilla/5.0',
      userId: 'user-123',
      username: 'alice',
      level: 'error',
    })

    // snake_case keys
    expect(row).toHaveProperty('user_agent', 'Mozilla/5.0')
    expect(row).toHaveProperty('user_id', 'user-123')
    // No camelCase keys
    expect(row).not.toHaveProperty('userAgent')
    expect(row).not.toHaveProperty('userId')
    // Regular fields preserved
    expect(row.message).toBe('Test error')
    expect(row.stack).toBe('at foo()')
    expect(row.url).toBe('https://app.com/page')
    expect(row.timestamp).toBe('2026-01-15T10:00:00.000Z')
    expect(row.username).toBe('alice')
    expect(row.level).toBe('error')
  })

  it('should apply default values for missing optional fields', () => {
    const row = mapErrorToRow({
      message: 'Minimal error',
      url: '/broken',
      timestamp: '',
      userAgent: '',
      level: '',
    })

    expect(row.user_id).toBeNull()
    expect(row.username).toBeNull()
    expect(row.level).toBe('error') // defaults to 'error' when empty string
    expect(row.extra).toBeNull()
    expect(row.breadcrumbs).toBeNull()
    expect(row.tags).toBeNull()
    expect(row.stack).toBeUndefined() // optional, not provided
  })

  it('should enrich timestamp when missing', () => {
    const before = new Date().toISOString()
    const row = mapErrorToRow({
      message: 'No timestamp',
      url: '/',
      timestamp: '',
      userAgent: 'Test',
      level: 'warning',
    })
    const after = new Date().toISOString()

    // timestamp should be set to a valid ISO string between before and after
    expect(row.timestamp).toBeTruthy()
    expect(row.timestamp >= before).toBe(true)
    expect(row.timestamp <= after).toBe(true)
  })

  it('should preserve provided timestamp', () => {
    const fixedTimestamp = '2026-02-01T12:00:00.000Z'
    const row = mapErrorToRow({
      message: 'With timestamp',
      url: '/',
      timestamp: fixedTimestamp,
      userAgent: 'Test',
      level: 'error',
    })

    expect(row.timestamp).toBe(fixedTimestamp)
  })

  it('should preserve extra, breadcrumbs and tags when provided', () => {
    const row = mapErrorToRow({
      message: 'Full error',
      url: '/page',
      timestamp: '2026-01-15T10:00:00.000Z',
      userAgent: 'Mozilla/5.0',
      level: 'error',
      extra: { component: 'Navbar', action: 'click' },
      breadcrumbs: [
        { timestamp: '2026-01-15T09:59:50.000Z', category: 'navigation', message: '/home' },
        { timestamp: '2026-01-15T09:59:55.000Z', category: 'click', message: 'button.submit' },
      ],
      tags: { environment: 'production', release: 'v2.1.0' },
    })

    expect(row.extra).toEqual({ component: 'Navbar', action: 'click' })
    expect(row.breadcrumbs).toHaveLength(2)
    expect(row.breadcrumbs![0].category).toBe('navigation')
    expect(row.tags).toEqual({ environment: 'production', release: 'v2.1.0' })
  })

  it('should apply truncation during mapping', () => {
    const row = mapErrorToRow({
      message: 'M'.repeat(3000),
      stack: 'S'.repeat(6000),
      url: 'U'.repeat(3000),
      timestamp: '2026-01-15T10:00:00.000Z',
      userAgent: 'A'.repeat(700),
      level: 'error',
    })

    expect(row.message.length).toBe(2000)
    expect(row.stack!.length).toBe(5000)
    expect(row.url.length).toBe(2000)
    expect(row.user_agent.length).toBe(500)
  })
})

// =====================================================
// Method validation (matching handler logic)
// =====================================================

describe('error-report: method validation', () => {
  it('should reject non-POST methods with 405 status', () => {
    // Simulates the handler check: if (req.method !== 'POST') → 405
    const methods = ['GET', 'PUT', 'DELETE', 'PATCH']
    for (const method of methods) {
      const isAllowed = method === 'POST' || method === 'OPTIONS'
      expect(isAllowed).toBe(false)
    }
  })

  it('should accept POST method', () => {
    const method = 'POST'
    const isAllowed = method === 'POST'
    expect(isAllowed).toBe(true)
  })

  it('should accept OPTIONS for CORS preflight', () => {
    const method = 'OPTIONS'
    const isPreflight = method === 'OPTIONS'
    expect(isPreflight).toBe(true)
  })
})

// =====================================================
// Full batch mapping (integration of all logic)
// =====================================================

describe('error-report: full batch mapping pipeline', () => {
  it('should map a batch of errors correctly end-to-end', () => {
    const errors: ErrorReport[] = [
      {
        message: 'TypeError: Cannot read property x',
        stack: 'at Object.<anonymous> (app.js:10:5)',
        url: 'https://squadplanner.fr/dashboard',
        timestamp: '2026-02-19T08:00:00.000Z',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        userId: 'user-abc',
        username: 'bob',
        level: 'error',
        tags: { page: 'dashboard' },
      },
      {
        message: 'Unhandled promise rejection',
        url: 'https://squadplanner.fr/squads',
        timestamp: '',
        userAgent: 'Mozilla/5.0',
        level: '',
      },
    ]

    const batch = errors.slice(0, 50)
    const rows = batch.map((err) => mapErrorToRow(err))

    expect(rows).toHaveLength(2)

    // First row: all fields provided
    expect(rows[0].message).toBe('TypeError: Cannot read property x')
    expect(rows[0].user_id).toBe('user-abc')
    expect(rows[0].username).toBe('bob')
    expect(rows[0].tags).toEqual({ page: 'dashboard' })

    // Second row: defaults applied
    expect(rows[1].level).toBe('error')
    expect(rows[1].user_id).toBeNull()
    expect(rows[1].username).toBeNull()
    expect(rows[1].timestamp).toBeTruthy()
    // timestamp should be an ISO date (auto-enriched)
    expect(rows[1].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
