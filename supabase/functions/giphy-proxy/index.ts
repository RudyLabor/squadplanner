// GIPHY API Proxy Edge Function
// Proxies requests to GIPHY API v1 to keep the API key server-side

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
  Deno.env.get('SUPABASE_URL') || '',
].filter(Boolean)

// Also allow Vercel preview/production deployments
const VERCEL_PATTERN = /^https:\/\/[\w-]+\.vercel\.app$/

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && (ALLOWED_ORIGINS.some((allowed) => origin === allowed) || VERCEL_PATTERN.test(origin))
      ? origin
      : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const GIPHY_API_KEY = Deno.env.get('GIPHY_API_KEY') || ''
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs'

// SEC-4 + SEC-10: Simple in-memory rate limiter (per IP, 10 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}
// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 300_000)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCorsHeaders(req.headers.get('origin')) })
  }

  const cors = getCorsHeaders(req.headers.get('origin'))

  // SEC-4 + SEC-10: Rate limit by IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': '60' },
    })
  }

  try {
    if (!GIPHY_API_KEY) {
      return new Response(JSON.stringify({ error: 'GIPHY API key not configured' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    let body: { action?: string; query?: string; limit?: number }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const { action = 'trending', query, limit = 20 } = body

    if (action !== 'search' && action !== 'trending') {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "search" or "trending".' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'search' && (!query || typeof query !== 'string')) {
      return new Response(JSON.stringify({ error: 'query is required for search action' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    let url = `${GIPHY_BASE}/${action}?api_key=${encodeURIComponent(GIPHY_API_KEY)}&rating=pg-13&lang=fr&limit=${limit}`
    if (action === 'search' && query) {
      url += `&q=${encodeURIComponent(query)}`
    }

    const giphyRes = await fetch(url)

    if (!giphyRes.ok) {
      const errorText = await giphyRes.text()
      // SEC-7: Log details server-side only, return generic error to client
      console.error('GIPHY API error:', giphyRes.status, errorText)
      return new Response(JSON.stringify({ error: 'GIF service unavailable' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const data = await giphyRes.json()

    return new Response(JSON.stringify(data), {
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    // SEC-7: Don't leak internal error details
    console.error('GIPHY proxy error:', error)
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
