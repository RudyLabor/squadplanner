// Agora Token Generator Edge Function
// Generates RTC tokens for voice chat channels

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Agora token generation using RtcTokenBuilder
// Note: In production, you should use the official Agora token generator
// This is a simplified version for demonstration

const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID') || ''
const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE') || ''

// Role constants
const Role = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
}

// Simple token generation (for development only)
// In production, use the official Agora Access Token library
function generateToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: string,
  role: number,
  privilegeExpiredTs: number
): string {
  // This is a placeholder - in production, use proper token generation
  // The actual implementation requires the agora-access-token npm package
  // which needs to be ported to Deno or use a different approach

  // For development/testing, return empty string (Agora allows this in testing mode)
  if (!appCertificate) {
    return ''
  }

  // In production, implement proper token generation or use Agora's token server
  // See: https://docs.agora.io/en/video-calling/develop/authentication-workflow
  const message = `${appId}${channelName}${uid}${role}${privilegeExpiredTs}`

  // Simplified - actual implementation needs HMAC-SHA256
  const encoder = new TextEncoder()
  const data = encoder.encode(message + appCertificate)

  // Return base64 encoded string (NOT a real token - placeholder only)
  return btoa(String.fromCharCode(...data)).slice(0, 64)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { channel_name, uid } = await req.json()

    if (!channel_name) {
      return new Response(
        JSON.stringify({ error: 'channel_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to this channel (session)
    // Channel format: session-{sessionId}
    if (channel_name.startsWith('session-')) {
      const sessionId = channel_name.replace('session-', '')

      // Check if user is member of the squad that owns this session
      const { data: session } = await supabaseClient
        .from('sessions')
        .select('squad_id')
        .eq('id', sessionId)
        .single()

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: membership } = await supabaseClient
        .from('squad_members')
        .select('id')
        .eq('squad_id', session.squad_id)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return new Response(
          JSON.stringify({ error: 'Not a member of this squad' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate token
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    let token = ''
    if (AGORA_APP_ID && AGORA_APP_CERTIFICATE) {
      token = generateToken(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channel_name,
        uid || user.id,
        Role.PUBLISHER,
        privilegeExpiredTs
      )
    }

    return new Response(
      JSON.stringify({
        token,
        app_id: AGORA_APP_ID,
        channel: channel_name,
        uid: uid || user.id,
        expires_at: new Date(privilegeExpiredTs * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating Agora token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
