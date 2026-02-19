/**
 * Tests for create-checkout Edge Function
 * Covers: auth, validation, squad ownership, Stripe customer creation,
 *         checkout session creation, CORS, error handling.
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
  squadData?: { id: string; name: string; owner_id: string } | null
  profileData?: { stripe_customer_id: string | null; email: string; username: string } | null
}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.single = vi.fn()
  chain.eq = vi.fn().mockReturnThis()
  chain.select = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)

  // Stateful resolution: tracks what table from() was called with
  let currentTable = ''

  const from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    chain.single.mockImplementation(() => {
      if (currentTable === 'squads') {
        return Promise.resolve({ data: options?.squadData ?? null, error: null })
      }
      if (currentTable === 'profiles') {
        return Promise.resolve({ data: options?.profileData ?? null, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
    return chain
  })

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
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_new_123' }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/session_abc',
          id: 'cs_test_abc',
        }),
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Handler builder
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

      // Get user from auth
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

      // Validate
      const squadId =
        rawBody.squad_id && rawBody.squad_id !== ''
          ? String(rawBody.squad_id)
          : undefined
      const priceId = rawBody.price_id
      const tier =
        rawBody.tier && typeof rawBody.tier === 'string' ? rawBody.tier : undefined
      const successUrl =
        rawBody.success_url && typeof rawBody.success_url === 'string'
          ? rawBody.success_url
          : undefined
      const cancelUrl =
        rawBody.cancel_url && typeof rawBody.cancel_url === 'string'
          ? rawBody.cancel_url
          : undefined

      if (!priceId || typeof priceId !== 'string') {
        return new Response(JSON.stringify({ error: 'price_id must be a string' }), {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        })
      }

      // If squad_id provided, verify ownership
      if (squadId) {
        const { data: squad } = await supabaseClient
          .from('squads')
          .select('id, name, owner_id')
          .eq('id', squadId)
          .single()

        if (!squad || squad.owner_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Only squad owner can purchase premium' }),
            {
              status: 403,
              headers: {
                ...getCorsHeaders(req.headers.get('origin')),
                'Content-Type': 'application/json',
              },
            }
          )
        }
      }

      // Get or create Stripe customer
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('stripe_customer_id, email, username')
        .eq('id', user.id)
        .single()

      let customerId = profile?.stripe_customer_id

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || profile?.email,
          name: profile?.username,
          metadata: { user_id: user.id },
        })
        customerId = customer.id

        await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }

      // Create checkout session
      const defaultSuccessUrl = squadId
        ? `${req.headers.get('origin')}/squad/${squadId}?checkout=success`
        : `${req.headers.get('origin')}/profile?checkout=success`
      const defaultCancelUrl = squadId
        ? `${req.headers.get('origin')}/squad/${squadId}?checkout=cancelled`
        : `${req.headers.get('origin')}/profile?checkout=cancelled`

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          ...(squadId && { squad_id: squadId }),
          user_id: user.id,
          ...(tier && { tier }),
        },
        subscription_data: {
          metadata: {
            ...(squadId && { squad_id: squadId }),
            user_id: user.id,
            ...(tier && { tier }),
          },
        },
        success_url: successUrl || defaultSuccessUrl,
        cancel_url: cancelUrl || defaultCancelUrl,
        allow_promotion_codes: true,
      })

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
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

describe('create-checkout', () => {
  const USER: MockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
  }
  const SQUAD_ID = '660e8400-e29b-41d4-a716-446655440001'

  let mockStripe: ReturnType<typeof createMockStripe>
  let mockSupa: ReturnType<typeof createMockSupabaseClient>
  let handler: (req: Request) => Promise<Response>

  function setup(overrides?: Parameters<typeof createMockSupabaseClient>[0]) {
    mockStripe = createMockStripe()
    mockSupa = createMockSupabaseClient({
      user: USER,
      squadData: { id: SQUAD_ID, name: 'Test Squad', owner_id: USER.id },
      profileData: { stripe_customer_id: 'cus_existing', email: USER.email, username: 'testuser' },
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
    it('responds to OPTIONS', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'OPTIONS',
          headers: { origin: 'https://squadplanner.fr' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://squadplanner.fr')
    })

    it('responds to HEAD for health check', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', { method: 'HEAD' })
      )
      expect(res.status).toBe(200)
    })
  })

  // ------- Auth -------

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      setup({ user: null })
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 401 when auth returns an error', async () => {
      setup({ authError: new Error('Token expired') })
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
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
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: 'not-json',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Invalid JSON|price_id/)
    })

    it('returns 400 when price_id is missing', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/price_id/)
    })

    it('returns 400 when price_id is not a string', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 123 }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
    })
  })

  // ------- Squad ownership -------

  describe('squad ownership check', () => {
    it('returns 403 when user is not squad owner', async () => {
      setup({
        user: USER,
        squadData: { id: SQUAD_ID, name: 'Other Squad', owner_id: 'other-user-id' },
        profileData: { stripe_customer_id: 'cus_existing', email: USER.email, username: 'testuser' },
      })

      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123', squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toMatch(/Only squad owner/)
    })

    it('returns 403 when squad does not exist', async () => {
      setup({
        user: USER,
        squadData: null,
        profileData: { stripe_customer_id: 'cus_existing', email: USER.email, username: 'testuser' },
      })

      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123', squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(403)
    })

    it('skips ownership check when squad_id is not provided', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)
    })
  })

  // ------- Stripe customer creation -------

  describe('Stripe customer management', () => {
    it('creates a new Stripe customer when none exists', async () => {
      setup({
        user: USER,
        profileData: { stripe_customer_id: null, email: USER.email, username: 'testuser' },
      })

      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)
      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: USER.email,
          metadata: { user_id: USER.id },
        })
      )
    })

    it('uses existing Stripe customer when available', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)
      expect(mockStripe.customers.create).not.toHaveBeenCalled()
    })
  })

  // ------- Checkout session creation -------

  describe('checkout session', () => {
    it('creates checkout session with correct parameters for squad', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({
            price_id: 'price_premium_monthly',
            squad_id: SQUAD_ID,
            tier: 'premium',
          }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      expect(createCall.customer).toBe('cus_existing')
      expect(createCall.mode).toBe('subscription')
      expect(createCall.line_items[0].price).toBe('price_premium_monthly')
      expect(createCall.metadata.squad_id).toBe(SQUAD_ID)
      expect(createCall.metadata.user_id).toBe(USER.id)
      expect(createCall.metadata.tier).toBe('premium')
      expect(createCall.allow_promotion_codes).toBe(true)
    })

    it('creates personal checkout session without squad metadata', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_premium_monthly' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      expect(createCall.metadata.squad_id).toBeUndefined()
      expect(createCall.success_url).toContain('/profile?checkout=success')
      expect(createCall.cancel_url).toContain('/profile?checkout=cancelled')
    })

    it('uses custom success_url and cancel_url when provided', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({
            price_id: 'price_123',
            success_url: 'https://custom.com/success',
            cancel_url: 'https://custom.com/cancel',
          }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      expect(createCall.success_url).toBe('https://custom.com/success')
      expect(createCall.cancel_url).toBe('https://custom.com/cancel')
    })

    it('returns session url and session_id', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      const json = await res.json()
      expect(json.url).toBe('https://checkout.stripe.com/session_abc')
      expect(json.session_id).toBe('cs_test_abc')
    })
  })

  // ------- Error handling -------

  describe('error handling', () => {
    it('returns 500 when Stripe API throws', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      )

      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Stripe API error')
    })

    it('returns 500 when Stripe customer creation fails', async () => {
      setup({
        user: USER,
        profileData: { stripe_customer_id: null, email: USER.email, username: 'testuser' },
      })
      mockStripe.customers.create.mockRejectedValue(new Error('Customer creation failed'))

      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Customer creation failed')
    })
  })

  // ------- Default URL generation -------

  describe('default URL generation', () => {
    it('generates squad success/cancel URLs when squad_id is provided', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123', squad_id: SQUAD_ID }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      expect(createCall.success_url).toBe(
        `https://squadplanner.fr/squad/${SQUAD_ID}?checkout=success`
      )
      expect(createCall.cancel_url).toBe(
        `https://squadplanner.fr/squad/${SQUAD_ID}?checkout=cancelled`
      )
    })

    it('generates profile success/cancel URLs when no squad_id', async () => {
      const res = await handler(
        new Request('https://edge.fn/create-checkout', {
          method: 'POST',
          body: JSON.stringify({ price_id: 'price_123' }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.app',
          },
        })
      )
      expect(res.status).toBe(200)

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      expect(createCall.success_url).toBe('https://squadplanner.app/profile?checkout=success')
      expect(createCall.cancel_url).toBe('https://squadplanner.app/profile?checkout=cancelled')
    })
  })
})
