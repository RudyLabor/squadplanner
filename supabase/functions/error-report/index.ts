// Error Report Edge Function
// Receives batched error reports from the micro error tracker and inserts into error_reports table.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.app',
  'https://www.squadplanner.fr',
  Deno.env.get('SUPABASE_URL') || '',
].filter(Boolean)

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))
      ? origin
      : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

interface ErrorReport {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
  level: string
  extra?: Record<string, unknown>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: getCorsHeaders(req.headers.get('origin')),
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...getCorsHeaders(req.headers.get('origin')),
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const body = await req.json()
    const errors: ErrorReport[] = body.errors

    if (!Array.isArray(errors) || errors.length === 0) {
      return new Response(
        JSON.stringify({ error: 'errors array is required' }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        },
      )
    }

    // Limit batch size to prevent abuse
    const batch = errors.slice(0, 50)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const rows = batch.map((err) => ({
      message: (err.message || '').slice(0, 2000),
      stack: err.stack?.slice(0, 5000),
      url: (err.url || '').slice(0, 2000),
      timestamp: err.timestamp || new Date().toISOString(),
      user_agent: (err.userAgent || '').slice(0, 500),
      user_id: err.userId || null,
      level: err.level || 'error',
      extra: err.extra || null,
    }))

    const { error } = await supabase.from('error_reports').insert(rows)

    if (error) {
      console.error('Failed to insert error reports:', error.message)
      return new Response(
        JSON.stringify({ error: 'Failed to store error reports' }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        },
      )
    }

    return new Response(
      JSON.stringify({ received: batch.length }),
      {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error processing error reports:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
