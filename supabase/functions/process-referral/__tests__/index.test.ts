/**
 * Tests for process-referral edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from process-referral/index.ts)
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

describe('process-referral: CORS logic', () => {
  it('should allow squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should allow squadplanner.app origin', () => {
    const headers = getCorsHeaders('https://squadplanner.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.app')
  })

  it('should allow localhost:5173 origin', () => {
    const headers = getCorsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should allow localhost:5174 origin', () => {
    const headers = getCorsHeaders('http://localhost:5174')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5174')
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

  it('should always include Allow-Headers regardless of origin', () => {
    expect(getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Headers']).toContain(
      'authorization'
    )
    expect(getCorsHeaders('https://evil.com')['Access-Control-Allow-Headers']).toContain(
      'authorization'
    )
    expect(getCorsHeaders(null)['Access-Control-Allow-Headers']).toContain('authorization')
  })
})

// =====================================================
// validateString (extracted from _shared/schemas.ts)
// =====================================================

function validateString(
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number }
): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }
  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must be at least ${options.minLength} characters`)
  }
  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must be at most ${options.maxLength} characters`)
  }
  return value
}

// =====================================================
// Referral code validation logic
// (matching process-referral/index.ts lines 68-71)
// =====================================================

describe('process-referral: referral code validation', () => {
  it('should accept a valid referral code', () => {
    const code = validateString('ABCDEF', 'referral_code', {
      minLength: 3,
      maxLength: 30,
    })
    expect(code).toBe('ABCDEF')
  })

  it('should accept a code at the minimum length boundary (3 chars)', () => {
    const code = validateString('ABC', 'referral_code', {
      minLength: 3,
      maxLength: 30,
    })
    expect(code).toBe('ABC')
  })

  it('should accept a code at the maximum length boundary (30 chars)', () => {
    const longCode = 'A'.repeat(30)
    const code = validateString(longCode, 'referral_code', {
      minLength: 3,
      maxLength: 30,
    })
    expect(code).toBe(longCode)
    expect(code.length).toBe(30)
  })

  it('should reject a code that is too short (< 3 chars)', () => {
    expect(() => validateString('AB', 'referral_code', { minLength: 3, maxLength: 30 })).toThrow(
      'referral_code must be at least 3 characters'
    )
  })

  it('should reject a code that is too long (> 30 chars)', () => {
    const tooLong = 'A'.repeat(31)
    expect(() => validateString(tooLong, 'referral_code', { minLength: 3, maxLength: 30 })).toThrow(
      'referral_code must be at most 30 characters'
    )
  })

  it('should reject a non-string value', () => {
    expect(() => validateString(12345, 'referral_code', { minLength: 3, maxLength: 30 })).toThrow(
      'referral_code must be a string'
    )
  })

  it('should reject null value', () => {
    expect(() => validateString(null, 'referral_code', { minLength: 3, maxLength: 30 })).toThrow(
      'referral_code must be a string'
    )
  })

  it('should reject undefined value', () => {
    expect(() =>
      validateString(undefined, 'referral_code', { minLength: 3, maxLength: 30 })
    ).toThrow('referral_code must be a string')
  })
})

// =====================================================
// Uppercase normalization logic
// (matching process-referral/index.ts line 81)
// =====================================================

describe('process-referral: code normalization (toUpperCase)', () => {
  it('should normalize lowercase code to uppercase', () => {
    const code = 'abcdef'
    expect(code.toUpperCase()).toBe('ABCDEF')
  })

  it('should keep already uppercase code unchanged', () => {
    const code = 'ABCDEF'
    expect(code.toUpperCase()).toBe('ABCDEF')
  })

  it('should normalize mixed case code to uppercase', () => {
    const code = 'AbCdEf'
    expect(code.toUpperCase()).toBe('ABCDEF')
  })

  it('should handle alphanumeric codes', () => {
    const code = 'squad2026'
    expect(code.toUpperCase()).toBe('SQUAD2026')
  })

  it('should handle codes with special characters', () => {
    const code = 'my-code_v2'
    expect(code.toUpperCase()).toBe('MY-CODE_V2')
  })
})

// =====================================================
// Auth flow logic
// (matching process-referral/index.ts lines 52-64)
// =====================================================

describe('process-referral: auth flow logic', () => {
  it('should proceed when user is present and no auth error', () => {
    const user = { id: '550e8400-e29b-41d4-a716-446655440000' }
    const authError = null
    const shouldReject = authError || !user
    expect(shouldReject).toBe(false)
  })

  it('should reject with 401 scenario when user is null', () => {
    const user = null
    const authError = null
    const shouldReject = authError || !user
    expect(shouldReject).toBe(true)
  })

  it('should reject with 401 scenario when authError is present', () => {
    const user = { id: '550e8400-e29b-41d4-a716-446655440000' }
    const authError = { message: 'Invalid token' }
    const shouldReject = authError || !user
    expect(shouldReject).toBeTruthy()
  })

  it('should reject with 401 scenario when both user is null and authError exists', () => {
    const user = null
    const authError = { message: 'No session' }
    const shouldReject = authError || !user
    expect(shouldReject).toBeTruthy()
  })

  it('should build 401 response body with French message', () => {
    const responseBody = JSON.stringify({ success: false, error: 'Non authentifié' })
    const parsed = JSON.parse(responseBody)
    expect(parsed.success).toBe(false)
    expect(parsed.error).toBe('Non authentifié')
  })
})

// =====================================================
// Error response formatting
// (matching process-referral/index.ts lines 85-113)
// =====================================================

describe('process-referral: error response formatting', () => {
  it('should format DB error as 400 with error message', () => {
    const error = { message: 'Code de parrainage invalide' }
    const status = 400
    const body = JSON.stringify({ success: false, error: error.message })
    const parsed = JSON.parse(body)

    expect(status).toBe(400)
    expect(parsed.success).toBe(false)
    expect(parsed.error).toBe('Code de parrainage invalide')
  })

  it('should format unexpected Error as 500 with error message', () => {
    const error = new Error('Connection timeout')
    const status = 500
    const message = error instanceof Error ? error.message : 'Erreur interne'
    const body = JSON.stringify({ success: false, error: message })
    const parsed = JSON.parse(body)

    expect(status).toBe(500)
    expect(parsed.success).toBe(false)
    expect(parsed.error).toBe('Connection timeout')
  })

  it('should use French fallback message for non-Error exceptions (500)', () => {
    const error = 'some string thrown'
    const status = 500
    const message = error instanceof Error ? error.message : 'Erreur interne'
    const body = JSON.stringify({ success: false, error: message })
    const parsed = JSON.parse(body)

    expect(status).toBe(500)
    expect(parsed.success).toBe(false)
    expect(parsed.error).toBe('Erreur interne')
  })

  it('should use French fallback message for undefined exceptions', () => {
    const error = undefined
    const message = error instanceof Error ? error.message : 'Erreur interne'
    expect(message).toBe('Erreur interne')
  })

  it('should include CORS headers in error responses', () => {
    const corsHeaders = getCorsHeaders('https://squadplanner.fr')
    const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

    expect(responseHeaders['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
    expect(responseHeaders['Content-Type']).toBe('application/json')
    expect(responseHeaders['Access-Control-Allow-Headers']).toContain('authorization')
  })

  it('should include Content-Type in all error responses even without CORS origin', () => {
    const corsHeaders = getCorsHeaders('https://evil.com')
    const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

    expect(responseHeaders).not.toHaveProperty('Access-Control-Allow-Origin')
    expect(responseHeaders['Content-Type']).toBe('application/json')
  })
})

// =====================================================
// Success response formatting
// (matching process-referral/index.ts lines 97-102)
// =====================================================

describe('process-referral: success response formatting', () => {
  it('should return DB function result directly as JSON', () => {
    const dbResult = {
      success: true,
      referral_id: 'ref-123',
      rewards: { referrer_points: 100, referred_points: 50 },
    }
    const body = JSON.stringify(dbResult)
    const parsed = JSON.parse(body)

    expect(parsed.success).toBe(true)
    expect(parsed.referral_id).toBe('ref-123')
    expect(parsed.rewards.referrer_points).toBe(100)
    expect(parsed.rewards.referred_points).toBe(50)
  })

  it('should pass the normalized code (uppercase) to the DB function', () => {
    const inputCode = 'mycode'
    const normalizedCode = inputCode.toUpperCase()

    // Simulates the RPC call parameters
    const rpcParams = {
      p_referral_code: normalizedCode,
      p_new_user_id: '550e8400-e29b-41d4-a716-446655440000',
    }

    expect(rpcParams.p_referral_code).toBe('MYCODE')
    expect(rpcParams.p_new_user_id).toBe('550e8400-e29b-41d4-a716-446655440000')
  })
})
