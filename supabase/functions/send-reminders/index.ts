// Send Reminders Edge Function
// Sends reminders for upcoming sessions
// Should be called by a cron job every 5-15 minutes

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
      .select(`
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
      `)
      .eq('status', 'confirmed')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', in15Minutes.toISOString())

    if (urgentError) {
      throw urgentError
    }

    // Find sessions starting in the next hour (for 1-hour reminders)
    const { data: upcomingSessions, error: upcomingError } = await supabaseAdmin
      .from('sessions')
      .select(`
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
      `)
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
    // In production, you would also send emails/push notifications here
    for (const notif of notifications) {
      await supabaseAdmin.from('ai_insights').upsert({
        id: `reminder-${notif.session_id}-${notif.user_id}-${notif.type}`,
        user_id: notif.user_id,
        session_id: notif.session_id,
        insight_type: notif.type === 'urgent' ? 'session_imminent' : 'session_reminder',
        content: {
          session_title: notif.session_title,
          squad_name: notif.squad_name,
          minutes_until: notif.minutes_until,
          message: notif.type === 'urgent'
            ? `${notif.session_title} commence dans ${notif.minutes_until} minutes !`
            : `${notif.session_title} commence dans environ 1 heure`,
        },
        is_dismissed: false,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Expires in 2 hours
      }, {
        onConflict: 'id',
      })
    }

    // Log results
    console.log(`Processed ${urgentSessions?.length || 0} urgent sessions, ${upcomingSessions?.length || 0} upcoming sessions`)
    console.log(`Created ${notifications.length} notifications`)

    return new Response(
      JSON.stringify({
        success: true,
        urgent_sessions: urgentSessions?.length || 0,
        upcoming_sessions: upcomingSessions?.length || 0,
        notifications_sent: notifications.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
