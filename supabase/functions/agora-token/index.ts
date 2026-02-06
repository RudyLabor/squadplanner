// Agora Token Generator Edge Function
// Uses official agora-token library with Node.js crypto polyfill

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Import Node.js crypto polyfill for Deno
import 'https://deno.land/std@0.177.0/node/crypto.ts'

// Now import agora-token which will use the polyfilled crypto
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token@2.0.3'

// CORS Security
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
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

const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID') || ''
const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE') || ''

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    // Check if Agora is configured
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.warn('Agora credentials not configured')
      return new Response(
        JSON.stringify({ token: null, error: 'Agora not configured' }),
        { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    let body: { channel_name?: string; uid?: number }
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const { channel_name, uid } = body

    if (!channel_name || typeof channel_name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'channel_name is required' }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const numericUid = typeof uid === 'number' ? uid : 0
    const expirationTimeInSeconds = 86400 // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    console.log('Generating token for channel:', channel_name, 'uid:', numericUid)

    // Generate token using official Agora library
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channel_name,
      numericUid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    )

    console.log('Token generated successfully, length:', token.length)

    return new Response(
      JSON.stringify({
        token,
        app_id: AGORA_APP_ID,
        channel: channel_name,
        uid: numericUid,
        expires_at: new Date(privilegeExpiredTs * 1000).toISOString(),
      }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating Agora token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
