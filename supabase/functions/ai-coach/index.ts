// AI Coach Edge Function
// Provides personalized coaching tips based on player stats and behavior

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoachTipResponse {
  tip: string
  tone: 'encouragement' | 'warning' | 'celebration'
  context?: {
    reliability_score: number
    trend: 'improving' | 'stable' | 'declining'
    days_since_last_session: number
    recent_noshows: number
    upcoming_sessions: number
  }
}

interface PlayerStats {
  reliability_score: number
  total_sessions: number
  total_checkins: number
  total_late: number
  total_noshow: number
  created_at: string
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

    const { user_id, context_type = 'profile' } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stats: PlayerStats = {
      reliability_score: profile.reliability_score ?? 100,
      total_sessions: profile.total_sessions ?? 0,
      total_checkins: profile.total_checkins ?? 0,
      total_late: profile.total_late ?? 0,
      total_noshow: profile.total_noshow ?? 0,
      created_at: profile.created_at,
    }

    // Get recent check-ins for trend analysis (last 10)
    const { data: recentCheckins } = await supabaseClient
      .from('session_checkins')
      .select('status, checked_at')
      .eq('user_id', user_id)
      .order('checked_at', { ascending: false })
      .limit(10)

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    let recentNoshows = 0

    if (recentCheckins && recentCheckins.length >= 5) {
      const recentHalf = recentCheckins.slice(0, 5)
      const olderHalf = recentCheckins.slice(5)

      recentNoshows = recentHalf.filter(c => c.status === 'noshow').length

      const recentScore = recentHalf.filter(c => c.status === 'present' || c.status === 'late').length / recentHalf.length
      const olderScore = olderHalf.length > 0
        ? olderHalf.filter(c => c.status === 'present' || c.status === 'late').length / olderHalf.length
        : recentScore

      if (recentScore > olderScore + 0.15) trend = 'improving'
      else if (recentScore < olderScore - 0.15) trend = 'declining'
    } else if (recentCheckins) {
      recentNoshows = recentCheckins.filter(c => c.status === 'noshow').length
    }

    // Get last session date
    const { data: lastSession } = await supabaseClient
      .from('session_checkins')
      .select('checked_at')
      .eq('user_id', user_id)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single()

