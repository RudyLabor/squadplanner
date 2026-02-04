// AI Decision Edge Function
// Recommends whether to confirm, cancel, or reschedule a session

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DecisionRecommendation {
  recommended_action: 'confirm' | 'cancel' | 'reschedule' | 'wait'
  confidence: number
  reason: string
  details: {
    present_count: number
    absent_count: number
    maybe_count: number
    no_response_count: number
    total_members: number
    min_players: number
    response_rate: number
    time_until_session: number // hours
  }
  alternative_slots?: Array<{
    day_of_week: number
    hour: number
    reliability_score: number
  }>
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

    const { session_id } = await req.json()

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get session details
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('*, squads(total_members)')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found')
    }

    // Get RSVPs
    const { data: rsvps } = await supabaseClient
      .from('session_rsvps')
      .select('response, user_id')
      .eq('session_id', session_id)

    const presentCount = rsvps?.filter(r => r.response === 'present').length || 0
    const absentCount = rsvps?.filter(r => r.response === 'absent').length || 0
    const maybeCount = rsvps?.filter(r => r.response === 'maybe').length || 0
    const totalMembers = session.squads?.total_members || 1
    const noResponseCount = totalMembers - (presentCount + absentCount + maybeCount)
    const responseRate = ((presentCount + absentCount + maybeCount) / totalMembers) * 100
    const minPlayers = session.min_players || 2

    // Calculate time until session
    const sessionTime = new Date(session.scheduled_at)
    const now = new Date()
    const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Decision logic
    let recommendation: DecisionRecommendation

    const details = {
      present_count: presentCount,
      absent_count: absentCount,
      maybe_count: maybeCount,
      no_response_count: noResponseCount,
      total_members: totalMembers,
      min_players: minPlayers,
      response_rate: Math.round(responseRate),
      time_until_session: Math.round(hoursUntilSession)
    }

    // Logic based on multiple factors
    if (session.status === 'confirmed') {
      recommendation = {
        recommended_action: 'confirm',
        confidence: 100,
        reason: 'La session est déjà confirmée.',
        details
      }
    } else if (session.status === 'cancelled') {
      recommendation = {
        recommended_action: 'cancel',
        confidence: 100,
        reason: 'La session a été annulée.',
        details
      }
    } else if (presentCount >= minPlayers && responseRate >= 70) {
      // Good to confirm
      recommendation = {
        recommended_action: 'confirm',
        confidence: Math.min(95, 60 + presentCount * 8),
        reason: `${presentCount} joueurs confirmés (minimum: ${minPlayers}). ${Math.round(responseRate)}% ont répondu. C'est le moment de confirmer !`,
        details
      }
    } else if (absentCount > totalMembers * 0.5) {
      // Too many absences
      recommendation = {
        recommended_action: 'cancel',
        confidence: 85,
        reason: `${absentCount} membres sur ${totalMembers} ont décliné. Mieux vaut reporter à un autre créneau.`,
        details
      }
    } else if (hoursUntilSession < 24 && presentCount < minPlayers) {
      // Less than 24h and not enough players
      recommendation = {
        recommended_action: 'reschedule',
        confidence: 80,
        reason: `Moins de 24h avant la session et seulement ${presentCount} confirmé(s). Proposez un nouveau créneau.`,
        details
      }
    } else if (maybeCount > presentCount && hoursUntilSession < 48) {
      // Too much uncertainty close to session
      recommendation = {
        recommended_action: 'reschedule',
        confidence: 70,
        reason: `${maybeCount} "peut-être" vs ${presentCount} confirmés. Trop d'incertitude, un rappel ou un autre créneau aiderait.`,
        details
      }
    } else if (responseRate < 50 && hoursUntilSession > 48) {
      // Low response rate but still time
      recommendation = {
        recommended_action: 'wait',
        confidence: 60,
        reason: `Seulement ${Math.round(responseRate)}% ont répondu. Envoyez un rappel et attendez plus de réponses.`,
        details
      }
    } else if (presentCount >= minPlayers) {
      // Minimum reached
      recommendation = {
        recommended_action: 'confirm',
        confidence: 70,
        reason: `Le minimum de ${minPlayers} joueurs est atteint. Vous pouvez confirmer.`,
        details
      }
    } else {
      // Default: wait for more responses
      recommendation = {
        recommended_action: 'wait',
        confidence: 50,
        reason: `${presentCount}/${minPlayers} joueurs confirmés. Attendez plus de réponses ou relancez les membres.`,
        details
      }
    }

    // If recommending reschedule, suggest alternative slots
    if (recommendation.recommended_action === 'reschedule') {
      const { data: bestSlots } = await supabaseClient.rpc('get_best_slots', {
        p_squad_id: session.squad_id,
        p_limit: 3
      })

      if (bestSlots && bestSlots.length > 0) {
        recommendation.alternative_slots = bestSlots.map((slot: { day_of_week: number; hour: number; avg_attendance: number }) => ({
          day_of_week: slot.day_of_week,
          hour: slot.hour,
          reliability_score: Math.round(slot.avg_attendance)
        }))
      }
    }

    return new Response(
      JSON.stringify({ recommendation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-decision:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
