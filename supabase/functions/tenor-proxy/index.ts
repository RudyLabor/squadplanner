// Tenor API Proxy Edge Function
// Proxies requests to Tenor API v2 to keep the API key server-side

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'https://squadplanner.fr',
  'https://www.squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.app',
  Deno.env.get('SUPABASE_URL') || ''
].filter(Boolean)

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))
    ? origin
    : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const TENOR_API_KEY = Deno.env.get('TENOR_API_KEY') || ''
const TENOR_BASE = 'https://tenor.googleapis.com/v2'
const CLIENT_KEY = 'squad_planner'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCorsHeaders(req.headers.get('origin')) })
  }

  const cors = getCorsHeaders(req.headers.get('origin'))

  try {
    if (!TENOR_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Tenor API key not configured' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    let body: { action?: string; query?: string; limit?: number }
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const { action = 'featured', query, limit = 20 } = body

    if (action !== 'search' && action !== 'featured') {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "search" or "featured".' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'search' && (!query || typeof query !== 'string')) {
      return new Response(
        JSON.stringify({ error: 'query is required for search action' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    // Build Tenor URL — media_filter with commas must NOT be URL-encoded
    let url = `${TENOR_BASE}/${action}?key=${encodeURIComponent(TENOR_API_KEY)}&client_key=${CLIENT_KEY}&media_filter=tinygif,gif&contentfilter=medium&locale=fr_FR&limit=${limit}`
    if (action === 'search' && query) {
      url += `&q=${encodeURIComponent(query)}`
    }

    const tenorRes = await fetch(url)

    if (!tenorRes.ok) {
      const errorText = await tenorRes.text()
      console.error('Tenor API error:', tenorRes.status, errorText)
      return new Response(
        JSON.stringify({ error: `Tenor API returned ${tenorRes.status}`, details: errorText }),
        { status: tenorRes.status, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const data = await tenorRes.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } }
    )
  } catch (error) {
    console.error('Tenor proxy error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
