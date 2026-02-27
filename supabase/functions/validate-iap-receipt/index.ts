// Validate IAP Receipt Edge Function
// Validates App Store / Google Play receipts and activates the subscription tier

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { validateString, validateUUID, validateEnum } from '../_shared/schemas.ts'

// CORS Security: Only allow specific origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  'capacitor://localhost',
  'http://localhost',
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

// ── Product ID to tier mapping ──────────────────────────────────
const IOS_PRODUCT_TO_TIER: Record<string, string> = {
  'fr.squadplanner.premium.monthly': 'premium',
  'fr.squadplanner.premium.yearly': 'premium',
  'fr.squadplanner.squadleader.monthly': 'squad_leader',
  'fr.squadplanner.squadleader.yearly': 'squad_leader',
}

const ANDROID_PRODUCT_TO_TIER: Record<string, string> = {
  premium_monthly: 'premium',
  premium_yearly: 'premium',
  squad_leader_monthly: 'squad_leader',
  squad_leader_yearly: 'squad_leader',
}

function getTierFromProductId(productId: string, platform: string): string {
  if (platform === 'ios') return IOS_PRODUCT_TO_TIER[productId] || 'premium'
  if (platform === 'android') return ANDROID_PRODUCT_TO_TIER[productId] || 'premium'
  return 'premium'
}

function getMaxMembers(tier: string): number {
  switch (tier) {
    case 'club':
      return 100
    case 'squad_leader':
      return 50
    case 'premium':
      return 20
    default:
      return 10
  }
}

// ── Apple App Store receipt validation (StoreKit 2 / App Store Server API) ──
async function validateAppleReceipt(receipt: string): Promise<{
  valid: boolean
  productId: string | null
  expiresAt: string | null
  error: string | null
}> {
  const appStoreServerKey = Deno.env.get('APPLE_APP_STORE_SERVER_KEY')
  const appStoreKeyId = Deno.env.get('APPLE_APP_STORE_KEY_ID')
  const appStoreIssuerId = Deno.env.get('APPLE_APP_STORE_ISSUER_ID')
  const bundleId = 'fr.squadplanner.app'

  if (!appStoreServerKey || !appStoreKeyId || !appStoreIssuerId) {
    console.error('[validate-iap] Apple App Store Server API credentials not configured')
    return {
      valid: false,
      productId: null,
      expiresAt: null,
      error: 'Apple IAP validation not configured',
    }
  }

  try {
    // Use the App Store Server API v2 to verify the transaction
    // The receipt from StoreKit 2 is a signed JWS (JSON Web Signature)
    // We verify it by calling Apple's /inApps/v2/transactions endpoint

    // Generate JWT for Apple App Store Server API authentication
    const header = btoa(JSON.stringify({ alg: 'ES256', kid: appStoreKeyId, typ: 'JWT' }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const now = Math.floor(Date.now() / 1000)
    const payload = btoa(
      JSON.stringify({
        iss: appStoreIssuerId,
        iat: now,
        exp: now + 3600,
        aud: 'appstoreconnect-v1',
        bid: bundleId,
      })
    )
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    // Import the private key for ES256 signing
    const keyData = appStoreServerKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '')
    const keyBuffer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    )

    const signingInput = new TextEncoder().encode(`${header}.${payload}`)
    const signatureBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      signingInput
    )

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const jwt = `${header}.${payload}.${signature}`

    // Call Apple's transaction verification endpoint
    const isProduction = Deno.env.get('APPLE_ENVIRONMENT') !== 'sandbox'
    const baseUrl = isProduction
      ? 'https://api.storekit.itunes.apple.com'
      : 'https://api.storekit-sandbox.itunes.apple.com'

    const response = await fetch(`${baseUrl}/inApps/v1/transactions/${receipt}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[validate-iap] Apple API error: ${response.status} ${errorText}`)
      return {
        valid: false,
        productId: null,
        expiresAt: null,
        error: `Apple validation failed: ${response.status}`,
      }
    }

    const data = await response.json()

    // Parse the signed transaction info (JWS)
    // The payload is the second part of the JWS (base64url encoded)
    const transactionPayload = data.signedTransactionInfo?.split('.')?.[1]
    if (!transactionPayload) {
      return { valid: false, productId: null, expiresAt: null, error: 'Invalid transaction format' }
    }

    const transactionInfo = JSON.parse(
      atob(transactionPayload.replace(/-/g, '+').replace(/_/g, '/'))
    )

    return {
      valid: true,
      productId: transactionInfo.productId || null,
      expiresAt: transactionInfo.expiresDate
        ? new Date(transactionInfo.expiresDate).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      error: null,
    }
  } catch (err) {
    console.error('[validate-iap] Apple validation error:', err)
    return {
      valid: false,
      productId: null,
      expiresAt: null,
      error: `Apple validation error: ${(err as Error).message}`,
    }
  }
}

