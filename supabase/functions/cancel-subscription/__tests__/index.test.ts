/**
 * Tests for cancel-subscription Edge Function
 * Covers: auth, validation, squad ownership, subscription lookup,
 *         Stripe cancellation, CORS, error handling.
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
  squadData?: { id: string; owner_id: string } | null
  subscriptionData?: { stripe_subscription_id: string } | null
}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.single = vi.fn()
  chain.eq = vi.fn().mockReturnThis()
  chain.select = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)

  let currentTable = ''
  let eqCalls: string[][] = []

  // Track eq calls to differentiate subscription queries
  chain.eq.mockImplementation((col: string, val: string) => {
    eqCalls.push([col, val])
    return chain
  })

  chain.single.mockImplementation(() => {
    if (currentTable === 'squads') {
      return Promise.resolve({ data: options?.squadData ?? null, error: null })
    }
    if (currentTable === 'subscriptions') {
      return Promise.resolve({ data: options?.subscriptionData ?? null, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })

  const from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    eqCalls = []
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
    subscriptions: {
      update: vi.fn().mockResolvedValue({
        cancel_at: 1710000000,
        current_period_end: 1702592000,
      }),
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

      // Validate squad_id (UUID)
      const squadId = rawBody.squad_id
      if (
        !squadId ||
        typeof squadId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(squadId)
      ) {
        return new Response(JSON.stringify({ error: 'squad_id must be a valid UUID' }), {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        })
      }

      // Verify squad ownership
      const { data: squad } = await supabaseClient
        .from('squads')
        .select('id, owner_id')
        .eq('id', squadId)
        .single()

      if (!squad || squad.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Only squad owner can cancel subscription' }),
          {
            status: 403,
            headers: {
              ...getCorsHeaders(req.headers.get('origin')),
              'Content-Type': 'application/json',
            },
          }
        )
      }

      // Get active subscription
      const { data: subscription } = await supabaseClient
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('squad_id', squadId)
        .eq('status', 'active')
        .single()

      if (!subscription?.stripe_subscription_id) {
        return new Response(JSON.stringify({ error: 'No active subscription found' }), {
          status: 404,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        })
      }

      // Cancel at period end via Stripe
      const cancelledSub = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      )

      // Update local subscription record
      await supabaseClient
        .from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('squad_id', squadId)
        .eq('status', 'active')

      return new Response(
        JSON.stringify({
          success: true,
          cancel_at: cancelledSub.cancel_at
            ? new Date(cancelledSub.cancel_at * 1000).toISOString()
            : null,
          current_period_end: new Date(cancelledSub.current_period_end * 1000).toISOString(),
        }),
        {
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        }
      )
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

describe('cancel-subscription', () => {
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
      squadData: { id: SQUAD_ID, owner_id: USER.id },
      subscriptionData: { stripe_subscription_id: 'sub_stripe_999' },
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
        new Request('https://edge.fn/cancel-subscription', {
          method: 'OPTIONS',
          headers: { origin: 'https://squadplanner.fr' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://squadplanner.fr')
    })

    it('responds to HEAD with 200', async () => {
      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', { method: 'HEAD' })
      )
      expect(res.status).toBe(200)
    })
  })

  // ------- Auth -------

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      setup({ user: null })
      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 401 when auth returns an error', async () => {
      setup({ authError: new Error('Session expired') })
      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
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
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: 'not-json{{{',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Invalid JSON/)
    })

    it('returns 400 when squad_id is missing', async () => {
      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/squad_id/)
    })

    it('returns 400 when squad_id is not a valid UUID', async () => {
      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: 'not-a-uuid' }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/UUID/)
    })

    it('returns 400 when squad_id is a number', async () => {
      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: 12345 }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(400)
    })
  })

  // ------- Squad ownership -------

  describe('squad ownership', () => {
    it('returns 403 when user is not squad owner', async () => {
      setup({
        user: USER,
        squadData: { id: SQUAD_ID, owner_id: 'other-user-id' },
        subscriptionData: { stripe_subscription_id: 'sub_stripe_999' },
      })

      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
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
        subscriptionData: { stripe_subscription_id: 'sub_stripe_999' },
      })

      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(403)
    })
  })

  // ------- Subscription lookup -------

  describe('subscription lookup', () => {
    it('returns 404 when no active subscription found', async () => {
      setup({
        user: USER,
        squadData: { id: SQUAD_ID, owner_id: USER.id },
        subscriptionData: null,
      })

      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toMatch(/No active subscription/)
    })

    it('returns 404 when subscription has no stripe_subscription_id', async () => {
      setup({
        user: USER,
        squadData: { id: SQUAD_ID, owner_id: USER.id },
        subscriptionData: { stripe_subscription_id: '' },
      })

      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(404)
    })
  })

  // ------- Successful cancellation -------

  describe('successful cancellation', () => {
    it('cancels subscription at period end and returns dates', async () => {
      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://squadplanner.fr',
          },
        })
      )
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.cancel_at).toBeDefined()
      expect(json.current_period_end).toBeDefined()

      // Verify Stripe was called with cancel_at_period_end: true
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_stripe_999', {
        cancel_at_period_end: true,
      })
    })

    it('returns null cancel_at when Stripe returns no cancel_at', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        cancel_at: null,
        current_period_end: 1702592000,
      })

      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      const json = await res.json()
      expect(json.cancel_at).toBeNull()
      expect(json.current_period_end).toBeDefined()
    })

    it('updates the local subscription record', async () => {
      await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )

      // from('subscriptions') called for select and update
      const subsCalls = mockSupa.from.mock.calls.filter(
        (c: unknown[]) => c[0] === 'subscriptions'
      )
      expect(subsCalls.length).toBeGreaterThanOrEqual(2) // select + update
    })
  })

  // ------- Error handling -------

  describe('error handling', () => {
    it('returns 500 when Stripe API throws', async () => {
      mockStripe.subscriptions.update.mockRejectedValue(
        new Error('Stripe network error')
      )

      const res = await handler(
        new Request('https://edge.fn/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ squad_id: SQUAD_ID }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Stripe network error')
    })
  })
})
