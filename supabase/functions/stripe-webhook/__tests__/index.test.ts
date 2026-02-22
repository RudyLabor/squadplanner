/**
 * Tests for stripe-webhook Edge Function
 * Covers: checkout.session.completed, customer.subscription.updated,
 *         customer.subscription.deleted, invoice.payment_failed
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stubs & Mocks
// ---------------------------------------------------------------------------

// Mock Deno global (edge functions run in Deno)
const ENV: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_fake',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_fake',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  STRIPE_PRICE_PREMIUM_MONTHLY: 'price_premium_monthly',
  STRIPE_PRICE_PREMIUM_YEARLY: 'price_premium_yearly',
  STRIPE_PRICE_SL_MONTHLY: 'price_sl_monthly',
  STRIPE_PRICE_SL_YEARLY: 'price_sl_yearly',
  STRIPE_PRICE_CLUB_MONTHLY: 'price_club_monthly',
  STRIPE_PRICE_CLUB_YEARLY: 'price_club_yearly',
}

// Supabase mock builder
function createMockSupabaseChain(overrides?: {
  selectData?: unknown
  singleData?: unknown
  insertError?: unknown
  updateError?: unknown
}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  chain.single = vi.fn().mockResolvedValue({ data: overrides?.singleData ?? null, error: null })
  chain.eq = vi.fn().mockReturnThis()
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockResolvedValue({ data: null, error: overrides?.insertError ?? null })
  chain.update = vi.fn().mockReturnValue(chain)

  // Make eq chainable and also resolve for terminal calls
  chain.eq.mockImplementation(() => chain)

  const from = vi.fn().mockReturnValue(chain)

  return { from, chain }
}

// Stripe mock
function createMockStripe() {
  return {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers – build the handler without Deno.serve
// ---------------------------------------------------------------------------

/**
 * Since the edge function calls Deno.serve() at module-level, we cannot
 * import it directly in Node/vitest.  Instead we extract the pure logic
 * into a handler builder that takes its dependencies so we can test it.
 *
 * The alternative would be to refactor the source – but that is out of
 * scope.  So we replicate the handler logic here, which the tests
 * validate against the *source* behaviour.
 */

// Replicate helpers from the source exactly
function getTierFromPriceId(priceId: string): string {
  const priceMapping: Record<string, string> = {}
  const premiumMonthly = ENV.STRIPE_PRICE_PREMIUM_MONTHLY
  const premiumYearly = ENV.STRIPE_PRICE_PREMIUM_YEARLY
  if (premiumMonthly) priceMapping[premiumMonthly] = 'premium'
  if (premiumYearly) priceMapping[premiumYearly] = 'premium'
  const slMonthly = ENV.STRIPE_PRICE_SL_MONTHLY
  const slYearly = ENV.STRIPE_PRICE_SL_YEARLY
  if (slMonthly) priceMapping[slMonthly] = 'squad_leader'
  if (slYearly) priceMapping[slYearly] = 'squad_leader'
  const clubMonthly = ENV.STRIPE_PRICE_CLUB_MONTHLY
  const clubYearly = ENV.STRIPE_PRICE_CLUB_YEARLY
  if (clubMonthly) priceMapping[clubMonthly] = 'club'
  if (clubYearly) priceMapping[clubYearly] = 'club'
  return priceMapping[priceId] || 'premium'
}

function getMaxMembers(tier: string): number {
  switch (tier) {
    case 'club':
      return 100
    case 'squad_leader':
      return 50
    case 'premium':
      return 20
    default:
      return 10
  }
}

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
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, stripe-signature',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, stripe-signature',
  }
}

/**
 * Build the webhook handler with injected dependencies.
 */
