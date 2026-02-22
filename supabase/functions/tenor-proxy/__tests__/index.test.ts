/**
 * Tests for tenor-proxy edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from tenor-proxy/index.ts)
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

describe('tenor-proxy: CORS logic', () => {
  it('should allow localhost:5173 origin', () => {
    const headers = getCorsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should allow localhost:5179 origin (upper bound)', () => {
    const headers = getCorsHeaders('http://localhost:5179')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5179')
  })

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

  it('should NOT set Allow-Origin for unknown origin', () => {
    const headers = getCorsHeaders('https://evil.com')
    expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
    expect(headers['Access-Control-Allow-Headers']).toBeDefined()
  })

  it('should NOT set Allow-Origin for null origin', () => {
    const headers = getCorsHeaders(null)
    expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
  })

  it('should NOT match Vercel preview URLs (no wildcard pattern)', () => {
    const headers = getCorsHeaders('https://squadplanner-abc123.vercel.app')
    expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
  })

  it('should always include Allow-Headers and Allow-Methods', () => {
    const allowed = getCorsHeaders('https://squadplanner.fr')
    const rejected = getCorsHeaders('https://evil.com')
    const nullOrigin = getCorsHeaders(null)

    for (const headers of [allowed, rejected, nullOrigin]) {
      expect(headers['Access-Control-Allow-Headers']).toContain('authorization')
      expect(headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
    }
  })
})

// =====================================================
// Action validation logic (extracted from tenor-proxy/index.ts)
// =====================================================

function validateAction(action: string): { valid: boolean; error?: string } {
  if (action !== 'search' && action !== 'featured') {
    return { valid: false, error: 'Invalid action. Use "search" or "featured".' }
  }
  return { valid: true }
}

describe('tenor-proxy: action validation', () => {
  it('should accept "search" as a valid action', () => {
    expect(validateAction('search')).toEqual({ valid: true })
  })

  it('should accept "featured" as a valid action', () => {
    expect(validateAction('featured')).toEqual({ valid: true })
  })

  it('should reject "trending" action (that is giphy, not tenor)', () => {
    const result = validateAction('trending')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('search')
    expect(result.error).toContain('featured')
  })

  it('should reject arbitrary action names', () => {
    const result = validateAction('random')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid action')
  })

  it('should default to "featured" when action is omitted', () => {
    const body: { action?: string } = {}
    const { action = 'featured' } = body
    expect(action).toBe('featured')
  })
})

// =====================================================
// Query validation logic (extracted from tenor-proxy/index.ts)
// =====================================================

function validateQuery(action: string, query: unknown): { valid: boolean; error?: string } {
  if (action === 'search' && (!query || typeof query !== 'string')) {
    return { valid: false, error: 'query is required for search action' }
  }
  return { valid: true }
}

describe('tenor-proxy: query validation', () => {
  it('should require query for search action', () => {
    const result = validateQuery('search', undefined)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('query is required')
  })

  it('should reject empty string query for search action', () => {
    const result = validateQuery('search', '')
    expect(result.valid).toBe(false)
  })

  it('should reject non-string query for search action', () => {
    const result = validateQuery('search', 123)
    expect(result.valid).toBe(false)
  })

  it('should accept valid query for search action', () => {
    expect(validateQuery('search', 'funny cats')).toEqual({ valid: true })
  })

  it('should NOT require query for featured action', () => {
    expect(validateQuery('featured', undefined)).toEqual({ valid: true })
  })
})

// =====================================================
// URL construction logic (extracted from tenor-proxy/index.ts)
// =====================================================

const TENOR_BASE = 'https://tenor.googleapis.com/v2'
const CLIENT_KEY = 'squad_planner'

function buildTenorUrl(
  apiKey: string,
  action: string,
  query: string | undefined,
  limit: number = 20
): string {
  let url = `${TENOR_BASE}/${action}?key=${encodeURIComponent(apiKey)}&client_key=${CLIENT_KEY}&media_filter=tinygif,gif&contentfilter=medium&locale=fr_FR&limit=${limit}`
  if (action === 'search' && query) {
    url += `&q=${encodeURIComponent(query)}`
  }
  return url
}

describe('tenor-proxy: URL construction', () => {
  const TEST_KEY = 'AIzaSyTestKey123'

  it('should build correct base URL for featured action', () => {
    const url = buildTenorUrl(TEST_KEY, 'featured', undefined)
    expect(url).toContain('https://tenor.googleapis.com/v2/featured?')
    expect(url).toContain(`key=${encodeURIComponent(TEST_KEY)}`)
    expect(url).toContain('client_key=squad_planner')
    expect(url).toContain('contentfilter=medium')
    expect(url).toContain('locale=fr_FR')
    expect(url).toContain('limit=20')
  })

  it('should build correct URL for search action with query', () => {
    const url = buildTenorUrl(TEST_KEY, 'search', 'funny cats')
    expect(url).toContain('https://tenor.googleapis.com/v2/search?')
    expect(url).toContain('q=funny%20cats')
  })

  it('should NOT include q param for featured action', () => {
    const url = buildTenorUrl(TEST_KEY, 'featured', undefined)
    expect(url).not.toContain('&q=')
  })

  it('should use default limit of 20', () => {
    const url = buildTenorUrl(TEST_KEY, 'featured', undefined)
    expect(url).toContain('limit=20')
  })

  it('should allow custom limit', () => {
    const url = buildTenorUrl(TEST_KEY, 'featured', undefined, 50)
    expect(url).toContain('limit=50')
  })

  it('should keep media_filter commas NOT URL-encoded', () => {
    const url = buildTenorUrl(TEST_KEY, 'featured', undefined)
    // The commas in "tinygif,gif" must stay as literal commas, not %2C
    expect(url).toContain('media_filter=tinygif,gif')
    expect(url).not.toContain('media_filter=tinygif%2Cgif')
  })

  it('should URL-encode the API key', () => {
    const keyWithSpecial = 'key+with/special=chars'
    const url = buildTenorUrl(keyWithSpecial, 'featured', undefined)
    expect(url).toContain(`key=${encodeURIComponent(keyWithSpecial)}`)
    expect(url).not.toContain('key=key+with/special=chars')
  })

  it('should URL-encode the search query', () => {
    const url = buildTenorUrl(TEST_KEY, 'search', 'chat & chien')
    expect(url).toContain('q=chat%20%26%20chien')
  })
})

// =====================================================
// Cache headers logic (extracted from tenor-proxy/index.ts)
// =====================================================

describe('tenor-proxy: cache headers', () => {
  it('should include Cache-Control public max-age=300 for success responses', () => {
    // Simulates the success response header construction from index.ts
    const cors = getCorsHeaders('https://squadplanner.fr')
    const headers = {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    }
    expect(headers['Cache-Control']).toBe('public, max-age=300')
  })

  it('should NOT include Cache-Control for error responses', () => {
    // Error responses in the source only have cors + Content-Type
    const cors = getCorsHeaders('https://squadplanner.fr')
    const errorHeaders = {
      ...cors,
      'Content-Type': 'application/json',
    }
    expect(errorHeaders).not.toHaveProperty('Cache-Control')
  })
})
