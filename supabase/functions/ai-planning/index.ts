// AI Planning Edge Function
// Suggests optimal time slots based on squad history
// Uses Claude AI (Anthropic) for personalized explanations with template fallback

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import {
  validateUUID,
  validateNumber,
  validateOptional,
} from '../_shared/schemas.ts'

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
        max_tokens: 400,
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

// Genere une analyse IA des creneaux
async function generateAIPlanningAnalysis(
  squadName: string,
  topSlots: Array<{ day: string; hour: number; score: number; sessions: number }>,
  totalSessionsAnalyzed: number
): Promise<string | null> {
  if (topSlots.length === 0) return null

  const slotsDescription = topSlots.map(s =>
    `${s.day} ${s.hour}h (${s.score}% de presence, ${s.sessions} sessions)`
  ).join(', ')

  const prompt = `Tu es l'assistant IA de Squad Planner, une app pour coordonner des sessions de jeu entre amis.
Analyse les creneaux horaires les plus fiables pour la squad "${squadName}" et explique brievement pourquoi.

Donnees analysees : ${totalSessionsAnalyzed} sessions passees

Meilleurs creneaux identifies :
${slotsDescription}

Regles:
- Donne une analyse courte et utile (2-3 phrases max)
- Ton amical et gamer
- En francais
- Pas d'emojis
- Sois specifique sur les tendances observees

Reponds UNIQUEMENT avec l'analyse, sans guillemets ni explications.`

  return await callClaudeAPI(prompt)
}

interface SlotAnalysis {
  day_of_week: number
  hour: number
  reliability_score: number
  session_count: number
  avg_attendance: number
  reason: string
}

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
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

    let validatedData: {
      squad_id: string
      limit: number
    }

    try {
      validatedData = {
        squad_id: validateUUID(rawBody.squad_id, 'squad_id'),
        limit: validateOptional(rawBody.limit, (v) => validateNumber(v, 'limit', { min: 1, max: 20 })) || 5,
      }
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const { squad_id, limit } = validatedData

    // Get completed sessions with check-ins
    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('sessions')
      .select(`
        id,
        scheduled_at,
        session_checkins (
          status
        )
      `)
      .eq('squad_id', squad_id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(50)

    if (sessionsError) {
      throw sessionsError
    }

    // Analyze slots
    const slotStats: Record<string, {
      present: number
      late: number
      noshow: number
      total: number
      sessions: number
    }> = {}

    for (const session of sessions || []) {
      const date = new Date(session.scheduled_at)
      const dayOfWeek = date.getUTCDay()
      const hour = date.getUTCHours()
      const key = `${dayOfWeek}-${hour}`

      if (!slotStats[key]) {
        slotStats[key] = { present: 0, late: 0, noshow: 0, total: 0, sessions: 0 }
      }

      slotStats[key].sessions++

      for (const checkin of session.session_checkins || []) {
        slotStats[key].total++
        if (checkin.status === 'present') slotStats[key].present++
        else if (checkin.status === 'late') slotStats[key].late++
        else slotStats[key].noshow++
      }
    }

    // Calculate reliability scores and create suggestions
    const suggestions: SlotAnalysis[] = []

    for (const [key, stats] of Object.entries(slotStats)) {
      const [dayStr, hourStr] = key.split('-')
      const dayOfWeek = parseInt(dayStr)
      const hour = parseInt(hourStr)

      if (stats.total === 0) continue

      const attendanceRate = ((stats.present + stats.late * 0.8) / stats.total) * 100
      const reliabilityScore = Math.round(attendanceRate)

      let reason = `${dayNames[dayOfWeek]} ${hour}h`
      if (reliabilityScore >= 90) {
        reason += ' - Excellent taux de présence'
      } else if (reliabilityScore >= 75) {
        reason += ' - Bon créneau historique'
      } else if (reliabilityScore >= 50) {
        reason += ' - Créneau moyen'
      } else {
        reason += ' - Créneau risqué'
      }

      suggestions.push({
        day_of_week: dayOfWeek,
        hour,
        reliability_score: reliabilityScore,
        session_count: stats.sessions,
        avg_attendance: reliabilityScore,
        reason
      })
    }

    // Sort by reliability and limit
    suggestions.sort((a, b) => b.reliability_score - a.reliability_score)
    const topSuggestions = suggestions.slice(0, limit)

    // If no history, suggest default good slots
    if (topSuggestions.length === 0) {
      const defaultSlots: SlotAnalysis[] = [
        { day_of_week: 6, hour: 20, reliability_score: 80, session_count: 0, avg_attendance: 80, reason: 'Samedi 20h - Créneau populaire le week-end' },
        { day_of_week: 0, hour: 15, reliability_score: 75, session_count: 0, avg_attendance: 75, reason: 'Dimanche 15h - Après-midi détente' },
        { day_of_week: 5, hour: 21, reliability_score: 70, session_count: 0, avg_attendance: 70, reason: 'Vendredi 21h - Début de week-end' },
      ]
      return new Response(
        JSON.stringify({
          suggestions: defaultSlots,
          has_history: false,
          ai_analysis: 'Pas encore de donnees pour cette squad. Voici des creneaux populaires parmi les gamers !',
          ai_generated: false
        }),
        { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    // Get squad name for AI analysis
    const { data: squad } = await supabaseClient
      .from('squads')
      .select('name')
      .eq('id', squad_id)
      .single()

    // Generate AI analysis of the slots
    const topSlotsForAI = topSuggestions.slice(0, 3).map(s => ({
      day: dayNames[s.day_of_week],
      hour: s.hour,
      score: s.reliability_score,
      sessions: s.session_count
    }))

    const aiAnalysis = await generateAIPlanningAnalysis(
      squad?.name || 'ta squad',
      topSlotsForAI,
      sessions?.length || 0
    )

    return new Response(
      JSON.stringify({
        suggestions: topSuggestions,
        has_history: true,
        ai_analysis: aiAnalysis || `Basé sur ${sessions?.length || 0} sessions, les creneaux ci-dessus sont les plus fiables pour ta squad.`,
        ai_generated: !!aiAnalysis
      }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-planning:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  }
})
