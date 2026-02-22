// Stripe Webhook Edge Function
// Handles subscription events from Stripe

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// CORS Security: Only allow specific origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  Deno.env.get('SUPABASE_URL') || '',
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

// Map Stripe price_id to subscription tier
// Uses env vars so price IDs can differ between test/live modes
function getTierFromPriceId(priceId: string): string {
  const priceMapping: Record<string, string> = {}

  // Premium
  const premiumMonthly = Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY')
  const premiumYearly = Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY')
  if (premiumMonthly) priceMapping[premiumMonthly] = 'premium'
  if (premiumYearly) priceMapping[premiumYearly] = 'premium'

  // Squad Leader
  const slMonthly = Deno.env.get('STRIPE_PRICE_SL_MONTHLY')
  const slYearly = Deno.env.get('STRIPE_PRICE_SL_YEARLY')
  if (slMonthly) priceMapping[slMonthly] = 'squad_leader'
  if (slYearly) priceMapping[slYearly] = 'squad_leader'

  // Club
  const clubMonthly = Deno.env.get('STRIPE_PRICE_CLUB_MONTHLY')
  const clubYearly = Deno.env.get('STRIPE_PRICE_CLUB_YEARLY')
  if (clubMonthly) priceMapping[clubMonthly] = 'club'
  if (clubYearly) priceMapping[clubYearly] = 'club'

  return priceMapping[priceId] || 'premium'
}

// Get max_members based on tier
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  // Handle HEAD requests for health checks
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCorsHeaders(req.headers.get('origin')) })
  }

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  // SEC-8: Distinguish missing server config (503) from missing client signature (400)
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured!')
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 503,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const squadId = session.metadata?.squad_id || null
        const userId = session.metadata?.user_id
        const tierFromMetadata = session.metadata?.tier

        if (!userId) {
          console.error('Missing user_id in checkout session metadata')
          break
        }

        // Determine tier: from metadata, or from price_id mapping
        let tier = tierFromMetadata || 'premium'
        if (!tierFromMetadata && session.subscription) {
          // Fetch subscription to get price_id
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = sub.items?.data?.[0]?.price?.id
          if (priceId) {
            tier = getTierFromPriceId(priceId)
          }
        }

        const maxMembers = getMaxMembers(tier)

        // Create subscription record (squad_id is nullable for personal subscriptions)
        await supabaseAdmin.from('subscriptions').insert({
          ...(squadId && { squad_id: squadId }),
          user_id: userId,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

        // If squad_id provided, update squad
        if (squadId) {
          await supabaseAdmin
            .from('squads')
            .update({
              is_premium: true,
              max_members: maxMembers,
            })
            .eq('id', squadId)
        }

        // Update user profile with tier and stripe customer
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            subscription_tier: tier,
          })
          .eq('id', userId)

        console.log(
          `Tier "${tier}" activated for user ${userId}${squadId ? ` (squad ${squadId})` : ''}`
        )
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find subscription in database
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id, squad_id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSub) {
          // Determine new tier from price
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

          // If tier changed, update profile and squad
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
        const subscription = event.data.object as Stripe.Subscription

        // Find and update subscription
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id, squad_id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSub) {
          // Update subscription status
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('id', existingSub.id)

          // Downgrade squad
          if (existingSub.squad_id) {
            await supabaseAdmin
              .from('squads')
              .update({
                is_premium: false,
                max_members: 10,
              })
              .eq('id', existingSub.squad_id)
          }

          // Update user subscription tier to free
          if (existingSub.user_id) {
            await supabaseAdmin
              .from('profiles')
              .update({ subscription_tier: 'free' })
              .eq('id', existingSub.user_id)
          }

          console.log(`Subscription cancelled for user ${existingSub.user_id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Find subscription and update status
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', invoice.subscription as string)
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
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
