/**
 * Tests for giphy-proxy edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from giphy-proxy/index.ts)
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
  'https://www.squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.app',
]

const VERCEL_PATTERN = /^https:\/\/[\w-]+\.vercel\.app$/

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && (ALLOWED_ORIGINS.some((allowed) => origin === allowed) || VERCEL_PATTERN.test(origin))
      ? origin
      : null
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

describe('giphy-proxy: CORS logic', () => {
  it('should allow squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should allow www.squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://www.squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.fr')
  })

  it('should allow squadplanner.app origin', () => {
    const headers = getCorsHeaders('https://squadplanner.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.app')
  })

  it('should allow www.squadplanner.app origin', () => {
    const headers = getCorsHeaders('https://www.squadplanner.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.app')
  })

  it('should allow localhost:5173 origin', () => {
    const headers = getCorsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should allow localhost:5179 origin (upper bound)', () => {
    const headers = getCorsHeaders('http://localhost:5179')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5179')
  })

  it('should allow Vercel preview deployment origin', () => {
    const headers = getCorsHeaders('https://my-app-abc123.vercel.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://my-app-abc123.vercel.app')
  })

  it('should allow Vercel deployment with hyphens in name', () => {
    const headers = getCorsHeaders('https://squad-planner-preview-abc.vercel.app')
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://squad-planner-preview-abc.vercel.app'
    )
  })

  it('should NOT allow Vercel subdomain with extra path', () => {
    const headers = getCorsHeaders('https://my-app.vercel.app/evil')
    expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
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
    expect(getCorsHeaders('https://evil.com')['Access-Control-Allow-Headers']).toContain(
      'authorization'
    )
  })

  it('should always include Allow-Methods', () => {
    expect(getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Methods']).toBe(
      'POST, OPTIONS'
    )
    expect(getCorsHeaders(null)['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
    expect(getCorsHeaders('https://evil.com')['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
  })
})

// =====================================================
// Action validation (extracted from giphy-proxy/index.ts)
// =====================================================

function validateAction(action: string): { valid: boolean; error?: string } {
  if (action !== 'search' && action !== 'trending') {
    return { valid: false, error: 'Invalid action. Use "search" or "trending".' }
  }
  return { valid: true }
}

describe('giphy-proxy: action validation', () => {
  it('should accept "search" as a valid action', () => {
    expect(validateAction('search')).toEqual({ valid: true })
  })

  it('should accept "trending" as a valid action', () => {
    expect(validateAction('trending')).toEqual({ valid: true })
  })

  it('should reject invalid action "random"', () => {
    const result = validateAction('random')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid action. Use "search" or "trending".')
  })

  it('should reject empty string action', () => {
    const result = validateAction('')
    expect(result.valid).toBe(false)
  })

  it('should default to "trending" when action is undefined', () => {
    const body: { action?: string } = {}
    const action = body.action ?? 'trending'
    expect(action).toBe('trending')
    expect(validateAction(action)).toEqual({ valid: true })
  })
})

// =====================================================
// Query validation (extracted from giphy-proxy/index.ts)
// =====================================================

function validateQuery(action: string, query: unknown): { valid: boolean; error?: string } {
  if (action === 'search' && (!query || typeof query !== 'string')) {
    return { valid: false, error: 'query is required for search action' }
  }
  return { valid: true }
}

describe('giphy-proxy: query validation', () => {
  it('should require query for search action', () => {
    const result = validateQuery('search', undefined)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('query is required for search action')
  })

  it('should reject empty string query for search action', () => {
    const result = validateQuery('search', '')
    expect(result.valid).toBe(false)
  })

  it('should reject non-string query for search action', () => {
    const result = validateQuery('search', 123)
    expect(result.valid).toBe(false)
  })

  it('should accept valid string query for search action', () => {
    const result = validateQuery('search', 'funny cats')
    expect(result.valid).toBe(true)
  })

  it('should NOT require query for trending action', () => {
    const result = validateQuery('trending', undefined)
    expect(result.valid).toBe(true)
  })

  it('should accept trending with no query at all', () => {
    const result = validateQuery('trending', null)
    expect(result.valid).toBe(true)
  })
})

// =====================================================
// URL construction (extracted from giphy-proxy/index.ts)
// =====================================================

const GIPHY_BASE = 'https://api.giphy.com/v1/gifs'

function buildGiphyUrl(
  apiKey: string,
  action: string,
  query: string | undefined,
  limit: number = 20
): string {
  let url = `${GIPHY_BASE}/${action}?api_key=${encodeURIComponent(apiKey)}&rating=pg-13&lang=fr&limit=${limit}`
  if (action === 'search' && query) {
    url += `&q=${encodeURIComponent(query)}`
  }
  return url
}

describe('giphy-proxy: URL construction', () => {
  const API_KEY = 'test-api-key-123'

  it('should build trending URL with correct base', () => {
    const url = buildGiphyUrl(API_KEY, 'trending', undefined)
    expect(url).toContain('https://api.giphy.com/v1/gifs/trending?')
  })

  it('should build search URL with correct base', () => {
    const url = buildGiphyUrl(API_KEY, 'search', 'cats')
    expect(url).toContain('https://api.giphy.com/v1/gifs/search?')
  })

  it('should include encoded api_key', () => {
    const url = buildGiphyUrl('key with spaces', 'trending', undefined)
    expect(url).toContain('api_key=key%20with%20spaces')
  })

  it('should include rating=pg-13', () => {
    const url = buildGiphyUrl(API_KEY, 'trending', undefined)
    expect(url).toContain('rating=pg-13')
  })

  it('should include lang=fr', () => {
    const url = buildGiphyUrl(API_KEY, 'trending', undefined)
    expect(url).toContain('lang=fr')
  })

  it('should default limit to 20', () => {
    const url = buildGiphyUrl(API_KEY, 'trending', undefined)
    expect(url).toContain('limit=20')
  })

  it('should use custom limit when provided', () => {
    const url = buildGiphyUrl(API_KEY, 'trending', undefined, 10)
    expect(url).toContain('limit=10')
  })

  it('should append encoded query for search action', () => {
    const url = buildGiphyUrl(API_KEY, 'search', 'funny cats')
    expect(url).toContain('q=funny%20cats')
  })

  it('should NOT append query for trending action', () => {
    const url = buildGiphyUrl(API_KEY, 'trending', undefined)
    expect(url).not.toContain('&q=')
  })

  it('should encode special characters in query', () => {
    const url = buildGiphyUrl(API_KEY, 'search', 'hello & world')
    expect(url).toContain('q=hello%20%26%20world')
  })
})

// =====================================================
// Cache headers (extracted from giphy-proxy/index.ts)
// =====================================================

function buildSuccessHeaders(corsHeaders: Record<string, string>): Record<string, string> {
  return {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  }
}

describe('giphy-proxy: cache headers', () => {
  it('should include Cache-Control with 5 minute max-age on success', () => {
    const headers = buildSuccessHeaders({})
    expect(headers['Cache-Control']).toBe('public, max-age=300')
  })

  it('should include Content-Type application/json', () => {
    const headers = buildSuccessHeaders({})
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should preserve CORS headers in success response', () => {
    const cors = getCorsHeaders('https://squadplanner.fr')
    const headers = buildSuccessHeaders(cors)
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Headers']).toContain('authorization')
    expect(headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
    expect(headers['Cache-Control']).toBe('public, max-age=300')
  })
})
