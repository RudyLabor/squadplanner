// AI Planning Edge Function
// Suggests optimal time slots based on squad history

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { squad_id, limit = 5 } = await req.json()

    if (!squad_id) {
      return new Response(
        JSON.stringify({ error: 'squad_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        JSON.stringify({ suggestions: defaultSlots, has_history: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ suggestions: topSuggestions, has_history: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-planning:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
