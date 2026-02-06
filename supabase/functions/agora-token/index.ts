// Agora Token Generator Edge Function
// Generates RTC tokens for voice chat channels using Agora's algorithm

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { encodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts'
import {
  validateString,
  validateNumber,
  validateOptional,
} from '../_shared/schemas.ts'

// CORS Security: Only allow specific origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.app',
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

// Role constants
const Role = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
}

// Privilege constants
const Privileges = {
  JOIN_CHANNEL: 1,
  PUBLISH_AUDIO_STREAM: 2,
  PUBLISH_VIDEO_STREAM: 3,
  PUBLISH_DATA_STREAM: 4,
}

// Pack a string with its length prefix (2 bytes, little endian)
function packString(str: string): Uint8Array {
  const strBytes = new TextEncoder().encode(str)
  const result = new Uint8Array(2 + strBytes.length)
  result[0] = strBytes.length & 0xFF
  result[1] = (strBytes.length >> 8) & 0xFF
  result.set(strBytes, 2)
  return result
}

// Pack a uint16 (2 bytes, little endian)
function packUint16(val: number): Uint8Array {
  const result = new Uint8Array(2)
  result[0] = val & 0xFF
  result[1] = (val >> 8) & 0xFF
  return result
}

// Pack a uint32 (4 bytes, little endian)
function packUint32(val: number): Uint8Array {
  const result = new Uint8Array(4)
  result[0] = val & 0xFF
  result[1] = (val >> 8) & 0xFF
  result[2] = (val >> 16) & 0xFF
  result[3] = (val >> 24) & 0xFF
  return result
}

// Concatenate multiple Uint8Arrays
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

// Generate random bytes (kept for potential future use in token generation)
// deno-lint-ignore no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

// HMAC-SHA256
async function hmacSha256(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message)
  return new Uint8Array(signature)
}

// Build the message to sign
function buildMessage(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  salt: number,
  ts: number,
  privileges: Map<number, number>
): Uint8Array {
  const parts: Uint8Array[] = []

  // Pack app ID
  parts.push(packString(appId))

  // Pack channel name
  parts.push(packString(channelName))

  // Pack UID
  parts.push(packUint32(uid))

  // Pack salt
  parts.push(packUint32(salt))

  // Pack timestamp
  parts.push(packUint32(ts))

  // Pack privileges count and each privilege
  parts.push(packUint16(privileges.size))
  for (const [key, value] of privileges) {
    parts.push(packUint16(key))
    parts.push(packUint32(value))
  }

  return concatBytes(...parts)
}

// Generate RTC token (AccessToken2 format)
async function generateRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  privilegeExpiredTs: number
): Promise<string> {
  const ts = Math.floor(Date.now() / 1000)
  const salt = Math.floor(Math.random() * 0xFFFFFFFF)

  // Set up privileges based on role
  const privileges = new Map<number, number>()
  privileges.set(Privileges.JOIN_CHANNEL, privilegeExpiredTs)

  if (role === Role.PUBLISHER) {
    privileges.set(Privileges.PUBLISH_AUDIO_STREAM, privilegeExpiredTs)
    privileges.set(Privileges.PUBLISH_VIDEO_STREAM, privilegeExpiredTs)
    privileges.set(Privileges.PUBLISH_DATA_STREAM, privilegeExpiredTs)
  }

  // Build the message
  const message = buildMessage(appId, appCertificate, channelName, uid, salt, ts, privileges)

  // Sign the message
  const certBytes = new TextEncoder().encode(appCertificate)
  const signature = await hmacSha256(certBytes, message)

  // Build the token content
  const content = concatBytes(
    packString(appId),
    packUint32(ts),
    packUint32(salt),
    packUint16(signature.length),
    signature,
    packUint16(message.length - packString(appId).length), // message without appId
    message.subarray(packString(appId).length) // message content without appId
  )

  // Version prefix + base64 encoded content
  const version = '007' // AccessToken2 version
  const base64Content = encodeBase64(content)

  return version + base64Content
}

// Alternative: Generate simple RTC token (AccessToken format - older but more compatible)
async function generateSimpleRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number | string,
  role: number,
  privilegeExpiredTs: number
): Promise<string> {
  const ts = Math.floor(Date.now() / 1000)
  const salt = Math.floor(Math.random() * 99999999)

  // UID as string (Agora allows both numeric and string UIDs)
  const uidStr = typeof uid === 'number' ? (uid === 0 ? '' : uid.toString()) : uid

  // Build message parts
  const message = `${appId}${channelName}${uidStr}${salt}${ts}${role}${privilegeExpiredTs}`

  // Create signature using HMAC-SHA256
  const encoder = new TextEncoder()
  const keyData = encoder.encode(appCertificate)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const signatureArray = new Uint8Array(signatureBuffer)

  // Build token content
  const tokenContent = {
    appId,
    channelName,
    uid: uidStr,
    salt,
    ts,
    role,
    privilegeExpiredTs,
    signature: Array.from(signatureArray).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Encode as base64
  const tokenJson = JSON.stringify(tokenContent)
  const base64Token = btoa(tokenJson)

  // Return with version prefix
  return '006' + base64Token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    // Check if Agora is configured
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.warn('Agora credentials not configured, returning empty token')
      return new Response(
        JSON.stringify({
          token: null,
          error: 'Agora not configured',
          app_id: AGORA_APP_ID || 'NOT_SET',
        }),
        { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
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
      channel_name: string
      uid?: number
    }

    try {
      validatedData = {
        channel_name: validateString(rawBody.channel_name, 'channel_name', { minLength: 1, maxLength: 64 }),
        uid: validateOptional(rawBody.uid, (v) => validateNumber(v, 'uid', { min: 0, max: 4294967295 })),
      }
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const { channel_name, uid } = validatedData

    // Use provided UID or generate from user ID
    const numericUid = typeof uid === 'number' ? uid : 0

    // Generate token with 24 hour expiry
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 86400

    console.log('Generating token for channel:', channel_name, 'uid:', numericUid)

    // Try the newer token format first
    let token: string
    try {
      token = await generateRtcToken(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channel_name,
        numericUid,
        Role.PUBLISHER,
        privilegeExpiredTs
      )
    } catch (tokenError) {
      console.warn('Failed to generate AccessToken2, trying simple format:', tokenError)
      token = await generateSimpleRtcToken(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channel_name,
        numericUid,
        Role.PUBLISHER,
        privilegeExpiredTs
      )
    }

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