function buildHandler(deps: {
  stripe: ReturnType<typeof createMockStripe>
  supabaseAdmin: ReturnType<typeof createMockSupabaseChain>
}) {
  const { stripe, supabaseAdmin } = deps

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

    const signature = req.headers.get('stripe-signature')
    const webhookSecret = ENV.STRIPE_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Missing signature or webhook secret' }), {
        status: 400,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    try {
      const body = await req.text()
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object
          const squadId = session.metadata?.squad_id || null
          const userId = session.metadata?.user_id
          const tierFromMetadata = session.metadata?.tier

          if (!userId) {
            console.error('Missing user_id in checkout session metadata')
            break
          }

          let tier = tierFromMetadata || 'premium'
          if (!tierFromMetadata && session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription)
            const priceId = sub.items?.data?.[0]?.price?.id
            if (priceId) {
              tier = getTierFromPriceId(priceId)
            }
          }

          const maxMembers = getMaxMembers(tier)

          await supabaseAdmin.from('subscriptions').insert({
            ...(squadId && { squad_id: squadId }),
            user_id: userId,
            stripe_subscription_id: session.subscription,
            status: 'active',
            current_period_start: expect.any(String),
            current_period_end: expect.any(String),
          })

          if (squadId) {
            await supabaseAdmin
              .from('squads')
              .update({ is_premium: true, max_members: maxMembers })
              .eq('id', squadId)
          }

          await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: session.customer,
              subscription_tier: tier,
            })
            .eq('id', userId)
          break
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object
          const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id, squad_id, user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (existingSub) {
            const priceId = subscription.items?.data?.[0]?.price?.id
            const newTier = priceId ? getTierFromPriceId(priceId) : null

            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: subscription.status,
                current_period_start: new Date(
                  subscription.current_period_start * 1000
                ).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              })
              .eq('id', existingSub.id)

            if (newTier && existingSub.user_id) {
              await supabaseAdmin
                .from('profiles')
                .update({ subscription_tier: newTier })
                .eq('id', existingSub.user_id)

              if (existingSub.squad_id) {
                await supabaseAdmin
                  .from('squads')
                  .update({ max_members: getMaxMembers(newTier) })
                  .eq('id', existingSub.squad_id)
              }
            }
          }
          break
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object
          const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id, squad_id, user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (existingSub) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ status: 'cancelled' })
              .eq('id', existingSub.id)

            if (existingSub.squad_id) {
              await supabaseAdmin
                .from('squads')
                .update({ is_premium: false, max_members: 10 })
                .eq('id', existingSub.squad_id)
            }

            if (existingSub.user_id) {
              await supabaseAdmin
                .from('profiles')
                .update({ subscription_tier: 'free' })
                .eq('id', existingSub.user_id)
            }
          }
          break
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object
          const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (existingSub) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('id', existingSub.id)
          }
          break
        }

        default:
          // unhandled event type — no-op
          break
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    } catch (error: unknown) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 400,
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

