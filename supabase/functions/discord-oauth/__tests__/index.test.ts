/**
 * Tests for discord-oauth Edge Function
 * Covers: CORS, auth, link flow (code exchange, Discord API errors, conflict),
 *         unlink flow, HEAD health check, input validation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stubs & Mocks
// ---------------------------------------------------------------------------

const ENV: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  DISCORD_CLIENT_ID: 'discord-client-id',
  DISCORD_CLIENT_SECRET: 'discord-client-secret',
}

// Mock user returned by supabase auth
const MOCK_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
}

// Supabase mock builder
// The discord-oauth handler calls from() twice with different patterns:
//   1. from('profiles').select('id, username').eq('discord_user_id', ...).single()
//   2. from('profiles').update({...}).eq('id', ...)
// We need from() to return independent chains so overriding eq behavior for
// the update path does not break the select+single path.
function createMockSupabaseChain(overrides?: {
  singleData?: unknown
  updateError?: unknown
}) {
  // --- select chain: supports .select().eq().single() ---
  const selectChain: Record<string, ReturnType<typeof vi.fn>> = {}
  selectChain.single = vi.fn().mockResolvedValue({ data: overrides?.singleData ?? null, error: null })
  selectChain.eq = vi.fn().mockReturnValue(selectChain)

  // --- update chain: supports .update().eq() resolving to { error } ---
  const updateEqResult = overrides?.updateError
    ? { error: overrides.updateError }
    : { error: null }
  const updateChain: Record<string, ReturnType<typeof vi.fn>> = {}
  updateChain.eq = vi.fn().mockResolvedValue(updateEqResult)

  // Top-level chain returned by from()
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(selectChain)
  chain.update = vi.fn().mockReturnValue(updateChain)
  chain.insert = vi.fn().mockResolvedValue({ data: null, error: null })
  // Keep eq on chain for the unlink path (from().update().eq())
  chain.eq = vi.fn().mockResolvedValue(updateEqResult)

  const from = vi.fn().mockReturnValue(chain)

  return { from, chain, selectChain, updateChain }
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

// ---------------------------------------------------------------------------
// Helpers - replicate pure logic from source
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://www.squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.app',
  ENV.SUPABASE_URL,
].filter(Boolean)

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  // Allow Vercel preview deployments
  if (/^https:\/\/squadplanner[a-z0-9-]*\.vercel\.app$/.test(origin)) return true
  return false
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, HEAD',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, HEAD',
  }
}

function jsonResponse(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Handler builder with injected dependencies
// ---------------------------------------------------------------------------

interface DiscordHandlerDeps {
  authClient: ReturnType<typeof createMockAuthClient>
  supabaseAdmin: ReturnType<typeof createMockSupabaseChain>
  discordClientId: string
  discordClientSecret: string
  fetchDiscordToken: (
    code: string,
    redirectUri: string,
    clientId: string,
    clientSecret: string
  ) => Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<unknown> }>
  fetchDiscordUser: (
    accessToken: string
  ) => Promise<{ ok: boolean; json: () => Promise<unknown> }>
}

function buildHandler(deps: DiscordHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin')

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(origin) })
    }
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: getCorsHeaders(origin) })
    }
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin)
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await deps.authClient.auth.getUser()

      if (authError || !user) {
        return jsonResponse({ error: 'Non autorise' }, 401, origin)
      }

      let body: { code: string; redirect_uri: string; action?: string }
      try {
        body = await req.json()
      } catch {
        return jsonResponse({ error: 'JSON invalide' }, 400, origin)
      }

      // Handle unlink action
      if (body.action === 'unlink') {
        const { error: unlinkError } = await deps.supabaseAdmin
          .from('profiles')
          .update({ discord_user_id: null, discord_username: null })
          .eq('id', user.id)

        if (unlinkError) {
          return jsonResponse({ error: 'Erreur lors de la dissociation' }, 500, origin)
        }

        return jsonResponse({ success: true, action: 'unlinked' }, 200, origin)
      }

      // Validate code and redirect_uri
      if (!body.code || typeof body.code !== 'string') {
        return jsonResponse({ error: 'Code OAuth manquant' }, 400, origin)
      }
      if (!body.redirect_uri || typeof body.redirect_uri !== 'string') {
        return jsonResponse({ error: 'redirect_uri manquant' }, 400, origin)
      }

      // Validate Discord credentials are configured
      if (!deps.discordClientId || !deps.discordClientSecret) {
        return jsonResponse(
          { error: 'Configuration Discord manquante cote serveur (CLIENT_ID ou SECRET)' },
          500,
          origin
        )
      }

      // Exchange code for access token via Discord API
      const tokenResponse = await deps.fetchDiscordToken(
        body.code,
        body.redirect_uri,
        deps.discordClientId,
        deps.discordClientSecret
      )

      if (!tokenResponse.ok) {
        const tokenErrorText = await tokenResponse.text()
        let discordError = 'Code OAuth invalide ou expire'
        try {
          const parsed = JSON.parse(tokenErrorText)
          if (parsed.error === 'invalid_grant') {
            discordError = `Code OAuth invalide (redirect_uri envoye: ${body.redirect_uri})`
          } else if (parsed.error === 'invalid_client') {
            discordError = 'Client Discord invalide (CLIENT_ID ou CLIENT_SECRET incorrect)'
          } else if (parsed.error_description) {
            discordError = `Discord: ${parsed.error_description}`
          }
        } catch {
          /* text wasn't JSON */
        }
        return jsonResponse({ error: discordError }, 400, origin)
      }

      const tokenData = (await tokenResponse.json()) as { access_token: string }

      // Get Discord user info
      const userResponse = await deps.fetchDiscordUser(tokenData.access_token)

      if (!userResponse.ok) {
        return jsonResponse({ error: 'Impossible de recuperer les infos Discord' }, 500, origin)
      }

      const discordUser = (await userResponse.json()) as {
        id: string
        global_name?: string
        username: string
      }
      const discordUserId = discordUser.id
      const discordUsername = discordUser.global_name || discordUser.username

      // Check if this Discord account is already linked to another user
      const { data: existingProfile } = await deps.supabaseAdmin
        .from('profiles')
        .select('id, username')
        .eq('discord_user_id', discordUserId)
        .single()

      if (existingProfile && existingProfile.id !== user.id) {
        return jsonResponse(
          {
            error: `Ce compte Discord est deja lie au profil "${existingProfile.username}"`,
          },
          409,
          origin
        )
      }

      // Link Discord to profile
      const { error: updateError } = await deps.supabaseAdmin
        .from('profiles')
        .update({
          discord_user_id: discordUserId,
          discord_username: discordUsername,
        })
        .eq('id', user.id)

      if (updateError) {
        return jsonResponse({ error: 'Erreur lors de la mise a jour du profil' }, 500, origin)
      }

      return jsonResponse(
        {
          success: true,
          discord_username: discordUsername,
          discord_user_id: discordUserId,
        },
        200,
        origin
      )
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500, origin)
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('discord-oauth', () => {
  let mockAuth: ReturnType<typeof createMockAuthClient>
  let mockSupabase: ReturnType<typeof createMockSupabaseChain>
  let mockFetchDiscordToken: ReturnType<typeof vi.fn>
  let mockFetchDiscordUser: ReturnType<typeof vi.fn>
  let handler: (req: Request) => Promise<Response>

  beforeEach(() => {
    vi.restoreAllMocks()
    mockAuth = createMockAuthClient(MOCK_USER)
    mockSupabase = createMockSupabaseChain()
    mockFetchDiscordToken = vi.fn()
    mockFetchDiscordUser = vi.fn()
    handler = buildHandler({
      authClient: mockAuth,
      supabaseAdmin: mockSupabase,
      discordClientId: ENV.DISCORD_CLIENT_ID,
      discordClientSecret: ENV.DISCORD_CLIENT_SECRET,
      fetchDiscordToken: mockFetchDiscordToken,
      fetchDiscordUser: mockFetchDiscordUser,
    })
  })

  // ------- CORS & preflight -------

  describe('CORS & preflight', () => {
    it('responds to OPTIONS with CORS headers for allowed origin', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'OPTIONS',
        headers: { origin: 'https://squadplanner.fr' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://squadplanner.fr')
    })

    it('responds to HEAD with 200 (health check)', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'HEAD',
        headers: { origin: 'https://squadplanner.app' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
    })

    it('does not include Access-Control-Allow-Origin for unknown origins', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.com' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('allows localhost:5173', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:5173' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
    })

    it('allows localhost:5174', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:5174' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5174')
    })

    it('allows Vercel preview deployments', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'OPTIONS',
        headers: { origin: 'https://squadplanner-abc123.vercel.app' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://squadplanner-abc123.vercel.app'
      )
    })

    it('rejects non-matching Vercel preview deployments', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'OPTIONS',
        headers: { origin: 'https://malicious.vercel.app' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('returns 405 for non-POST methods', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'GET',
        headers: { origin: 'https://squadplanner.fr' },
      })
      const res = await handler(req)
      expect(res.status).toBe(405)
      const json = await res.json()
      expect(json.error).toMatch(/Method not allowed/)
    })
  })

  // ------- Authentication -------

  describe('authentication', () => {
    it('returns 401 when JWT is missing / getUser fails', async () => {
      mockAuth = createMockAuthClient(null, { message: 'invalid token' })
      handler = buildHandler({
        authClient: mockAuth,
        supabaseAdmin: mockSupabase,
        discordClientId: ENV.DISCORD_CLIENT_ID,
        discordClientSecret: ENV.DISCORD_CLIENT_SECRET,
        fetchDiscordToken: mockFetchDiscordToken,
        fetchDiscordUser: mockFetchDiscordUser,
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ code: 'abc', redirect_uri: 'https://test.com' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Non autorise')
    })

    it('returns 401 when user is null (no auth error but no user)', async () => {
      mockAuth = createMockAuthClient(null)
      handler = buildHandler({
        authClient: mockAuth,
        supabaseAdmin: mockSupabase,
        discordClientId: ENV.DISCORD_CLIENT_ID,
        discordClientSecret: ENV.DISCORD_CLIENT_SECRET,
        fetchDiscordToken: mockFetchDiscordToken,
        fetchDiscordUser: mockFetchDiscordUser,
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ code: 'abc', redirect_uri: 'https://test.com' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(401)
    })
  })

  // ------- Input validation -------

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('JSON invalide')
    })

    it('returns 400 when code is missing', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ redirect_uri: 'https://test.com' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Code OAuth manquant')
    })

    it('returns 400 when redirect_uri is missing', async () => {
      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ code: 'abc123' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('redirect_uri manquant')
    })
  })

  // ------- Unlink flow -------

  describe('unlink flow', () => {
    it('removes Discord info and returns success', async () => {
      // Override chain: update().eq() should resolve with no error
      const unlinkSupabase = createMockSupabaseChain()
      unlinkSupabase.updateChain.eq.mockResolvedValue({ error: null })

      handler = buildHandler({
        authClient: mockAuth,
        supabaseAdmin: unlinkSupabase,
        discordClientId: ENV.DISCORD_CLIENT_ID,
        discordClientSecret: ENV.DISCORD_CLIENT_SECRET,
        fetchDiscordToken: mockFetchDiscordToken,
        fetchDiscordUser: mockFetchDiscordUser,
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ action: 'unlink', code: '', redirect_uri: '' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.action).toBe('unlinked')
    })

    it('returns 500 when unlink fails', async () => {
      const unlinkSupabase = createMockSupabaseChain({
        updateError: { message: 'DB error' },
      })
      // Make .eq() resolve with the error
      unlinkSupabase.updateChain.eq.mockResolvedValue({ error: { message: 'DB error' } })

      handler = buildHandler({
        authClient: mockAuth,
        supabaseAdmin: unlinkSupabase,
        discordClientId: ENV.DISCORD_CLIENT_ID,
        discordClientSecret: ENV.DISCORD_CLIENT_SECRET,
        fetchDiscordToken: mockFetchDiscordToken,
        fetchDiscordUser: mockFetchDiscordUser,
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ action: 'unlink', code: '', redirect_uri: '' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toMatch(/dissociation/)
    })
  })

  // ------- Link flow -------

  describe('link flow', () => {
    const DISCORD_USER = {
      id: '123456789',
      username: 'GamerTag',
      global_name: 'CoolGamer',
    }

    function setupSuccessfulTokenExchange() {
      mockFetchDiscordToken.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ access_token: 'discord-token-abc' }),
        text: vi.fn().mockResolvedValue(''),
      })
      mockFetchDiscordUser.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(DISCORD_USER),
      })
    }

    it('links Discord account successfully with valid code exchange', async () => {
      setupSuccessfulTokenExchange()

      // No existing profile with this Discord ID
      mockSupabase.selectChain.single.mockResolvedValue({ data: null, error: null })
      // Update succeeds
      mockSupabase.updateChain.eq.mockResolvedValue({ error: null })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ code: 'valid-code', redirect_uri: 'https://squadplanner.fr/callback' }),
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://squadplanner.fr',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.discord_username).toBe('CoolGamer')
      expect(json.discord_user_id).toBe('123456789')
    })

    it('uses username when global_name is not present', async () => {
      mockFetchDiscordToken.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ access_token: 'discord-token-abc' }),
        text: vi.fn().mockResolvedValue(''),
      })
      mockFetchDiscordUser.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: '123456789',
          username: 'GamerTag',
          // no global_name
        }),
      })

      mockSupabase.selectChain.single.mockResolvedValue({ data: null, error: null })
      mockSupabase.updateChain.eq.mockResolvedValue({ error: null })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({ code: 'valid-code', redirect_uri: 'https://squadplanner.fr/callback' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.discord_username).toBe('GamerTag')
    })

    it('returns 400 when Discord token exchange fails with invalid_grant', async () => {
      mockFetchDiscordToken.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ error: 'invalid_grant' })),
        json: vi.fn(),
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'expired-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Code OAuth invalide/)
      expect(json.error).toContain('redirect_uri')
    })

    it('returns 400 when Discord token exchange fails with invalid_client', async () => {
      mockFetchDiscordToken.mockResolvedValue({
        ok: false,
        status: 401,
        text: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ error: 'invalid_client' })),
        json: vi.fn(),
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'some-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Client Discord invalide/)
    })

    it('returns 400 with error_description from Discord', async () => {
      mockFetchDiscordToken.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi
          .fn()
          .mockResolvedValue(
            JSON.stringify({ error: 'access_denied', error_description: 'User denied access' })
          ),
        json: vi.fn(),
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'denied-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Discord: User denied access')
    })

    it('returns 400 with generic error when Discord response is not JSON', async () => {
      mockFetchDiscordToken.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
        json: vi.fn(),
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'some-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Code OAuth invalide ou expire')
    })

    it('returns 500 when Discord user info fetch fails', async () => {
      mockFetchDiscordToken.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ access_token: 'discord-token-abc' }),
        text: vi.fn().mockResolvedValue(''),
      })
      mockFetchDiscordUser.mockResolvedValue({
        ok: false,
        json: vi.fn(),
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'valid-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toMatch(/Impossible de recuperer les infos Discord/)
    })

    it('returns 409 when Discord account is already linked to different user', async () => {
      setupSuccessfulTokenExchange()

      // Existing profile with different user_id
      mockSupabase.selectChain.single.mockResolvedValue({
        data: {
          id: '999e8400-e29b-41d4-a716-446655440099',
          username: 'AnotherPlayer',
        },
        error: null,
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'valid-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.error).toMatch(/deja lie/)
      expect(json.error).toContain('AnotherPlayer')
    })

    it('allows linking when Discord account is already linked to same user (re-link)', async () => {
      setupSuccessfulTokenExchange()

      // Same user already linked
      mockSupabase.selectChain.single.mockResolvedValue({
        data: {
          id: MOCK_USER.id,
          username: 'TestUser',
        },
        error: null,
      })
      mockSupabase.updateChain.eq.mockResolvedValue({ error: null })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'valid-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 when profile update fails', async () => {
      setupSuccessfulTokenExchange()

      // No existing profile
      mockSupabase.selectChain.single.mockResolvedValue({ data: null, error: null })
      // Update fails
      mockSupabase.updateChain.eq.mockResolvedValue({ error: { message: 'DB error' } })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'valid-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toMatch(/mise a jour du profil/)
    })

    it('returns 500 when Discord credentials are not configured', async () => {
      handler = buildHandler({
        authClient: mockAuth,
        supabaseAdmin: mockSupabase,
        discordClientId: '',
        discordClientSecret: '',
        fetchDiscordToken: mockFetchDiscordToken,
        fetchDiscordUser: mockFetchDiscordUser,
      })

      const req = new Request('https://edge.fn/discord-oauth', {
        method: 'POST',
        body: JSON.stringify({
          code: 'valid-code',
          redirect_uri: 'https://squadplanner.fr/callback',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toMatch(/Configuration Discord manquante/)
    })
  })

  // ------- Helper unit tests -------

  describe('isAllowedOrigin', () => {
    it.each([
      ['http://localhost:5173', true],
      ['http://localhost:5174', true],
      ['https://squadplanner.fr', true],
      ['https://www.squadplanner.fr', true],
      ['https://squadplanner.app', true],
      ['https://www.squadplanner.app', true],
      ['https://squadplanner-abc123.vercel.app', true],
      ['https://squadplannerpreview.vercel.app', true],
      ['https://evil.com', false],
      ['https://malicious.vercel.app', false],
      ['https://notsquadplanner.vercel.app', false],
    ])('isAllowedOrigin(%s) = %s', (origin, expected) => {
      expect(isAllowedOrigin(origin)).toBe(expected)
    })
  })

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
  })
})
