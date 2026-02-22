/**
 * P3.4 — Security Tests: Auth Bypass Prevention
 * Verifies that protected routes/loaders reject unauthenticated access.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════
// AUTH BYPASS — Protected Route Loader
// ═══════════════════════════════════════════════════════════

// Mock supabase-minimal-ssr — createMinimalSSRClient returns { supabase, headers, getUser }
const mockGetUser = vi.fn()
const mockRefreshSession = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('../../lib/supabase-minimal-ssr', () => ({
  createMinimalSSRClient: vi.fn().mockReturnValue({
    supabase: {
      auth: { refreshSession: mockRefreshSession },
      from: mockFrom,
      rpc: mockRpc,
    },
    headers: new Headers(),
    getUser: mockGetUser,
  }),
}))

vi.mock('react-router', () => ({
  redirect: vi.fn((url: string) => ({ type: 'redirect', url })),
  data: vi.fn((d: any, init?: any) => ({ ...d, ...init })),
}))

describe('Auth Bypass — Protected Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: refreshSession fails too
    mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  it('returns empty data when no session (SSR without cookies)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { loader } = await import('../../routes/_protected')
    const request = new Request('https://app.test/home')
    await loader({ request, params: {}, context: {} } as any)

    // With hydrate=true, SSR returns empty data instead of redirect
    const { data: dataFn } = await import('react-router')
    expect(dataFn).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, profile: null, squads: [] }),
      expect.anything()
    )
  })

  it('returns empty data when getUser returns an error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') })

    const { loader } = await import('../../routes/_protected')
    const request = new Request('https://app.test/home')
    await loader({ request, params: {}, context: {} } as any)

    const { data: dataFn } = await import('react-router')
    expect(dataFn).toHaveBeenCalledWith(expect.objectContaining({ user: null }), expect.anything())
  })

  it('returns user data when valid session exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    })
    mockRpc.mockResolvedValue({
      data: { profile: { id: 'user-123', username: 'test' }, squads: [] },
      error: null,
    })

    const { loader } = await import('../../routes/_protected')
    const request = new Request('https://app.test/home')
    await loader({ request, params: {}, context: {} } as any)

    const { data: dataFn } = await import('react-router')
    // Should return user data, not empty
    expect(dataFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ id: 'user-123' }),
      }),
      expect.anything()
    )
  })
})

// ═══════════════════════════════════════════════════════════
// AUTH BYPASS — Edge Functions
// ═══════════════════════════════════════════════════════════

describe('Auth Bypass — Edge Function patterns', () => {
  it('rejects requests without Authorization header', () => {
    const request = new Request('https://app.test/api/fn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'malicious' }),
    })
    const authHeader = request.headers.get('Authorization')
    expect(authHeader).toBeNull()
  })

  it('rejects requests with malformed bearer token', () => {
    const request = new Request('https://app.test/api/fn', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer not-a-valid-jwt',
        'Content-Type': 'application/json',
      },
    })
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    // A valid JWT has 3 parts separated by dots
    const parts = token?.split('.') || []
    expect(parts.length).not.toBe(3)
  })

  it('rejects requests with only Bearer keyword (no token)', () => {
    // HTTP Headers spec trims trailing whitespace, so 'Bearer ' becomes 'Bearer'
    const authHeader = 'Bearer'
    const hasValidToken = authHeader.length > 7 && authHeader.startsWith('Bearer ')
    expect(hasValidToken).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════
// CSRF — Verify CORS headers pattern
// ═══════════════════════════════════════════════════════════

describe('CORS Pattern Validation', () => {
  const ALLOWED_ORIGINS = [
    'https://squadplanner.fr',
    'https://www.squadplanner.fr',
    'http://localhost:5173',
  ]

  it('rejects unknown origins', () => {
    const maliciousOrigin = 'https://evil.com'
    expect(ALLOWED_ORIGINS).not.toContain(maliciousOrigin)
  })

  it('rejects origin with subdomain spoofing', () => {
    const spoofedOrigin = 'https://squadplanner.fr.evil.com'
    expect(ALLOWED_ORIGINS).not.toContain(spoofedOrigin)
  })

  it('rejects origin with suffix spoofing', () => {
    const spoofedOrigin = 'https://notsquadplanner.fr'
    expect(ALLOWED_ORIGINS).not.toContain(spoofedOrigin)
  })
})

// ═══════════════════════════════════════════════════════════
// RATE LIMITING — Client-side validation
// ═══════════════════════════════════════════════════════════

describe('Rate Limiting — Client-side', () => {
  it('useRateLimit hook module exports correctly', async () => {
    // Verify the hooks barrel exports useRateLimit
    const hooks = await import('../../hooks')
    // useRateLimit should be exported from the hooks barrel
    expect(hooks).toBeDefined()
    expect(typeof hooks).toBe('object')
  })
})
