// AI Decision Edge Function
// Recommends whether to confirm, cancel, or reschedule a session
// Uses Claude AI (Anthropic) for personalized recommendations with template fallback

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { validateUUID } from '../_shared/schemas.ts'

// CORS Security: Only allow specific origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
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
  }
}

// Configuration pour l'API Claude
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-3-haiku-20240307'
const CLAUDE_TIMEOUT = 10000 // 10 secondes

// Appel a l'API Claude avec timeout
async function callClaudeAPI(prompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT)

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.content?.[0]?.text?.trim() || null
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Claude API timeout')
    } else {
      console.error('Claude API error:', error)
    }
    return null
  }
}

// Genere une recommandation IA pour la decision
async function generateAIDecisionReason(
  sessionTitle: string,
  action: 'confirm' | 'cancel' | 'reschedule' | 'wait',
  presentCount: number,
  absentCount: number,
  maybeCount: number,
  noResponseCount: number,
  totalMembers: number,
  minPlayers: number,
  hoursUntilSession: number
): Promise<string | null> {
  const prompt = `Tu es l'assistant IA de Squad Planner, une app pour coordonner des sessions de jeu entre amis.
Donne une recommandation courte et actionnable pour la session "${sessionTitle}".

Situation actuelle:
- Presents confirmes: ${presentCount}
- Absents: ${absentCount}
- Peut-etre: ${maybeCount}
- Sans reponse: ${noResponseCount}
- Total membres: ${totalMembers}
- Minimum requis: ${minPlayers} joueurs
- Temps restant: ${Math.round(hoursUntilSession)}h avant la session

Action recommandee: ${action === 'confirm' ? 'CONFIRMER' : action === 'cancel' ? 'ANNULER' : action === 'reschedule' ? 'REPORTER' : 'ATTENDRE'}

Regles:
- Explique pourquoi cette action est recommandee
- 2-3 phrases max
- Ton amical et pragmatique
- En francais
- Pas d'emojis
- Donne un conseil concret pour l'organisateur

Reponds UNIQUEMENT avec l'explication, sans guillemets.`

  return await callClaudeAPI(prompt)
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
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  // Handle HEAD requests for health checks
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCorsHeaders(req.headers.get('origin')) })
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

    let session_id: string

    try {
      session_id = validateUUID(rawBody.session_id, 'session_id')
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
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

    // Generate AI-powered reason (enhance the template reason)
    const aiReason = await generateAIDecisionReason(
      session.title || session.game || 'Session',
      recommendation.recommended_action,
      presentCount,
      absentCount,
      maybeCount,
      noResponseCount,
      totalMembers,
      minPlayers,
      hoursUntilSession
    )

    // Use AI reason if available, keep template as fallback
    const finalRecommendation = {
      ...recommendation,
      reason: aiReason || recommendation.reason,
      ai_generated: !!aiReason
    }

    return new Response(
      JSON.stringify({ recommendation: finalRecommendation }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-decision:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
