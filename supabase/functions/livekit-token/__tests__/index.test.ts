/**
 * Tests for livekit-token Edge Function
 * Covers: CORS, auth (missing/invalid Bearer token), missing LiveKit config (503),
 *         input validation, token generation, HEAD health check
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stubs & Mocks
// ---------------------------------------------------------------------------

const ENV: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  LIVEKIT_API_KEY: 'lk-api-key-test',
  LIVEKIT_API_SECRET: 'lk-api-secret-test',
}

const MOCK_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
}

function createMockAuthClient(user: typeof MOCK_USER | null, error?: unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: error ?? null,
      }),
    },
  }
}

// Mock AccessToken class (must use mockImplementation for new-able constructor)
function createMockAccessToken() {
  const mockToken = {
    addGrant: vi.fn(),
    toJwt: vi.fn().mockResolvedValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-livekit-token'),
  }
  const MockAccessToken = vi.fn().mockImplementation(function (this: any) {
    Object.assign(this, mockToken)
    return this
  })
  return {
    MockAccessToken,
    instance: mockToken,
  }
}

// ---------------------------------------------------------------------------
// Helpers - replicate pure logic from source
// ---------------------------------------------------------------------------

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
  ENV.SUPABASE_URL,
].filter(Boolean)

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

// ---------------------------------------------------------------------------
// Handler builder with injected dependencies
// ---------------------------------------------------------------------------

interface LiveKitHandlerDeps {
  authClient: ReturnType<typeof createMockAuthClient>
  livekitApiKey: string
  livekitApiSecret: string
  AccessToken: ReturnType<typeof createMockAccessToken>['MockAccessToken']
}

function buildHandler(deps: LiveKitHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin')

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(origin) })
    }

    // Handle HEAD requests for health checks
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: getCorsHeaders(origin) })
    }

    try {
      // Check if LiveKit is configured
      if (!deps.livekitApiKey || !deps.livekitApiSecret) {
        return new Response(
          JSON.stringify({ error: 'LiveKit credentials not configured on server' }),
          {
            status: 503,
            headers: {
              ...getCorsHeaders(origin),
              'Content-Type': 'application/json',
            },
          }
        )
      }

      // Verify user authentication
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: {
            ...getCorsHeaders(origin),
            'Content-Type': 'application/json',
          },
        })
      }

      const {
        data: { user },
        error: authError,
      } = await deps.authClient.auth.getUser()

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: invalid or expired token' }), {
          status: 401,
          headers: {
            ...getCorsHeaders(origin),
            'Content-Type': 'application/json',
          },
        })
      }

      // Parse request body
      let body: { room_name?: string; participant_identity?: string; participant_name?: string }
      try {
        body = await req.json()
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: {
            ...getCorsHeaders(origin),
            'Content-Type': 'application/json',
          },
        })
      }

      const { room_name, participant_identity, participant_name } = body

      if (!room_name || typeof room_name !== 'string') {
        return new Response(JSON.stringify({ error: 'room_name is required' }), {
          status: 400,
          headers: {
            ...getCorsHeaders(origin),
            'Content-Type': 'application/json',
          },
        })
      }

      if (!participant_identity || typeof participant_identity !== 'string') {
        return new Response(JSON.stringify({ error: 'participant_identity is required' }), {
          status: 400,
          headers: {
            ...getCorsHeaders(origin),
            'Content-Type': 'application/json',
          },
        })
      }

      // Generate token using official LiveKit SDK
      const at = new deps.AccessToken(deps.livekitApiKey, deps.livekitApiSecret, {
        identity: participant_identity,
        name: participant_name || participant_identity,
        ttl: '24h',
      })

      at.addGrant({
        room: room_name,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      })

      const token = await at.toJwt()

      return new Response(
        JSON.stringify({
          token,
          room: room_name,
          identity: participant_identity,
        }),
        {
          headers: {
            ...getCorsHeaders(origin),
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('livekit-token', () => {
  let mockAuth: ReturnType<typeof createMockAuthClient>
  let mockAccessToken: ReturnType<typeof createMockAccessToken>
  let handler: (req: Request) => Promise<Response>

  beforeEach(() => {
    vi.restoreAllMocks()
    mockAuth = createMockAuthClient(MOCK_USER)
    mockAccessToken = createMockAccessToken()
    handler = buildHandler({
      authClient: mockAuth,
      livekitApiKey: ENV.LIVEKIT_API_KEY,
      livekitApiSecret: ENV.LIVEKIT_API_SECRET,
      AccessToken: mockAccessToken.MockAccessToken,
    })
  })

  // ------- CORS & preflight -------

  describe('CORS & preflight', () => {
    it('responds to OPTIONS with CORS headers for allowed origin', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'OPTIONS',
        headers: { origin: 'https://squadplanner.fr' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://squadplanner.fr')
    })

    it('responds to HEAD with 200 (health check)', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'HEAD',
        headers: { origin: 'https://squadplanner.app' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
    })

    it('does not include Access-Control-Allow-Origin for unknown origins', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.com' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('allows localhost ports 5173-5179', async () => {
      for (const port of [5173, 5174, 5175, 5176, 5177, 5178, 5179]) {
        const req = new Request('https://edge.fn/livekit-token', {
          method: 'OPTIONS',
          headers: { origin: `http://localhost:${port}` },
        })
        const res = await handler(req)
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(`http://localhost:${port}`)
      }
    })
  })

  // ------- LiveKit configuration -------

  describe('LiveKit configuration', () => {
    it('returns 503 when LIVEKIT_API_KEY is missing', async () => {
      handler = buildHandler({
        authClient: mockAuth,
        livekitApiKey: '',
        livekitApiSecret: ENV.LIVEKIT_API_SECRET,
        AccessToken: mockAccessToken.MockAccessToken,
      })

      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'test-room',
          participant_identity: 'user-1',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(503)
      const json = await res.json()
      expect(json.error).toMatch(/LiveKit credentials not configured/)
    })

    it('returns 503 when LIVEKIT_API_SECRET is missing', async () => {
      handler = buildHandler({
        authClient: mockAuth,
        livekitApiKey: ENV.LIVEKIT_API_KEY,
        livekitApiSecret: '',
        AccessToken: mockAccessToken.MockAccessToken,
      })

      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'test-room',
          participant_identity: 'user-1',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(503)
    })
  })

  // ------- Authentication -------

  describe('authentication', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'test-room',
          participant_identity: 'user-1',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toMatch(/Missing or invalid Authorization/)
    })

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'test-room',
          participant_identity: 'user-1',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic abc123',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toMatch(/Missing or invalid Authorization/)
    })

    it('returns 401 when JWT is invalid (getUser returns error)', async () => {
      mockAuth = createMockAuthClient(null, { message: 'expired token' })
      handler = buildHandler({
        authClient: mockAuth,
        livekitApiKey: ENV.LIVEKIT_API_KEY,
        livekitApiSecret: ENV.LIVEKIT_API_SECRET,
        AccessToken: mockAccessToken.MockAccessToken,
      })

      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'test-room',
          participant_identity: 'user-1',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer expired-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toMatch(/Unauthorized/)
    })

    it('returns 401 when user is null (no auth error but no user)', async () => {
      mockAuth = createMockAuthClient(null)
      handler = buildHandler({
        authClient: mockAuth,
        livekitApiKey: ENV.LIVEKIT_API_KEY,
        livekitApiSecret: ENV.LIVEKIT_API_SECRET,
        AccessToken: mockAccessToken.MockAccessToken,
      })

      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'test-room',
          participant_identity: 'user-1',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer some-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(401)
    })
  })

  // ------- Input validation -------

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: 'not json',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Invalid JSON/)
    })

    it('returns 400 when room_name is missing', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({ participant_identity: 'user-1' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('room_name is required')
    })

    it('returns 400 when room_name is not a string', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({ room_name: 123, participant_identity: 'user-1' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('room_name is required')
    })

    it('returns 400 when participant_identity is missing', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({ room_name: 'test-room' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('participant_identity is required')
    })

    it('returns 400 when participant_identity is not a string', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({ room_name: 'test-room', participant_identity: 42 }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('participant_identity is required')
    })
  })

  // ------- Token generation -------

  describe('token generation', () => {
    it('creates AccessToken with correct identity, room grants, and returns token', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'squad-room-42',
          participant_identity: 'player-abc',
          participant_name: 'CoolPlayer',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
          origin: 'https://squadplanner.fr',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      // Verify response structure
      expect(json.token).toBeDefined()
      expect(json.room).toBe('squad-room-42')
      expect(json.identity).toBe('player-abc')

      // Verify AccessToken was constructed correctly
      expect(mockAccessToken.MockAccessToken).toHaveBeenCalledWith(
        ENV.LIVEKIT_API_KEY,
        ENV.LIVEKIT_API_SECRET,
        {
          identity: 'player-abc',
          name: 'CoolPlayer',
          ttl: '24h',
        }
      )

      // Verify grant was added
      expect(mockAccessToken.instance.addGrant).toHaveBeenCalledWith({
        room: 'squad-room-42',
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      })

      // Verify toJwt was called
      expect(mockAccessToken.instance.toJwt).toHaveBeenCalled()
    })

    it('uses participant_identity as name when participant_name is not provided', async () => {
      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'squad-room-42',
          participant_identity: 'player-abc',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)

      expect(mockAccessToken.MockAccessToken).toHaveBeenCalledWith(
        ENV.LIVEKIT_API_KEY,
        ENV.LIVEKIT_API_SECRET,
        {
          identity: 'player-abc',
          name: 'player-abc', // fallback to identity
          ttl: '24h',
        }
      )
    })

    it('returns 500 when token generation throws', async () => {
      mockAccessToken.instance.toJwt.mockRejectedValue(new Error('JWT signing failed'))

      const req = new Request('https://edge.fn/livekit-token', {
        method: 'POST',
        body: JSON.stringify({
          room_name: 'squad-room-42',
          participant_identity: 'player-abc',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('JWT signing failed')
    })
  })

  // ------- Helper unit tests -------

  describe('getCorsHeaders', () => {
    it('includes Access-Control-Allow-Origin for allowed origin', () => {
      const headers = getCorsHeaders('https://squadplanner.fr')
      expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
    })

    it('does not include Allow-Origin for disallowed origin', () => {
      const headers = getCorsHeaders('https://malicious.com')
      expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
    })

    it('does not include Allow-Origin when origin is null', () => {
      const headers = getCorsHeaders(null)
      expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
    })

    it('allows www.squadplanner.app', () => {
      const headers = getCorsHeaders('https://www.squadplanner.app')
      expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.app')
    })

    it('allows www.squadplanner.fr', () => {
      const headers = getCorsHeaders('https://www.squadplanner.fr')
      expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.fr')
    })
  })
})
