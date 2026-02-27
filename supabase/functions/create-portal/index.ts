// Create Stripe Customer Portal Session Edge Function
// Allows users to manage their subscriptions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import { validateString, validateOptional } from '../_shared/schemas.ts'

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

    // Parse and validate request body
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

    let validatedData: {
      return_url?: string
    }

    try {
      validatedData = {
        return_url: validateOptional(rawBody.return_url, (v) => validateString(v, 'return_url')),
      }
    } catch (validationError) {
      return new Response(JSON.stringify({ error: (validationError as Error).message }), {
        status: 400,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    const { return_url } = validatedData

    // SEC: Always look up customer_id from the authenticated user's profile
    // Never accept customer_id from client to prevent IDOR attacks
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found for this user' }), {
        status: 404,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    // SEC: Validate return_url against allowed domains to prevent open redirect
    let safeReturnUrl = `${req.headers.get('origin')}/profile`
    if (return_url) {
      try {
        const parsed = new URL(return_url)
        const allowedHosts = ['squadplanner.fr', 'www.squadplanner.fr', 'squadplanner.app', 'www.squadplanner.app', 'localhost']
        if (allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
          safeReturnUrl = return_url
        }
      } catch {
        // Invalid URL — use default
      }
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: safeReturnUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // SEC: Don't leak internal error details to clients
    console.error('Error creating portal session:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
