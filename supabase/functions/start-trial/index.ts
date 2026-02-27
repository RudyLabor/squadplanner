// Start Trial Edge Function
// Activates a 7-day premium trial for the authenticated user
// SEC: Server-side validation prevents client-side subscription manipulation

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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

    // Use service role to check and update profile (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check current subscription status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    // Check if user already has an active premium subscription
    if (profile.subscription_tier === 'premium' || profile.subscription_tier === 'squad_leader' || profile.subscription_tier === 'club') {
      return new Response(JSON.stringify({ error: 'Already has an active premium subscription' }), {
        status: 409,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    // Check if user already used a trial (subscription_expires_at was set before)
    if (profile.subscription_expires_at) {
      return new Response(JSON.stringify({ error: 'Trial already used' }), {
        status: 409,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    // Activate 7-day trial
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: 'premium',
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error activating trial:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to activate trial' }), {
        status: 500,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    console.log(`Trial activated for user ${user.id}, expires at ${expiresAt}`)

    return new Response(
      JSON.stringify({
        success: true,
        expires_at: expiresAt,
      }),
      {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in start-trial:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