// ── Google Play receipt validation ──────────────────────────────
async function validateGoogleReceipt(
  receipt: string,
  productId: string
): Promise<{
  valid: boolean
  productId: string | null
  expiresAt: string | null
  error: string | null
}> {
  const serviceAccountKey = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY')
  const packageName = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') || 'fr.squadplanner.app'

  if (!serviceAccountKey) {
    console.error('[validate-iap] Google Play service account key not configured')
    return {
      valid: false,
      productId: null,
      expiresAt: null,
      error: 'Google IAP validation not configured',
    }
  }

  try {
    // Parse the service account JSON key
    const serviceAccount = JSON.parse(serviceAccountKey)

    // Generate JWT for Google API authentication
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const now = Math.floor(Date.now() / 1000)
    const claimSet = btoa(
      JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/androidpublisher',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })
    )
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    // Import RSA private key for signing
    const keyData = serviceAccount.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '')
    const keyBuffer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signingInput = new TextEncoder().encode(`${header}.${claimSet}`)
    const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signingInput)

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const jwt = `${header}.${claimSet}.${signature}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error(`[validate-iap] Google token error: ${tokenError}`)
      return { valid: false, productId: null, expiresAt: null, error: 'Google auth failed' }
    }

    const { access_token } = await tokenResponse.json()

    // Parse the purchase token from receipt
    const purchaseToken = receipt

    // Verify the subscription with Google Play Developer API
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`

    const verifyResponse = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.text()
      console.error(`[validate-iap] Google verify error: ${verifyResponse.status} ${verifyError}`)
      return {
        valid: false,
        productId: null,
        expiresAt: null,
        error: `Google validation failed: ${verifyResponse.status}`,
      }
    }

    const subscription = await verifyResponse.json()

    // Check if subscription is active
    const expiryTimeMillis = parseInt(subscription.expiryTimeMillis || '0', 10)
    const isActive = expiryTimeMillis > Date.now()

    if (!isActive) {
      return { valid: false, productId, expiresAt: null, error: 'Subscription expired' }
    }

    return {
      valid: true,
      productId,
      expiresAt: new Date(expiryTimeMillis).toISOString(),
      error: null,
    }
  } catch (err) {
    console.error('[validate-iap] Google validation error:', err)
    return {
      valid: false,
      productId: null,
      expiresAt: null,
      error: `Google validation error: ${(err as Error).message}`,
    }
  }
}

// ── Main handler ────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Authenticate user via Supabase Auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse and validate request body
    let rawBody: Record<string, unknown>
    try {
      rawBody = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let validatedData: {
      receipt: string
      platform: 'ios' | 'android'
      product_id?: string
      user_id: string
    }

    try {
      validatedData = {
        receipt: validateString(rawBody.receipt, 'receipt', { minLength: 1 }),
        platform: validateEnum(rawBody.platform, 'platform', ['ios', 'android']),
        product_id: rawBody.product_id
          ? validateString(rawBody.product_id, 'product_id')
          : undefined,
        user_id: validateUUID(rawBody.user_id, 'user_id'),
      }
    } catch (validationError) {
      return new Response(JSON.stringify({ error: (validationError as Error).message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { receipt, platform, product_id, user_id } = validatedData

    // Security: ensure user_id matches authenticated user
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'user_id does not match authenticated user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate receipt with the appropriate store
    let validation: {
      valid: boolean
      productId: string | null
      expiresAt: string | null
      error: string | null
    }

    if (platform === 'ios') {
      validation = await validateAppleReceipt(receipt)
    } else {
      if (!product_id) {
        return new Response(
          JSON.stringify({ error: 'product_id is required for Android validation' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      validation = await validateGoogleReceipt(receipt, product_id)
    }

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Receipt validation failed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Determine the subscription tier from the validated product ID
    const validatedProductId = validation.productId || product_id || ''
    const tier = getTierFromProductId(validatedProductId, platform)
    const maxMembers = getMaxMembers(tier)
    const expiresAt =
      validation.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Update the database using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update user profile with tier
    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt,
      })
      .eq('id', user_id)

    // Create or update subscription record
    // Check for existing IAP subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .is('stripe_subscription_id', null)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      // Update existing IAP subscription
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: expiresAt,
        })
        .eq('id', existingSub.id)
    } else {
      // Create new subscription record
      await supabaseAdmin.from('subscriptions').insert({
        user_id,
        stripe_subscription_id: null,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: expiresAt,
      })
    }

    console.log(`[validate-iap] Tier "${tier}" activated for user ${user_id} via ${platform} IAP`)

    return new Response(
      JSON.stringify({
        success: true,
        tier,
        expires_at: expiresAt,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    // SEC: Don't leak internal error details to clients
    console.error('[validate-iap] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
