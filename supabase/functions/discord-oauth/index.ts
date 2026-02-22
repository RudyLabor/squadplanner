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
  'https://www.squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.app',
  Deno.env.get('SUPABASE_URL') || '',
].filter(Boolean)

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  // Allow Vercel preview deployments
  if (/^https:\/\/squadplanner[a-z0-9-]*\.vercel\.app$/.test(origin)) return true
  return false
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, HEAD',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, HEAD',
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
      }
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
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    // Validate Discord credentials are configured
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      console.error(
        'Discord credentials missing: CLIENT_ID=',
        !!DISCORD_CLIENT_ID,
        'CLIENT_SECRET=',
        !!DISCORD_CLIENT_SECRET
      )
      return jsonResponse(
        { error: 'Configuration Discord manquante cote serveur (CLIENT_ID ou SECRET)' },
        500,
        origin
      )
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
      const tokenErrorText = await tokenResponse.text()
      console.error('Discord token exchange failed:', tokenResponse.status, tokenErrorText)
      // Parse Discord error for more detail
      let discordError = 'Code OAuth invalide ou expire'
      try {
        const parsed = JSON.parse(tokenErrorText)
        if (parsed.error === 'invalid_grant') {
          discordError = `Code OAuth invalide (redirect_uri envoye: ${body.redirect_uri})`
        } else if (parsed.error === 'invalid_client') {
          discordError = 'Client Discord invalide (CLIENT_ID ou CLIENT_SECRET incorrect)'
        } else if (parsed.error_description) {
          discordError = `Discord: ${parsed.error_description}`
        }
      } catch {
        /* text wasn't JSON */
      }
      return jsonResponse({ error: discordError }, 400, origin)
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
        origin
      )
    }

    // SEC-5: Link Discord to profile with race condition protection
    // If a UNIQUE constraint on discord_user_id exists in DB, this will fail gracefully
    // for concurrent requests trying to link the same Discord account
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        discord_user_id: discordUserId,
        discord_username: discordUsername,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // SEC-5: Check if it's a unique constraint violation (concurrent link)
      if (
        updateError.code === '23505' ||
        updateError.message?.includes('unique') ||
        updateError.message?.includes('duplicate')
      ) {
        return jsonResponse(
          { error: "Ce compte Discord vient d'être lié à un autre profil" },
          409,
          origin
        )
      }
      return jsonResponse({ error: 'Erreur lors de la mise a jour du profil' }, 500, origin)
    }

    return jsonResponse(
      {
        success: true,
        discord_username: discordUsername,
        discord_user_id: discordUserId,
      },
      200,
      origin
    )
  } catch (error) {
    console.error('Discord OAuth error:', error)
    return jsonResponse({ error: (error as Error).message }, 500, origin)
  }
})
