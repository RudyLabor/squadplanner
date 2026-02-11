// Web Vitals Analytics Edge Function
// Receives batched Core Web Vitals metrics from the frontend and inserts into web_vitals table.

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
  'http://localhost:3000',
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

const VALID_METRICS = ['LCP', 'FCP', 'CLS', 'TTFB', 'INP', 'FID']
const VALID_RATINGS = ['good', 'needs-improvement', 'poor']
const MAX_BATCH_SIZE = 50

interface WebVitalPayload {
  name: string
  value: number
  rating: string
  url: string
  timestamp: string
  userAgent?: string
  connectionType?: string
}

function isValidMetric(m: unknown): m is WebVitalPayload {
  if (!m || typeof m !== 'object') return false
  const metric = m as Record<string, unknown>
  return (
    typeof metric.name === 'string' &&
    VALID_METRICS.includes(metric.name) &&
    typeof metric.value === 'number' &&
    isFinite(metric.value) &&
    metric.value >= 0 &&
    typeof metric.rating === 'string' &&
    VALID_RATINGS.includes(metric.rating) &&
    typeof metric.url === 'string' &&
    metric.url.length > 0 &&
    typeof metric.timestamp === 'string'
  )
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
    const metrics: unknown[] = body.metrics

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return new Response(
        JSON.stringify({ error: 'metrics array is required and must not be empty' }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        },
      )
    }

    // Cap batch size to prevent abuse
    const batch = metrics.slice(0, MAX_BATCH_SIZE)

    // Validate and filter metrics
    const validMetrics = batch.filter(isValidMetric)

    if (validMetrics.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid metrics in batch' }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const rows = validMetrics.map((m) => ({
      metric_name: m.name,
      metric_value: m.value,
      rating: m.rating,
      page_url: m.url.slice(0, 2000),
      user_agent: (m.userAgent || '').slice(0, 500) || null,
      connection_type: (m.connectionType || '').slice(0, 50) || null,
      created_at: m.timestamp || new Date().toISOString(),
    }))

    const { error } = await supabase.from('web_vitals').insert(rows)

    if (error) {
      console.error('Failed to insert web vitals:', error.message)
      return new Response(
        JSON.stringify({ error: 'Failed to store web vitals' }),
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
      JSON.stringify({ received: validMetrics.length }),
      {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error processing web vitals:', error.message)
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
