// Discord OAuth2 Account Linking Edge Function
// Exchanges a Discord OAuth code for user info and links it to the user's profile

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID') || ''
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET') || ''

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

function jsonResponse(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) })
  }

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCorsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    // Authenticate user via Supabase JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ error: 'Non autorise' }, 401, origin)
    }

    // Parse request body
    let body: { code: string; redirect_uri: string; action?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'JSON invalide' }, 400, origin)
    }

    // Handle unlink action
    if (body.action === 'unlink') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      const { error: unlinkError } = await supabaseAdmin
        .from('profiles')
        .update({ discord_user_id: null, discord_username: null })
        .eq('id', user.id)

      if (unlinkError) {
        return jsonResponse({ error: 'Erreur lors de la dissociation' }, 500, origin)
      }

      return jsonResponse({ success: true, action: 'unlinked' }, 200, origin)
    }

    // Validate code and redirect_uri
    if (!body.code || typeof body.code !== 'string') {
      return jsonResponse({ error: 'Code OAuth manquant' }, 400, origin)
    }
    if (!body.redirect_uri || typeof body.redirect_uri !== 'string') {
      return jsonResponse({ error: 'redirect_uri manquant' }, 400, origin)
    }

    // Exchange code for access token via Discord API
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: body.code,
        redirect_uri: body.redirect_uri,
      }),
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error('Discord token exchange failed:', tokenError)
      return jsonResponse({ error: 'Code OAuth invalide ou expire' }, 400, origin)
    }

    const tokenData = await tokenResponse.json()

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userResponse.ok) {
      return jsonResponse({ error: 'Impossible de recuperer les infos Discord' }, 500, origin)
    }

    const discordUser = await userResponse.json()
    const discordUserId = discordUser.id as string
    const discordUsername = discordUser.global_name || discordUser.username

    // Use admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if this Discord account is already linked to another user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('discord_user_id', discordUserId)
      .single()

    if (existingProfile && existingProfile.id !== user.id) {
      return jsonResponse(
        {
          error: `Ce compte Discord est deja lie au profil "${existingProfile.username}"`,
        },
        409,
        origin,
      )
    }

    // Link Discord to profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        discord_user_id: discordUserId,
        discord_username: discordUsername,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return jsonResponse({ error: 'Erreur lors de la mise a jour du profil' }, 500, origin)
    }

    return jsonResponse(
      {
        success: true,
        discord_username: discordUsername,
        discord_user_id: discordUserId,
      },
      200,
      origin,
    )
  } catch (error) {
    console.error('Discord OAuth error:', error)
    return jsonResponse({ error: (error as Error).message }, 500, origin)
  }
})