    const daysSinceLastSession = lastSession
      ? Math.floor((Date.now() - new Date(lastSession.checked_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Get upcoming sessions count (for home context)
    let upcomingSessions = 0
    if (context_type === 'home') {
      // Get user's squads
      const { data: memberships } = await supabaseClient
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', user_id)

      if (memberships && memberships.length > 0) {
        const squadIds = memberships.map(m => m.squad_id)
        const now = new Date().toISOString()
        const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const { count } = await supabaseClient
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .in('squad_id', squadIds)
          .gte('scheduled_at', now)
          .lte('scheduled_at', in24h)
          .neq('status', 'cancelled')

        upcomingSessions = count || 0
      }

      // Check for unresponded RSVPs
      const { data: pendingRsvps } = await supabaseClient
        .from('sessions')
        .select(`
          id,
          scheduled_at,
          session_rsvps!inner(user_id, response)
        `)
        .gte('scheduled_at', new Date().toISOString())
        .eq('session_rsvps.user_id', user_id)
        .is('session_rsvps.response', null)
        .limit(5)

      // Home-specific tips
      if (pendingRsvps && pendingRsvps.length > 0) {
        const tip: CoachTipResponse = {
          tip: pendingRsvps.length === 1
            ? "Tu as une session en attente de confirmation - tes potes attendent ta reponse !"
            : `${pendingRsvps.length} sessions attendent ta reponse. Confirme ta presence pour aider l'orga !`,
          tone: 'warning',
          context: {
            reliability_score: stats.reliability_score,
            trend,
            days_since_last_session: daysSinceLastSession,
            recent_noshows: recentNoshows,
            upcoming_sessions: upcomingSessions,
          }
        }
        return new Response(
          JSON.stringify(tip),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Session coming up soon
      if (upcomingSessions > 0) {
        const tip: CoachTipResponse = {
          tip: upcomingSessions === 1
            ? "Session dans moins de 24h - n'oublie pas de te preparer !"
            : `${upcomingSessions} sessions dans les 24h. Ta squad compte sur toi !`,
          tone: 'encouragement',
          context: {
            reliability_score: stats.reliability_score,
            trend,
            days_since_last_session: daysSinceLastSession,
            recent_noshows: recentNoshows,
            upcoming_sessions: upcomingSessions,
          }
        }
        return new Response(
          JSON.stringify(tip),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check for patterns (e.g., late on specific days)
    let patternTip: string | null = null
    if (recentCheckins && recentCheckins.length >= 5) {
      const lateCheckins = recentCheckins.filter(c => c.status === 'late')
      if (lateCheckins.length >= 2) {
        const lateDays = lateCheckins.map(c => new Date(c.checked_at).getDay())
        const dayCount: Record<number, number> = {}
        lateDays.forEach(d => { dayCount[d] = (dayCount[d] || 0) + 1 })

        const problemDay = Object.entries(dayCount).find(([_, count]) => count >= 2)
        if (problemDay) {
          const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
          patternTip = `Tu as tendance a etre en retard le ${dayNames[parseInt(problemDay[0])]}. Prevois un peu plus de marge !`
        }
      }
    }

    // Generate the coaching tip based on all collected data
    const tip = generateCoachTip({
      reliability_score: stats.reliability_score,
      trend,
      recentNoshows,
      daysSinceLastSession,
      totalSessions: stats.total_sessions,
      patternTip,
      contextType: context_type,
    })

    const response: CoachTipResponse = {
      ...tip,
      context: {
        reliability_score: stats.reliability_score,
        trend,
        days_since_last_session: daysSinceLastSession,
        recent_noshows: recentNoshows,
        upcoming_sessions: upcomingSessions,
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-coach:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

interface TipGeneratorInput {
  reliability_score: number
  trend: 'improving' | 'stable' | 'declining'
  recentNoshows: number
  daysSinceLastSession: number
  totalSessions: number
  patternTip: string | null
  contextType: string
}

function generateCoachTip(input: TipGeneratorInput): { tip: string; tone: 'encouragement' | 'warning' | 'celebration' } {
  const { reliability_score, trend, recentNoshows, daysSinceLastSession, totalSessions, patternTip } = input

  // Pattern detected - prioritize this specific insight
  if (patternTip) {
    return { tip: patternTip, tone: 'warning' }
  }

  // Score parfait (>= 95%)
  if (reliability_score >= 95) {
    const celebrations = [
      "Fiabilite au top ! Tes potes peuvent compter sur toi a 100%.",
      "Tu es un pilier de ta squad. Continue comme ca !",
      "Excellent ! Ta fiabilite fait de toi le joueur ideal.",
      "Score parfait ! Tes teammates ont de la chance de t'avoir.",
    ]
    return {
      tip: celebrations[Math.floor(Math.random() * celebrations.length)],
      tone: 'celebration'
    }
  }

  // En forte amelioration
  if (trend === 'improving') {
    const improvementTips = [
      "Belle progression ! Tu remontes dans les classements.",
      "Ca s'ameliore ! Continue sur cette lancee.",
      "Tes efforts payent - ta fiabilite augmente.",
      "Tendance positive ! Tes potes le remarquent.",
    ]
    return {
      tip: improvementTips[Math.floor(Math.random() * improvementTips.length)],
      tone: 'encouragement'
    }
  }

  // No-shows recents - probleme a adresser
  if (recentNoshows > 0) {
    if (recentNoshows === 1) {
      return {
        tip: "1 absence recente. Pas grave, mais essaie de prevenir la prochaine fois !",
        tone: 'warning'
      }
    }
    return {
      tip: `${recentNoshows} absences recentes. Tes potes ont joue sans toi - reviens en force !`,
      tone: 'warning'
    }
  }

  // En baisse
  if (trend === 'declining') {
    return {
      tip: "Ta participation baisse ces derniers temps. On compte sur toi pour la prochaine !",
      tone: 'warning'
    }
  }

  // Pas de session depuis longtemps
  if (daysSinceLastSession > 14) {
    return {
      tip: "Ca fait plus de 2 semaines ! Propose une session a ta squad.",
      tone: 'encouragement'
    }
  }

  if (daysSinceLastSession > 7) {
    return {
      tip: "Ca fait un moment ! Tes potes t'attendent pour la prochaine session.",
      tone: 'encouragement'
    }
  }

  // Nouveau joueur
  if (totalSessions < 3) {
    return {
      tip: "Bienvenue ! Participe a quelques sessions pour construire ta reputation.",
      tone: 'encouragement'
    }
  }

  // Score moyen (50-80)
  if (reliability_score >= 50 && reliability_score < 80) {
    const mediumTips = [
      "Tu es sur la bonne voie ! Reponds rapidement aux invitations.",
      "Score correct. Un peu plus d'engagement et tu seras au top !",
      "Confirme ta presence tot pour aider tes potes a s'organiser.",
    ]
    return {
      tip: mediumTips[Math.floor(Math.random() * mediumTips.length)],
      tone: 'encouragement'
    }
  }

  // Score faible (< 50)
  if (reliability_score < 50) {
    return {
      tip: "Tes potes comptent sur toi ! Reponds plus souvent aux sessions pour ameliorer ta fiabilite.",
      tone: 'warning'
    }
  }

  // Default - bon score stable
  const defaultTips = [
    "Pret pour la prochaine session ? Tes potes t'attendent !",
    "Bonne fiabilite ! Continue a repondre rapidement aux invitations.",
    "Tu reponds plus vite que la moyenne - tes teammates apprecient !",
    "Tout roule ! Garde ce rythme pour ta squad.",
  ]
  return {
    tip: defaultTips[Math.floor(Math.random() * defaultTips.length)],
    tone: 'encouragement'
  }
}
