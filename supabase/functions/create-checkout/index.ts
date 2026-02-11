// Create Stripe Checkout Session Edge Function
// Creates a checkout session for squad premium subscription

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import {
  validateString,
  validateUUID,
  validateOptional,
} from '../_shared/schemas.ts'

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
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    let rawBody: Record<string, unknown>
    try {
      rawBody = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    let validatedData: {
      squad_id?: string
      price_id: string
      success_url?: string
      cancel_url?: string
    }

    try {
      // squad_id is optional - personal subscriptions don't need a squad
      const squadId = rawBody.squad_id && rawBody.squad_id !== ''
        ? validateUUID(rawBody.squad_id, 'squad_id')
        : undefined

      validatedData = {
        squad_id: squadId,
        price_id: validateString(rawBody.price_id, 'price_id', { minLength: 1, maxLength: 100 }),
        success_url: validateOptional(rawBody.success_url, (v) => validateString(v, 'success_url')),
        cancel_url: validateOptional(rawBody.cancel_url, (v) => validateString(v, 'cancel_url')),
      }
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const { squad_id, price_id, success_url, cancel_url } = validatedData

    // If squad_id provided, verify user is squad owner
    let squad = null
    if (squad_id) {
      const { data } = await supabaseClient
        .from('squads')
        .select('id, name, owner_id')
        .eq('id', squad_id)
        .single()

      squad = data

      if (!squad || squad.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Only squad owner can purchase premium' }),
          { status: 403, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
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
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        name: profile?.username,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const defaultSuccessUrl = squad_id
      ? `${req.headers.get('origin')}/squad/${squad_id}?checkout=success`
      : `${req.headers.get('origin')}/profile?checkout=success`
    const defaultCancelUrl = squad_id
      ? `${req.headers.get('origin')}/squad/${squad_id}?checkout=cancelled`
      : `${req.headers.get('origin')}/profile?checkout=cancelled`

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      metadata: {
        ...(squad_id && { squad_id }),
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          ...(squad_id && { squad_id }),
          user_id: user.id,
        },
      },
      success_url: success_url || defaultSuccessUrl,
      cancel_url: cancel_url || defaultCancelUrl,
      allow_promotion_codes: true,
    })

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
