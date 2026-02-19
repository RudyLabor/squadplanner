/**
 * Tests for create-portal Edge Function
 * Covers: auth, validation, customer lookup, portal session creation,
 *         CORS, error handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
const ENV: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_fake',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
}

// ---------------------------------------------------------------------------
// CORS helpers (replicated from source)
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  ENV.SUPABASE_URL,
].filter(Boolean)

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

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

interface MockUser {
  id: string
  email: string
}

function createMockSupabaseClient(options?: {
  user?: MockUser | null
  authError?: Error | null
  profileData?: { stripe_customer_id: string | null } | null
}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.single = vi.fn()
  chain.eq = vi.fn().mockReturnThis()
  chain.select = vi.fn().mockReturnValue(chain)

  chain.single.mockImplementation(() =>
    Promise.resolve({ data: options?.profileData ?? null, error: null })
  )

  const from = vi.fn().mockReturnValue(chain)

  return {
    from,
    chain,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options?.user ?? null },
        error: options?.authError ?? null,
      }),
    },
  }
}

function createMockStripe() {
  return {
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/portal_session_xyz',
        }),
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Handler builder (mirrors source logic)
// ---------------------------------------------------------------------------

function buildHandler(deps: {
  stripe: ReturnType<typeof createMockStripe>
  createSupabaseClient: () => ReturnType<typeof createMockSupabaseClient>
}) {
  const { stripe, createSupabaseClient } = deps

  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
    }
    if (req.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: getCorsHeaders(req.headers.get('origin')),
      })
    }

    try {
      const supabaseClient = createSupabaseClient()

      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser()
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        })
      }

      // Parse body
      let rawBody: Record<string, unknown>
      try {
        rawBody = await req.json()
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        })
      }

      // Validate optional fields
      const customerId =
        rawBody.customer_id && typeof rawBody.customer_id === 'string'
          ? rawBody.customer_id
          : undefined
      const returnUrl =
        rawBody.return_url && typeof rawBody.return_url === 'string'
          ? rawBody.return_url
          : undefined

      // Resolve Stripe customer ID
      let stripeCustomerId = customerId

      if (!stripeCustomerId) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single()

        stripeCustomerId = profile?.stripe_customer_id
      }

      if (!stripeCustomerId) {
        return new Response(
          JSON.stringify({ error: 'No Stripe customer found for this user' }),
          {
            status: 404,
            headers: {
              ...getCorsHeaders(req.headers.get('origin')),
              'Content-Type': 'application/json',
            },
          }
        )
      }

      // Create billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl || `${req.headers.get('origin')}/profile`,
      })

      return new Response(JSON.stringify({ url: session.url }), {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    } catch (error: unknown) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('create-portal', () => {
  const USER: MockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
  }

  let mockStripe: ReturnType<typeof createMockStripe>
  let mockSupa: ReturnType<typeof createMockSupabaseClient>
  let handler: (req: Request) => Promise<Response>

  function setup(overrides?: Parameters<typeof createMockSupabaseClient>[0]) {
    mockStripe = createMockStripe()
    mockSupa = createMockSupabaseClient({
      user: USER,
      profileData: { stripe_customer_id: 'cus_existing_456' },
      ...overrides,
    })
    handler = buildHandler({
      stripe: mockStripe,
      createSupabaseClient: () => mockSupa,
    })
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    setup()
  })

  // ------- CORS -------

  describe('CORS & preflight', () => {
    it('responds to OPTIONS with CORS headers', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'OPTIONS',
          headers: { origin: 'https://squadplanner.app' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://squadplanner.app')
    })

    it('responds to HEAD with 200', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', { method: 'HEAD' })
      )
      expect(res.status).toBe(200)
    })

    it('does not set Access-Control-Allow-Origin for disallowed origin', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'OPTIONS',
          headers: { origin: 'https://evil.com' },
        })
      )
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })
  })

  // ------- Auth -------

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      setup({ user: null })
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 401 when auth returns an error', async () => {
      setup({ authError: new Error('Token expired') })
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(401)
    })
  })

  // ------- Validation -------

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: 'not-json!!!',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Invalid JSON/)
    })
  })

  // ------- Customer lookup -------

  describe('customer lookup', () => {
    it('uses customer_id from request body when provided', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({ customer_id: 'cus_from_body' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.billingPortal.sessions.create.mock.calls[0][0]
      expect(createCall.customer).toBe('cus_from_body')
    })

    it('fetches customer_id from profile when not provided in body', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.billingPortal.sessions.create.mock.calls[0][0]
      expect(createCall.customer).toBe('cus_existing_456')
      // Verify profile query was made
      expect(mockSupa.from).toHaveBeenCalledWith('profiles')
    })

    it('returns 404 when no Stripe customer found (not in body, not in profile)', async () => {
      setup({
        user: USER,
        profileData: { stripe_customer_id: null },
      })

      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toMatch(/No Stripe customer/)
    })

    it('returns 404 when profile has no stripe_customer_id and body has no customer_id', async () => {
      setup({
        user: USER,
        profileData: null, // profile not found
      })

      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(404)
    })
  })

  // ------- Portal session creation -------

  describe('portal session creation', () => {
    it('creates portal session with default return_url', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.billingPortal.sessions.create.mock.calls[0][0]
      expect(createCall.return_url).toBe('https://squadplanner.fr/profile')
    })

    it('uses custom return_url when provided', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({ return_url: 'https://custom.com/settings' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.billingPortal.sessions.create.mock.calls[0][0]
      expect(createCall.return_url).toBe('https://custom.com/settings')
    })

    it('returns the portal session URL', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      const json = await res.json()
      expect(json.url).toBe('https://billing.stripe.com/portal_session_xyz')
    })

    it('passes the correct customer to Stripe', async () => {
      await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing_456',
        })
      )
    })
  })

  // ------- Error handling -------

  describe('error handling', () => {
    it('returns 500 when Stripe API throws', async () => {
      mockStripe.billingPortal.sessions.create.mockRejectedValue(
        new Error('Portal creation failed')
      )

      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Portal creation failed')
    })

    it('returns 500 when Supabase query throws unexpectedly', async () => {
      setup({ user: USER, profileData: { stripe_customer_id: 'cus_123' } })
      // Override from to throw
      mockSupa.from.mockImplementation(() => {
        throw new Error('Database connection lost')
      })

      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Database connection lost')
    })
  })

  // ------- Edge cases -------

  describe('edge cases', () => {
    it('ignores non-string customer_id in body', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({ customer_id: 12345 }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)
      // Should fall back to profile lookup
      expect(mockSupa.from).toHaveBeenCalledWith('profiles')
    })

    it('ignores non-string return_url in body', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({ return_url: 999 }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)
      // Should use default return_url
      const createCall = mockStripe.billingPortal.sessions.create.mock.calls[0][0]
      expect(createCall.return_url).toBe('https://squadplanner.fr/profile')
    })

    it('handles empty body (no customer_id, no return_url)', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-portal', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)
    })
  })
})
