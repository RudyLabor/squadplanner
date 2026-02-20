// Send Reminders Edge Function
// Sends reminders for upcoming sessions
// Should be called by a cron job every 5-15 minutes

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, x-cron-secret',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret',
  }
}

interface SessionWithRsvps {
  id: string
  title: string
  game: string
  scheduled_at: string
  squad_id: string
  squads: {
    name: string
  }
  session_rsvps: Array<{
    user_id: string
    response: string
    profiles: {
      email: string
      username: string
    }
  }>
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle HEAD requests for health checks
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Security: Verify CRON secret or service role key for CRON jobs
    const cronSecret = Deno.env.get('CRON_SECRET')
    const authHeader = req.headers.get('Authorization')
    const cronHeader = req.headers.get('x-cron-secret')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // SEC-2: Use timing-safe comparison to prevent timing attacks on CRON secret
    function timingSafeCompare(a: string, b: string): boolean {
      if (a.length !== b.length) return false
      const encoder = new TextEncoder()
      const bufA = encoder.encode(a)
      const bufB = encoder.encode(b)
      // crypto.subtle.timingSafeEqual is not available in all Deno versions,
      // so we use a constant-time comparison loop
      let result = 0
      for (let i = 0; i < bufA.length; i++) {
        result |= bufA[i] ^ bufB[i]
      }
      return result === 0
    }

    const isValidCron = cronSecret && cronHeader && timingSafeCompare(cronHeader, cronSecret)
    const isValidServiceRole = authHeader && serviceRoleKey && timingSafeCompare(authHeader.replace('Bearer ', ''), serviceRoleKey)

    if (!isValidCron && !isValidServiceRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid CRON secret or service role key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000)
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000)

    // Find sessions starting in the next 15 minutes (for urgent reminders)
    const { data: urgentSessions, error: urgentError } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        title,
        game,
        scheduled_at,
        squad_id,
        squads (name),
        session_rsvps (
          user_id,
          response,
          profiles (email, username)
        )
      `
      )
      .eq('status', 'confirmed')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', in15Minutes.toISOString())

    if (urgentError) {
      throw urgentError
    }

    // Find sessions starting in the next hour (for 1-hour reminders)
    const { data: upcomingSessions, error: upcomingError } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        title,
        game,
        scheduled_at,
        squad_id,
        squads (name),
        session_rsvps (
          user_id,
          response,
          profiles (email, username)
        )
      `
      )
      .eq('status', 'confirmed')
      .gte('scheduled_at', in15Minutes.toISOString())
      .lte('scheduled_at', in1Hour.toISOString())

    if (upcomingError) {
      throw upcomingError
    }

    const notifications: Array<{
      type: 'urgent' | 'upcoming'
      session_id: string
      user_id: string
      email: string
      username: string
      session_title: string
      squad_name: string
      minutes_until: number
    }> = []

    // Process urgent sessions (15 min reminder)
    for (const session of (urgentSessions || []) as SessionWithRsvps[]) {
      const sessionTime = new Date(session.scheduled_at)
      const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60))

      for (const rsvp of session.session_rsvps || []) {
        if (rsvp.response === 'present' && rsvp.profiles?.email) {
          notifications.push({
            type: 'urgent',
            session_id: session.id,
            user_id: rsvp.user_id,
            email: rsvp.profiles.email,
            username: rsvp.profiles.username || 'Joueur',
            session_title: session.title || session.game || 'Session',
            squad_name: session.squads?.name || 'Squad',
            minutes_until: minutesUntil,
          })
        }
      }
    }

    // Process upcoming sessions (1 hour reminder)
    for (const session of (upcomingSessions || []) as SessionWithRsvps[]) {
      const sessionTime = new Date(session.scheduled_at)
      const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60))

      for (const rsvp of session.session_rsvps || []) {
        if (rsvp.response === 'present' && rsvp.profiles?.email) {
          notifications.push({
            type: 'upcoming',
            session_id: session.id,
            user_id: rsvp.user_id,
            email: rsvp.profiles.email,
            username: rsvp.profiles.username || 'Joueur',
            session_title: session.title || session.game || 'Session',
            squad_name: session.squads?.name || 'Squad',
            minutes_until: minutesUntil,
          })
        }
      }
    }

    // Store notifications in ai_insights table for the app to display
    for (const notif of notifications) {
      await supabaseAdmin.from('ai_insights').upsert(
        {
          id: `reminder-${notif.session_id}-${notif.user_id}-${notif.type}`,
          user_id: notif.user_id,
          session_id: notif.session_id,
          insight_type: notif.type === 'urgent' ? 'session_imminent' : 'session_reminder',
          content: {
            session_title: notif.session_title,
            squad_name: notif.squad_name,
            minutes_until: notif.minutes_until,
            message:
              notif.type === 'urgent'
                ? `${notif.session_title} commence dans ${notif.minutes_until} minutes !`
                : `${notif.session_title} commence dans environ 1 heure`,
          },
          is_dismissed: false,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Expires in 2 hours
        },
        {
          onConflict: 'id',
        }
      )
    }

    // Send Web Push notifications via send-push Edge Function
    const pushResults = { sent: 0, failed: 0 }

    // Group notifications by user to avoid duplicate pushes
    const userNotifications = new Map<string, (typeof notifications)[0]>()
    for (const notif of notifications) {
      // Keep the most urgent notification per user
      const existing = userNotifications.get(notif.user_id)
      if (!existing || notif.type === 'urgent') {
        userNotifications.set(notif.user_id, notif)
      }
    }

    // Send push notifications
    for (const [userId, notif] of userNotifications) {
      try {
        const pushPayload = {
          userId,
          title:
            notif.type === 'urgent'
              ? `${notif.session_title} dans ${notif.minutes_until} min!`
              : `Session dans ~1h`,
          body:
            notif.type === 'urgent'
              ? `Rejoins ${notif.squad_name} maintenant!`
              : `${notif.session_title} avec ${notif.squad_name}`,
          url: `/squads`, // Link to squads page
          tag: `session-${notif.session_id}-${notif.type}`,
        }

        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify(pushPayload),
        })

        if (response.ok) {
          const result = await response.json()
          pushResults.sent += result.sent || 0
          pushResults.failed += result.failed || 0
        } else {
          console.error(`Push failed for user ${userId}:`, await response.text())
          pushResults.failed++
        }
      } catch (error) {
        console.error(`Error sending push to user ${userId}:`, error)
        pushResults.failed++
      }
    }

    // SEC-9: Anonymized logging — only counts, no user details
    console.log(
      `[send-reminders] urgent=${urgentSessions?.length || 0} upcoming=${upcomingSessions?.length || 0} notifs=${notifications.length} push_sent=${pushResults.sent} push_failed=${pushResults.failed}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        urgent_sessions: urgentSessions?.length || 0,
        upcoming_sessions: upcomingSessions?.length || 0,
        notifications_sent: notifications.length,
        push_sent: pushResults.sent,
        push_failed: pushResults.failed,
      }),
      {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    // SEC-7: Don't leak internal error details to clients
    console.error('Error sending reminders:', error)
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
