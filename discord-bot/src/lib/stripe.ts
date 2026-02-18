import Stripe from 'stripe'
import { supabaseAdmin } from './supabase.js'
import { invalidatePremiumCache } from './permissions.js'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

export async function createBotCheckoutSession(
  guildId: string,
  guildName: string,
  adminUserId: string | null,
): Promise<string | null> {
  const priceId = process.env.STRIPE_PRICE_BOT_PREMIUM_MONTHLY
  if (!priceId) throw new Error('Missing STRIPE_PRICE_BOT_PREMIUM_MONTHLY')

  // Get or create Stripe customer for this server
  const { data: existing } = await supabaseAdmin
    .from('discord_server_subscriptions')
    .select('stripe_customer_id')
    .eq('discord_guild_id', guildId)
    .single()

  let customerId = existing?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: `Discord: ${guildName}`,
      metadata: {
        discord_guild_id: guildId,
        admin_user_id: adminUserId || '',
      },
    })
    customerId = customer.id

    await supabaseAdmin
      .from('discord_server_subscriptions')
      .upsert(
        {
          discord_guild_id: guildId,
          guild_name: guildName,
          stripe_customer_id: customerId,
          admin_user_id: adminUserId,
        },
        { onConflict: 'discord_guild_id' },
      )
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { discord_guild_id: guildId },
    subscription_data: { metadata: { discord_guild_id: guildId } },
    success_url: `${APP_URL}/premium?discord=success&guild=${guildId}`,
    cancel_url: `${APP_URL}/premium?discord=cancelled&guild=${guildId}`,
    allow_promotion_codes: true,
  })

  return session.url
}

export async function handleBotWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const guildId = session.metadata?.discord_guild_id
      if (!guildId) break

      await supabaseAdmin
        .from('discord_server_subscriptions')
        .update({
          stripe_subscription_id: session.subscription as string,
          status: 'premium',
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq('discord_guild_id', guildId)

      invalidatePremiumCache(guildId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const guildId = sub.metadata?.discord_guild_id
      if (!guildId) break

      await supabaseAdmin
        .from('discord_server_subscriptions')
        .update({
          status: sub.status === 'active' ? 'premium' : sub.status,
          current_period_end: new Date(
            sub.current_period_end * 1000,
          ).toISOString(),
        })
        .eq('discord_guild_id', guildId)

      invalidatePremiumCache(guildId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const guildId = sub.metadata?.discord_guild_id
      if (!guildId) break

      await supabaseAdmin
        .from('discord_server_subscriptions')
        .update({ status: 'cancelled' })
        .eq('discord_guild_id', guildId)

      invalidatePremiumCache(guildId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id
      if (!subId) break

      const { data } = await supabaseAdmin
        .from('discord_server_subscriptions')
        .select('discord_guild_id')
        .eq('stripe_subscription_id', subId)
        .single()

      if (data) {
        await supabaseAdmin
          .from('discord_server_subscriptions')
          .update({ status: 'past_due' })
          .eq('discord_guild_id', data.discord_guild_id)

        invalidatePremiumCache(data.discord_guild_id)
      }
      break
    }
  }
}
