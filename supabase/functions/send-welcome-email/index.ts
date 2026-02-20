// Send Welcome Email Edge Function
// Sends a beautifully formatted welcome email to new users
// Can be called from a database trigger (on_auth_user_created) or manually
// Endpoint: POST /functions/v1/send-welcome-email
// Body: { userId: string } or { email: string, username: string }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://squadplanner.fr',
  'https://www.squadplanner.fr',
  SUPABASE_URL,
].filter(Boolean)

function getCorsHeaders(origin: string | null) {
  const matchedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed) ? origin : null
  return {
    'Access-Control-Allow-Origin': matchedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function generateWelcomeEmail(username: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Squad Planner</title>
</head>
<body style="margin:0; padding:0; background-color:#050506; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050506;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-flex; align-items:center; gap:8px;">
                <div style="width:40px; height:40px; background:linear-gradient(135deg, #6366f1, #8b5cf6); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                  <span style="font-size:20px;">🎮</span>
                </div>
                <span style="font-size:18px; font-weight:700; color:#f7f8f8; letter-spacing:-0.02em;">Squad Planner</span>
              </div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:40px 32px; text-align:center;">
              <div style="font-size:48px; margin-bottom:16px;">🎉</div>
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:700; color:#f7f8f8;">
                Bienvenue ${username} !
              </h1>
              <p style="margin:0 0 28px; font-size:15px; color:#8b8d90; line-height:1.6;">
                Ta squad t'attend. Fini les "on verra", place aux sessions organisées.
              </p>

              <!-- CTA Button -->
              <a href="https://squadplanner.fr/home"
                 style="display:inline-block; background:#6366f1; color:white; font-size:15px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:12px; letter-spacing:-0.01em;">
                Ouvrir Squad Planner →
              </a>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">

                <!-- Feature 1 -->
                <tr>
                  <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; margin-bottom:8px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width:40px; height:40px; background:rgba(99,102,241,0.08); border-radius:10px; text-align:center; line-height:40px; font-size:18px;">📅</div>
                        </td>
                        <td style="padding-left:12px;">
                          <h3 style="margin:0 0 4px; font-size:14px; font-weight:600; color:#f7f8f8;">Planifie des sessions</h3>
                          <p style="margin:0; font-size:13px; color:#8b8d90; line-height:1.5;">Propose un créneau, ta squad vote. Tout le monde est engagé.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td height="8"></td></tr>

                <!-- Feature 2 -->
                <tr>
                  <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width:40px; height:40px; background:rgba(52,211,153,0.08); border-radius:10px; text-align:center; line-height:40px; font-size:18px;">🎙️</div>
                        </td>
                        <td style="padding-left:12px;">
                          <h3 style="margin:0 0 4px; font-size:14px; font-weight:600; color:#f7f8f8;">Party vocale</h3>
                          <p style="margin:0; font-size:13px; color:#8b8d90; line-height:1.5;">Un salon vocal permanent pour ta squad. Rejoins en un clic.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td height="8"></td></tr>

                <!-- Feature 3 -->
                <tr>
                  <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width:40px; height:40px; background:rgba(251,191,36,0.08); border-radius:10px; text-align:center; line-height:40px; font-size:18px;">🏆</div>
                        </td>
                        <td style="padding-left:12px;">
                          <h3 style="margin:0 0 4px; font-size:14px; font-weight:600; color:#f7f8f8;">Score de fiabilité</h3>
                          <p style="margin:0; font-size:13px; color:#8b8d90; line-height:1.5;">Montre que tu es fiable. Check-in aux sessions, monte ton score.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Tip -->
          <tr>
            <td style="padding-top:24px;">
              <div style="background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.1); border-radius:12px; padding:20px; text-align:center;">
                <p style="margin:0; font-size:13px; color:#a78bfa; line-height:1.6;">
                  💡 <strong>Astuce :</strong> Partage le code d'invitation de ta squad à tes amis pour qu'ils te rejoignent en 10 secondes.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:#5e6063;">
                Squad Planner — L'outil qui transforme "on verra" en "on joue mardi 21h".
              </p>
              <p style="margin:0; font-size:11px; color:#3a3b3e;">
                Tu reçois cet email car tu viens de créer un compte sur Squad Planner.
                <br>
                <a href="https://squadplanner.fr/settings" style="color:#5e6063; text-decoration:underline;">Gérer mes notifications</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // SEC-3: Require service role key OR authenticated user to prevent spam
    const authHeader = req.headers.get('Authorization')
    const isServiceRole = authHeader && SUPABASE_SERVICE_ROLE_KEY &&
      authHeader.replace('Bearer ', '') === SUPABASE_SERVICE_ROLE_KEY

    let authenticatedUserId: string | null = null
    if (!isServiceRole) {
      // Try to authenticate via user JWT
      const authClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: authHeader || '' } },
      })
      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      authenticatedUserId = user.id
    }

    const body = await req.json()
    let email: string
    let username: string

    // SEC-3: If not service role, only allow sending to the authenticated user's own email
    if (!isServiceRole && body.email && !body.userId) {
      return new Response(JSON.stringify({ error: 'Only service role can send to arbitrary emails' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!isServiceRole && body.userId && body.userId !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: 'Cannot send welcome email for another user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.userId) {
      // Fetch user data from Supabase
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', body.userId)
        .single()

      if (profileError || !profile) {
        throw new Error('User profile not found')
      }

      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
        body.userId
      )

      if (authError || !authUser?.user?.email) {
        throw new Error('User email not found')
      }

      email = authUser.user.email
      username = profile.username || 'Joueur'
    } else if (body.email && body.username) {
      email = body.email
      username = body.username
    } else {
      throw new Error('Either userId or (email + username) required')
    }

    // Send email via Resend (or log if no API key)
    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Squad Planner <noreply@squadplanner.fr>',
          to: [email],
          subject: `Bienvenue sur Squad Planner, ${username} ! 🎮`,
          html: generateWelcomeEmail(username),
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('[send-welcome-email] Resend error:', errorText)
        throw new Error(`Email sending failed: ${emailResponse.status}`)
      }

      const result = await emailResponse.json()
      console.log('[send-welcome-email] Email sent successfully:', result.id)

      return new Response(JSON.stringify({ success: true, emailId: result.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // No API key - log the email content for development
      console.log('[send-welcome-email] No RESEND_API_KEY configured. Would send email to:', email)
      console.log('[send-welcome-email] Username:', username)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email logged (no RESEND_API_KEY configured)',
          to: email,
          username,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    // SEC-7: Don't leak internal error details to clients
    console.error('[send-welcome-email] Error:', error)
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
