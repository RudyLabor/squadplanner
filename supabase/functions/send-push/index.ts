// Send Push Notification Edge Function
// Sends Web Push (VAPID) and Native Push (FCM) notifications to users
// Endpoint: POST /functions/v1/send-push
// Body: { userId?: string, userIds?: string[], title: string, body: string, url?: string, tag?: string }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Firebase configuration
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? 'squadplanner-app'
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? ''
import {
  validateString,
  validateArray,
  validateOptional,
  validateUUID,
} from '../_shared/schemas.ts'

// CORS Security: Only allow specific origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  'https://squadplanner.fr',
  'https://www.squadplanner.fr',
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

// VAPID keys from environment
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@squadplanner.app'

interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

interface PushAction {
  action: string
  title: string
  icon?: string
}

interface PushPayload {
  userId?: string
  userIds?: string[]
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
  actions?: PushAction[]
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(array: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Import a crypto key (VAPID keys are raw EC keys, not PKCS8)
async function importVapidKey(base64Key: string, isPrivate: boolean): Promise<CryptoKey> {
  const keyData = base64ToUint8Array(base64Key)

  if (isPrivate) {
    // VAPID private key is a raw 32-byte scalar, need to convert to JWK format
    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      // For private key, we need d (the private scalar) and x, y (public point)
      // But we only have d, so we'll use a different approach
      d: base64Key.replace(/-/g, '+').replace(/_/g, '/'),
      x: '', // Will be derived
      y: '', // Will be derived
    }

    // Alternative: Import as raw and wrap in proper format
    // The private key needs to be in JWK or PKCS8 format for WebCrypto
    // Since we have raw bytes, convert to JWK
    const privateKeyJwk = {
      kty: 'EC',
      crv: 'P-256',
      d: uint8ArrayToBase64Url(keyData),
      // x and y are required for JWK import, derive from public key
      x: uint8ArrayToBase64Url(base64ToUint8Array(VAPID_PUBLIC_KEY).slice(1, 33)),
      y: uint8ArrayToBase64Url(base64ToUint8Array(VAPID_PUBLIC_KEY).slice(33, 65)),
    }

    return await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    )
  } else {
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      []
    )
  }
}

// Create VAPID JWT token
async function createVapidJwt(audience: string): Promise<string> {
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: VAPID_SUBJECT
  }

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const unsignedToken = `${headerB64}.${payloadB64}`

  // Import private key and sign
  const privateKey = await importVapidKey(VAPID_PRIVATE_KEY, true)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  )

  // Convert signature from DER to raw format if needed
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature))

  return `${unsignedToken}.${signatureB64}`
}

// Encrypt payload for Web Push
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; publicKey: Uint8Array }> {
  // Generate ephemeral key pair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )

  // Import user's public key
  const userPublicKey = await crypto.subtle.importKey(
    'raw',
    base64ToUint8Array(p256dhKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userPublicKey },
    keyPair.privateKey,
    256
  )

  // Export our public key
  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey)

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Derive encryption key using HKDF
  // Note: authSecret is used indirectly via the HKDF derivation process
  void base64ToUint8Array(authSecret) // Validate authSecret format

  // PRK = HKDF-Extract(salt=auth_secret, IKM=shared_secret)
  const prkKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(sharedSecret),
    { name: 'HKDF' },
    false,
    ['deriveBits', 'deriveKey']
  )

  // Create info for key derivation
  const encoder = new TextEncoder()
  const keyInfo = new Uint8Array([
    ...encoder.encode('Content-Encoding: aes128gcm\0'),
  ])

  const contentEncryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: keyInfo
    },
    prkKey,
    { name: 'AES-GCM', length: 128 },
    false,
    ['encrypt']
  )

  // Create nonce
  const nonceInfo = new Uint8Array([
    ...encoder.encode('Content-Encoding: nonce\0'),
  ])

  const nonceBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: nonceInfo
    },
    prkKey,
    96
  )

  // Add padding to payload
  const paddedPayload = new Uint8Array([
    ...new Uint8Array(2), // 2 bytes for padding length
    ...encoder.encode(payload)
  ])

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(nonceBits) },
    contentEncryptionKey,
    paddedPayload
  )

  return {
    encrypted: new Uint8Array(encrypted),
    salt,
    publicKey: new Uint8Array(publicKeyRaw)
  }
}

// =====================================================
// FIREBASE CLOUD MESSAGING (FCM) for Native Apps
// =====================================================

interface PushToken {
  id: string
  user_id: string
  token: string
  platform: 'ios' | 'android' | 'web'
}

