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
  Deno.env.get('SUPABASE_URL') || ''
].filter(Boolean)

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin === allowed)
    ? origin
    : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

  if (!signature || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing signature or webhook secret' }),
      { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
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

        const squadId = session.metadata?.squad_id
        const userId = session.metadata?.user_id

        if (!squadId || !userId) {
          console.error('Missing metadata in checkout session')
          break
        }

        // Create subscription record
        await supabaseAdmin.from('subscriptions').insert({
          squad_id: squadId,
          user_id: userId,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

        // Update squad to premium
        await supabaseAdmin
          .from('squads')
          .update({
            is_premium: true,
            max_members: 50, // Increase member limit
          })
          .eq('id', squadId)

        // Update user's stripe customer id
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            subscription_tier: 'premium',
          })
          .eq('id', userId)

        console.log(`Premium activated for squad ${squadId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find subscription in database
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id, squad_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('id', existingSub.id)
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
          await supabaseAdmin
            .from('squads')
            .update({
              is_premium: false,
              max_members: 10,
            })
            .eq('id', existingSub.squad_id)

          // Update user subscription tier
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_tier: 'free' })
            .eq('id', existingSub.user_id)

          console.log(`Premium cancelled for squad ${existingSub.squad_id}`)
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

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