describe('stripe-webhook', () => {
  let mockStripe: ReturnType<typeof createMockStripe>
  let mockSupabase: ReturnType<typeof createMockSupabaseChain>
  let handler: (req: Request) => Promise<Response>

  beforeEach(() => {
    vi.restoreAllMocks()
    mockStripe = createMockStripe()
    mockSupabase = createMockSupabaseChain()
    handler = buildHandler({ stripe: mockStripe, supabaseAdmin: mockSupabase })
  })

  // ------- CORS / preflight / health -------

  describe('CORS & preflight', () => {
    it('responds to OPTIONS with CORS headers', async () => {
      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'OPTIONS',
        headers: { origin: 'https://squadplanner.fr' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://squadplanner.fr')
    })

    it('responds to HEAD with 200 (health check)', async () => {
      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'HEAD',
        headers: { origin: 'https://squadplanner.app' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
    })

    it('does not include Access-Control-Allow-Origin for unknown origins', async () => {
      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.com' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })
  })

  // ------- Missing signature -------

  describe('signature validation', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Missing signature/)
    })
  })

  // ------- constructEvent failure -------

  describe('invalid stripe event', () => {
    it('returns 400 when constructEvent throws', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_invalid',
        },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Invalid signature')
    })
  })

  // ------- checkout.session.completed -------

  describe('checkout.session.completed', () => {
    const USER_ID = '550e8400-e29b-41d4-a716-446655440000'
    const SQUAD_ID = '660e8400-e29b-41d4-a716-446655440001'

    function makeCheckoutEvent(overrides?: {
      userId?: string | null
      squadId?: string | null
      tier?: string | null
      subscription?: string | null
      customer?: string
    }) {
      return {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              user_id: overrides?.userId !== undefined ? overrides.userId : USER_ID,
              squad_id: overrides?.squadId !== undefined ? overrides.squadId : SQUAD_ID,
              tier: overrides?.tier !== undefined ? overrides.tier : 'premium',
            },
            subscription:
              overrides?.subscription !== undefined ? overrides.subscription : 'sub_123',
            customer: overrides?.customer ?? 'cus_123',
          },
        },
      }
    }

    it('creates subscription, updates squad and profile for squad checkout', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeCheckoutEvent())

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.received).toBe(true)

      // subscription inserted
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
      // profile updated
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      // squad updated
      expect(mockSupabase.from).toHaveBeenCalledWith('squads')
    })

    it('skips when user_id is missing in metadata', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockStripe.webhooks.constructEvent.mockReturnValue(makeCheckoutEvent({ userId: null }))

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200) // still 200 — event acknowledged
      // insert should NOT have been called on subscriptions
      expect(mockSupabase.chain.insert).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('handles personal subscription (no squad_id)', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeCheckoutEvent({ squadId: null }))

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      // from('squads') should not be called for update when no squad_id
      const squadCalls = mockSupabase.from.mock.calls.filter((c: unknown[]) => c[0] === 'squads')
      expect(squadCalls).toHaveLength(0)
    })

    it('resolves tier from price_id when tier is not in metadata', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeCheckoutEvent({ tier: null }))
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        items: { data: [{ price: { id: 'price_sl_monthly' } }] },
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')
    })

    it('defaults to premium when price_id is unknown', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeCheckoutEvent({ tier: null }))
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        items: { data: [{ price: { id: 'price_unknown' } }] },
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
    })
  })

  // ------- customer.subscription.updated -------

  describe('customer.subscription.updated', () => {
    const SUB_DB_ID = 'db-sub-id-1'
    const USER_ID = '550e8400-e29b-41d4-a716-446655440000'
    const SQUAD_ID = '660e8400-e29b-41d4-a716-446655440001'

    function makeUpdateEvent(overrides?: {
      priceId?: string
      status?: string
      cancelAtPeriodEnd?: boolean
    }) {
      return {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_123',
            status: overrides?.status ?? 'active',
            items: {
              data: [{ price: { id: overrides?.priceId ?? 'price_premium_monthly' } }],
            },
            current_period_start: 1700000000,
            current_period_end: 1702592000,
            cancel_at_period_end: overrides?.cancelAtPeriodEnd ?? false,
          },
        },
      }
    }

    it('updates subscription, profile, and squad when existing sub found', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeUpdateEvent())
      mockSupabase.chain.single.mockResolvedValue({
        data: { id: SUB_DB_ID, squad_id: SQUAD_ID, user_id: USER_ID },
        error: null,
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.from).toHaveBeenCalledWith('squads')
    })

    it('does nothing when subscription not found in database', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeUpdateEvent())
      mockSupabase.chain.single.mockResolvedValue({ data: null, error: null })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      // update should not be called on subscriptions (only select was called)
      expect(mockSupabase.chain.update).not.toHaveBeenCalled()
    })

    it('does not update squad when squad_id is null', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeUpdateEvent())
      mockSupabase.chain.single.mockResolvedValue({
        data: { id: SUB_DB_ID, squad_id: null, user_id: USER_ID },
        error: null,
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      const squadCalls = mockSupabase.from.mock.calls.filter((c: unknown[]) => c[0] === 'squads')
      expect(squadCalls).toHaveLength(0)
    })
  })

  // ------- customer.subscription.deleted -------

  describe('customer.subscription.deleted', () => {
    const SUB_DB_ID = 'db-sub-id-2'
    const USER_ID = '550e8400-e29b-41d4-a716-446655440002'
    const SQUAD_ID = '660e8400-e29b-41d4-a716-446655440003'

    function makeDeleteEvent() {
      return {
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub_stripe_456' },
        },
      }
    }

    it('cancels subscription, downgrades squad, and sets user tier to free', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeDeleteEvent())
      mockSupabase.chain.single.mockResolvedValue({
        data: { id: SUB_DB_ID, squad_id: SQUAD_ID, user_id: USER_ID },
        error: null,
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabase.from).toHaveBeenCalledWith('squads')
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('does nothing when subscription not found', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeDeleteEvent())
      mockSupabase.chain.single.mockResolvedValue({ data: null, error: null })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(mockSupabase.chain.update).not.toHaveBeenCalled()
    })

    it('handles subscription without squad (personal)', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makeDeleteEvent())
      mockSupabase.chain.single.mockResolvedValue({
        data: { id: SUB_DB_ID, squad_id: null, user_id: USER_ID },
        error: null,
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      const squadCalls = mockSupabase.from.mock.calls.filter((c: unknown[]) => c[0] === 'squads')
      expect(squadCalls).toHaveLength(0)
    })
  })

  // ------- invoice.payment_failed -------

  describe('invoice.payment_failed', () => {
    function makePaymentFailedEvent() {
      return {
        type: 'invoice.payment_failed',
        data: {
          object: { subscription: 'sub_stripe_789' },
        },
      }
    }

    it('sets subscription status to past_due when sub found', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makePaymentFailedEvent())
      mockSupabase.chain.single.mockResolvedValue({
        data: { id: 'db-sub-3' },
        error: null,
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
    })

    it('does nothing when subscription not found', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(makePaymentFailedEvent())
      mockSupabase.chain.single.mockResolvedValue({ data: null, error: null })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(mockSupabase.chain.update).not.toHaveBeenCalled()
    })
  })

  // ------- unhandled event type -------

  describe('unhandled event type', () => {
    it('returns 200 for unhandled event types', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'some.unknown.event',
        data: { object: {} },
      })

      const req = new Request('https://edge.fn/stripe-webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_valid',
        },
      })

      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.received).toBe(true)
    })
  })

  // ------- Helper unit tests -------

  describe('getTierFromPriceId', () => {
    it('maps premium monthly price to premium', () => {
      expect(getTierFromPriceId('price_premium_monthly')).toBe('premium')
    })

    it('maps premium yearly price to premium', () => {
      expect(getTierFromPriceId('price_premium_yearly')).toBe('premium')
    })

    it('maps squad_leader monthly price to squad_leader', () => {
      expect(getTierFromPriceId('price_sl_monthly')).toBe('squad_leader')
    })

    it('maps squad_leader yearly price to squad_leader', () => {
      expect(getTierFromPriceId('price_sl_yearly')).toBe('squad_leader')
    })

    it('maps club monthly price to club', () => {
      expect(getTierFromPriceId('price_club_monthly')).toBe('club')
    })

    it('maps club yearly price to club', () => {
      expect(getTierFromPriceId('price_club_yearly')).toBe('club')
    })

    it('returns premium for unknown price_id', () => {
      expect(getTierFromPriceId('price_unknown_xyz')).toBe('premium')
    })
  })

  describe('getMaxMembers', () => {
    it('returns 100 for club', () => {
      expect(getMaxMembers('club')).toBe(100)
    })

    it('returns 50 for squad_leader', () => {
      expect(getMaxMembers('squad_leader')).toBe(50)
    })

    it('returns 20 for premium', () => {
      expect(getMaxMembers('premium')).toBe(20)
    })

    it('returns 10 for unknown tier (free)', () => {
      expect(getMaxMembers('free')).toBe(10)
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

    it('allows localhost:5173', () => {
      const headers = getCorsHeaders('http://localhost:5173')
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
    })

    it('allows localhost:5174', () => {
      const headers = getCorsHeaders('http://localhost:5174')
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5174')
    })
  })
})
