import { describe, it, expect, vi, beforeEach } from 'vitest'

// Set env vars and declare mock fns BEFORE any module evaluation via vi.hoisted
const { mockCheckoutCreate, mockCustomerCreate } = vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
  process.env.STRIPE_PRICE_BOT_PREMIUM_MONTHLY = 'price_test'
  return {
    mockCheckoutCreate: vi.fn(),
    mockCustomerCreate: vi.fn(),
  }
})

// Mock supabase
vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

// Mock permissions
vi.mock('../lib/permissions.js', () => ({
  invalidatePremiumCache: vi.fn(),
}))

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: { create: mockCustomerCreate },
      checkout: { sessions: { create: mockCheckoutCreate } },
    })),
  }
})

import { createBotCheckoutSession, handleBotWebhookEvent } from '../lib/stripe.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { invalidatePremiumCache } from '../lib/permissions.js'
import type Stripe from 'stripe'

function mockSupabaseChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    in: vi.fn().mockReturnThis(),
  }
  vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)
  return chain
}

describe('createBotCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a Stripe customer when no existing customer ID', async () => {
    // First call: check existing → null
    const chain = mockSupabaseChain(null)
    mockCustomerCreate.mockResolvedValue({ id: 'cus_new' })
    mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })

    const url = await createBotCheckoutSession('guild-123', 'Test Server', 'user-456')

    expect(mockCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Discord: Test Server',
        metadata: expect.objectContaining({ discord_guild_id: 'guild-123' }),
      }),
    )
    expect(url).toBe('https://checkout.stripe.com/test')
  })

  it('reuses existing Stripe customer ID', async () => {
    mockSupabaseChain({ stripe_customer_id: 'cus_existing' })
    mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })

    await createBotCheckoutSession('guild-123', 'Test Server', null)

    expect(mockCustomerCreate).not.toHaveBeenCalled()
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing',
        mode: 'subscription',
      }),
    )
  })

  it('returns the checkout session URL', async () => {
    mockSupabaseChain({ stripe_customer_id: 'cus_1' })
    mockCheckoutCreate.mockResolvedValue({ url: 'https://stripe.com/pay' })

    const url = await createBotCheckoutSession('g1', 'Server', null)
    expect(url).toBe('https://stripe.com/pay')
  })
})

describe('handleBotWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles checkout.session.completed — updates to premium', async () => {
    const chain = mockSupabaseChain(null)
    chain.update.mockReturnValue(chain)

    await handleBotWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { discord_guild_id: 'guild-1' },
          subscription: 'sub_1',
        },
      },
    } as unknown as Stripe.Event)

    expect(supabaseAdmin.from).toHaveBeenCalledWith('discord_server_subscriptions')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_subscription_id: 'sub_1',
        status: 'premium',
      }),
    )
    expect(invalidatePremiumCache).toHaveBeenCalledWith('guild-1')
  })

  it('skips checkout.session.completed when no guild_id in metadata', async () => {
    mockSupabaseChain(null)

    await handleBotWebhookEvent({
      type: 'checkout.session.completed',
      data: { object: { metadata: {} } },
    } as unknown as Stripe.Event)

    expect(invalidatePremiumCache).not.toHaveBeenCalled()
  })

  it('handles customer.subscription.updated — active → premium', async () => {
    const chain = mockSupabaseChain(null)
    chain.update.mockReturnValue(chain)

    await handleBotWebhookEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: { discord_guild_id: 'guild-2' },
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
        },
      },
    } as unknown as Stripe.Event)

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'premium' }),
    )
    expect(invalidatePremiumCache).toHaveBeenCalledWith('guild-2')
  })

  it('handles customer.subscription.updated — past_due keeps raw status', async () => {
    const chain = mockSupabaseChain(null)
    chain.update.mockReturnValue(chain)

    await handleBotWebhookEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: { discord_guild_id: 'guild-3' },
          status: 'past_due',
          current_period_end: Math.floor(Date.now() / 1000),
        },
      },
    } as unknown as Stripe.Event)

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'past_due' }),
    )
  })

  it('handles customer.subscription.deleted — sets cancelled', async () => {
    const chain = mockSupabaseChain(null)
    chain.update.mockReturnValue(chain)

    await handleBotWebhookEvent({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          metadata: { discord_guild_id: 'guild-4' },
        },
      },
    } as unknown as Stripe.Event)

    expect(chain.update).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(invalidatePremiumCache).toHaveBeenCalledWith('guild-4')
  })

  it('handles invoice.payment_failed — sets past_due', async () => {
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { discord_guild_id: 'guild-5' }, error: null }),
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(selectChain as never)

    await handleBotWebhookEvent({
      type: 'invoice.payment_failed',
      data: {
        object: { subscription: 'sub_fail' },
      },
    } as unknown as Stripe.Event)

    expect(invalidatePremiumCache).toHaveBeenCalledWith('guild-5')
  })

  it('ignores unknown event types', async () => {
    await handleBotWebhookEvent({
      type: 'unknown.event' as never,
      data: { object: {} },
    } as unknown as Stripe.Event)

    expect(invalidatePremiumCache).not.toHaveBeenCalled()
  })
})