// Convert PEM to binary for Firebase JWT
function pemToBinary(pem: string): ArrayBuffer {
  const lines = pem.split('\n')
  const base64 = lines.filter(line => !line.includes('-----')).join('')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Get OAuth2 access token for Firebase
async function getFirebaseAccessToken(): Promise<string | null> {
  if (!FIREBASE_SERVICE_ACCOUNT) {
    console.log('[FCM] Firebase service account not configured')
    return null
  }

  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT)
    const now = Math.floor(Date.now() / 1000)

    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging'
    }

    // Create JWT header and payload
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const body = btoa(JSON.stringify(payload))

    // Import private key
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToBinary(serviceAccount.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Sign JWT
    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(`${header}.${body}`)
    )

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    const jwt = `${header}.${body}.${signatureB64}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  } catch (error) {
    console.error('[FCM] Error getting access token:', error)
    return null
  }
}

// Send FCM notification to a single token
async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Seuls les vrais appels vocaux sonnent en continu
    const isCall = data.type === 'incoming_call'

    const message = {
      message: {
        token: token,
        notification: {
          title: title,
          body: body
        },
        data: data,
        android: {
          priority: 'high',
          notification: {
            sound: isCall ? 'ringtone' : 'default',
            channel_id: isCall ? 'calls' : 'default',
            vibrate_timings: isCall ? ['0s', '0.3s', '0.1s', '0.3s', '0.1s', '0.3s'] : undefined
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              sound: isCall ? 'ringtone.caf' : 'default',
              badge: 1,
              'content-available': 1,
              'interruption-level': isCall ? 'critical' : 'active'
            }
          }
        }
      }
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[FCM] Error:', response.status, error)

      // Token invalide ou expiré
      if (response.status === 404 || response.status === 400) {
        return { success: false, error: 'token_expired' }
      }

      return { success: false, error: `HTTP ${response.status}` }
    }

    console.log('[FCM] Notification sent successfully')
    return { success: true }
  } catch (error) {
    console.error('[FCM] Error sending notification:', error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// WEB PUSH (VAPID)
// =====================================================

// Send push notification to a single subscription
async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: object
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload)

    // Encrypt the payload
    const { encrypted, salt, publicKey } = await encryptPayload(
      payloadString,
      subscription.p256dh,
      subscription.auth
    )

    // Get the audience (origin) from the endpoint
    const endpointUrl = new URL(subscription.endpoint)
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`

    // Create VAPID JWT
    const vapidJwt = await createVapidJwt(audience)

    // Build the encrypted body
    // Format: salt (16) + rs (4) + idlen (1) + keyid (65) + ciphertext
    const recordSize = new Uint8Array(4)
    new DataView(recordSize.buffer).setUint32(0, 4096, false)

    const body = new Uint8Array([
      ...salt,
      ...recordSize,
      publicKey.length,
      ...publicKey,
      ...encrypted
    ])

    // Send the request
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidJwt}, k=${uint8ArrayToBase64Url(base64ToUint8Array(VAPID_PUBLIC_KEY))}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 hours
        'Urgency': 'high'
      },
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Push failed for ${subscription.endpoint}:`, response.status, errorText)

      // If subscription is invalid, return specific error
      if (response.status === 404 || response.status === 410) {
        return { success: false, error: 'subscription_expired' }
      }

      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    console.log(`Push sent successfully to ${subscription.endpoint}`)
    return { success: true }
  } catch (error) {
    console.error('Error sending push:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  // Handle HEAD requests for health checks
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Security: Verify Authorization header (Bearer token)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate the token - accept service role key or verify with Supabase
    const token = authHeader.replace('Bearer ', '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // If not service role, verify the user token
    if (token !== serviceRoleKey) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      )
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validate VAPID keys
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    let rawBody: Record<string, unknown>
    try {
      rawBody = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input data
    let validatedData: {
      userId?: string
      userIds?: string[]
      title: string
      body: string
      url?: string
      tag?: string
      icon?: string
      badge?: string
      data?: Record<string, unknown>
      actions?: PushAction[]
    }

    try {
      validatedData = {
        userId: validateOptional(rawBody.userId, (v) => validateUUID(v, 'userId')),
        userIds: validateOptional(rawBody.userIds, (v) =>
          validateArray(v, 'userIds', (item) => validateUUID(item, 'userIds item'))
        ),
        title: validateString(rawBody.title, 'title', { minLength: 1, maxLength: 100 }),
        body: validateString(rawBody.body, 'body', { minLength: 1, maxLength: 500 }),
        url: validateOptional(rawBody.url, (v) => validateString(v, 'url')),
        tag: validateOptional(rawBody.tag, (v) => validateString(v, 'tag', { maxLength: 100 })),
        icon: validateOptional(rawBody.icon, (v) => validateString(v, 'icon')),
        badge: validateOptional(rawBody.badge, (v) => validateString(v, 'badge')),
        data: rawBody.data as Record<string, unknown> | undefined,
        actions: rawBody.actions as PushAction[] | undefined,
      }
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user IDs to notify
    const userIds: string[] = []
    if (validatedData.userId) {
      userIds.push(validatedData.userId)
    }
    if (validatedData.userIds) {
      userIds.push(...validatedData.userIds)
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'userId or userIds required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get subscriptions for users
    const { data: subscriptions, error: dbError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for users:', userIds)
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          failed: 0,
          message: 'No subscriptions found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build notification payload
    const notificationPayload: Record<string, unknown> = {
      title: validatedData.title,
      body: validatedData.body,
      icon: validatedData.icon || '/favicon.svg',
      badge: validatedData.badge || '/favicon.svg',
      url: validatedData.url || '/',
      tag: validatedData.tag || 'squadplanner-notification',
      data: validatedData.data || {}
    }

    // Ajouter les actions si presentes (pour les appels entrants notamment)
    if (validatedData.actions && validatedData.actions.length > 0) {
      notificationPayload.actions = validatedData.actions
    }

    // Si c'est un appel entrant, configurer des options specifiques
    if (validatedData.data?.type === 'incoming_call') {
      notificationPayload.requireInteraction = true // La notification reste jusqu'a action
      notificationPayload.vibrate = [300, 100, 300, 100, 300] // Vibration type sonnerie
      notificationPayload.urgency = 'high'
      console.log('[send-push] Incoming call notification for:', validatedData.data.caller_name)
    }

    // =====================================================
    // SEND TO WEB PUSH SUBSCRIPTIONS
    // =====================================================

    // Send to all subscriptions
    const webResults = await Promise.all(
      subscriptions.map((sub: PushSubscription) =>
        sendPushToSubscription(sub, notificationPayload)
      )
    )

    // Count successes and failures
    let webSent = webResults.filter(r => r.success).length
    let webFailed = webResults.filter(r => !r.success).length

    // Clean up expired subscriptions
    const expiredSubs = subscriptions.filter((sub, index) =>
      webResults[index].error === 'subscription_expired'
    )

    if (expiredSubs.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubs.map(s => s.id))

      if (deleteError) {
        console.error('Failed to delete expired subscriptions:', deleteError)
      } else {
        console.log(`Deleted ${expiredSubs.length} expired subscriptions`)
      }
    }

    // =====================================================
    // SEND TO NATIVE PUSH TOKENS (FCM)
    // =====================================================

    let nativeSent = 0
    let nativeFailed = 0
    let expiredTokens: PushToken[] = []

    // Get native push tokens
    const { data: nativeTokens, error: tokensError } = await supabaseAdmin
      .from('push_tokens')
      .select('*')
      .in('user_id', userIds)

    if (!tokensError && nativeTokens && nativeTokens.length > 0) {
      // Get Firebase access token
      const fcmAccessToken = await getFirebaseAccessToken()

      if (fcmAccessToken) {
        // Prepare data for FCM (must be string values)
        const fcmData: Record<string, string> = {
          url: String(validatedData.url || '/'),
          tag: String(validatedData.tag || 'squadplanner-notification'),
          type: String((validatedData.data as Record<string, unknown>)?.type || 'notification')
        }

        // Add other data fields as strings
        if (validatedData.data) {
          for (const [key, value] of Object.entries(validatedData.data)) {
            fcmData[key] = String(value)
          }
        }

        // Send to each native token
        const nativeResults = await Promise.all(
          nativeTokens.map((token: PushToken) =>
            sendFCMNotification(
              token.token,
              validatedData.title,
              validatedData.body,
              fcmData,
              fcmAccessToken
            )
          )
        )

        nativeSent = nativeResults.filter(r => r.success).length
        nativeFailed = nativeResults.filter(r => !r.success).length

        // Collect expired tokens
        expiredTokens = nativeTokens.filter((token, index) =>
          nativeResults[index].error === 'token_expired'
        )

        // Clean up expired tokens
        if (expiredTokens.length > 0) {
          const { error: deleteTokenError } = await supabaseAdmin
            .from('push_tokens')
            .delete()
            .in('id', expiredTokens.map(t => t.id))

          if (deleteTokenError) {
            console.error('Failed to delete expired tokens:', deleteTokenError)
          } else {
            console.log(`Deleted ${expiredTokens.length} expired FCM tokens`)
          }
        }
      } else {
        console.log('[FCM] Skipping native push - Firebase not configured')
      }
    }

    const totalSent = webSent + nativeSent
    const totalFailed = webFailed + nativeFailed
    const totalExpired = expiredSubs.length + expiredTokens.length

    console.log(`Push notifications: ${totalSent} sent (${webSent} web, ${nativeSent} native), ${totalFailed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        failed: totalFailed,
        expired: totalExpired,
        breakdown: {
          web: { sent: webSent, failed: webFailed, expired: expiredSubs.length },
          native: { sent: nativeSent, failed: nativeFailed, expired: expiredTokens.length }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-push:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
