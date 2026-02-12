// AI Session Summary Edge Function
// Generates a post-session summary with attendance stats and AI-powered insights
// Uses Claude AI (Anthropic) with template fallback

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { validateUUID } from '../_shared/schemas.ts'

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

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const CLAUDE_TIMEOUT = 10000

async function callClaudeAPI(prompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT)

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim()
    return text && text.length > 0 && text.length < 600 ? text : null
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    let rawBody: Record<string, unknown>
    try {
      rawBody = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    const sessionId = validateUUID(rawBody.session_id, 'session_id')

    // Check cache first
    const { data: cached } = await supabaseClient
      .from('ai_insights')
      .select('content')
      .eq('session_id', sessionId)
      .eq('insight_type', 'session_summary')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached?.content) {
      return new Response(JSON.stringify(cached.content), {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    // Fetch session data
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('id, title, game, scheduled_at, duration_minutes, status, squad_id, min_players')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    if (session.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Session not completed yet' }), {
        status: 400,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    // Fetch squad name
    const { data: squad } = await supabaseClient
      .from('squads')
      .select('name, total_members')
      .eq('id', session.squad_id)
      .single()

    // Fetch checkins
    const { data: checkins } = await supabaseClient
      .from('session_checkins')
      .select('user_id, status, minutes_late')
      .eq('session_id', sessionId)

    // Fetch RSVPs
    const { data: rsvps } = await supabaseClient
      .from('session_rsvps')
      .select('user_id, response')
      .eq('session_id', sessionId)

    const presentCount = checkins?.filter((c) => c.status === 'present').length || 0
    const lateCount = checkins?.filter((c) => c.status === 'late').length || 0
    const noshowCount = checkins?.filter((c) => c.status === 'noshow').length || 0
    const totalRsvps = rsvps?.filter((r) => r.response === 'present').length || 0
    const totalCheckins = presentCount + lateCount + noshowCount
    const attendanceRate =
      totalCheckins > 0 ? Math.round(((presentCount + lateCount) / totalCheckins) * 100) : 0

    // Find MVP (present with 0 minutes late)
    let mvpUsername: string | null = null
    const presentCheckins =
      checkins?.filter((c) => c.status === 'present' && (c.minutes_late || 0) === 0) || []
    if (presentCheckins.length > 0) {
      const mvpId = presentCheckins[0].user_id
      const { data: mvpProfile } = await supabaseClient
        .from('profiles')
        .select('username')
        .eq('id', mvpId)
        .single()
      mvpUsername = mvpProfile?.username || null
    }

    const stats = {
      total_rsvps: totalRsvps,
      present_count: presentCount,
      late_count: lateCount,
      noshow_count: noshowCount,
      attendance_rate: attendanceRate,
      mvp_username: mvpUsername,
    }

    // Generate AI summary
    const prompt = `Tu es l'IA de Squad Planner. Genere un resume court (3-4 phrases) de cette session de jeu terminee.

Session: ${session.title || session.game || 'Session gaming'}
Squad: ${squad?.name || 'Squad'}
Jeu: ${session.game || 'Non specifie'}
Date: ${new Date(session.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
Duree: ${session.duration_minutes || 120} minutes

Statistiques:
- Inscrits (RSVP present): ${totalRsvps}
- Presents: ${presentCount}
- En retard: ${lateCount}
- Absents: ${noshowCount}
- Taux de presence: ${attendanceRate}%
${mvpUsername ? `- MVP (a l'heure): ${mvpUsername}` : ''}

Regles:
- Ton amical et gamer
- Réponds toujours en français correct avec tous les accents (é, è, ê, à, ç, ù, etc.), tutoiement
- Pas d'emojis
- Sois factuel et encourageant
- Mentionne le MVP si present
- Si beaucoup d'absents, suggere d'ameliorer la planification

Reponds UNIQUEMENT avec le resume, sans guillemets.`

    const aiSummary = await callClaudeAPI(prompt)

    // Fallback template
    const templateSummary =
      attendanceRate >= 80
        ? `Belle session ! ${presentCount} joueurs presents sur ${totalRsvps} inscrits (${attendanceRate}% de presence).${lateCount > 0 ? ` ${lateCount} retardataire${lateCount > 1 ? 's' : ''}.` : ''}${mvpUsername ? ` ${mvpUsername} etait pile a l'heure, bravo !` : ''} Continuez comme ca.`
        : `Session avec ${presentCount} presents sur ${totalRsvps} inscrits (${attendanceRate}% de presence).${noshowCount > 0 ? ` ${noshowCount} absent${noshowCount > 1 ? 's' : ''} non justifie${noshowCount > 1 ? 's' : ''}.` : ''} Pensez a confirmer vos presences plus tot pour mieux organiser.`

    const result = {
      summary: aiSummary || templateSummary,
      stats,
      ai_generated: !!aiSummary,
    }

    // Cache in ai_insights
    await supabaseClient.from('ai_insights').insert({
      session_id: sessionId,
      squad_id: session.squad_id,
      insight_type: 'session_summary',
      content: result,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in ai-session-summary:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    })
  }
})
