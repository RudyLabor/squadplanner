// AI Reliability Edge Function
// Calculates and analyzes player reliability scores

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlayerReliability {
  user_id: string
  username: string
  avatar_url: string | null
  reliability_score: number
  trend: 'improving' | 'stable' | 'declining'
  stats: {
    total_sessions: number
    present_count: number
    late_count: number
    noshow_count: number
    maybe_to_present_rate: number // % of maybes that showed up
  }
  badges: string[]
  warning: string | null
}

interface SquadReliabilityReport {
  squad_id: string
  squad_name: string
  avg_reliability: number
  total_sessions: number
  players: PlayerReliability[]
  insights: string[]
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

    const { squad_id, user_id } = await req.json()

    // If user_id provided, return individual stats
    if (user_id) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single()

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get recent checkins for trend analysis
      const { data: recentCheckins } = await supabaseClient
        .from('session_checkins')
        .select('status, checked_at')
        .eq('user_id', user_id)
        .order('checked_at', { ascending: false })
        .limit(10)

      // Calculate trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      if (recentCheckins && recentCheckins.length >= 5) {
        const recentHalf = recentCheckins.slice(0, 5)
        const olderHalf = recentCheckins.slice(5)

        const recentScore = recentHalf.filter(c => c.status === 'present').length / recentHalf.length
        const olderScore = olderHalf.length > 0
          ? olderHalf.filter(c => c.status === 'present').length / olderHalf.length
          : recentScore

        if (recentScore > olderScore + 0.1) trend = 'improving'
        else if (recentScore < olderScore - 0.1) trend = 'declining'
      }

      // Generate badges
      const badges: string[] = []
      if (profile.reliability_score >= 95) badges.push('star_player')
      if (profile.total_sessions >= 50) badges.push('veteran')
      if (profile.total_noshow === 0 && profile.total_sessions >= 10) badges.push('always_there')
      if (profile.total_checkins >= 20 && profile.total_late === 0) badges.push('punctual')

      const playerStats: PlayerReliability = {
        user_id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        reliability_score: profile.reliability_score,
        trend,
        stats: {
          total_sessions: profile.total_sessions,
          present_count: profile.total_checkins,
          late_count: profile.total_late,
          noshow_count: profile.total_noshow,
          maybe_to_present_rate: 0 // Would need more complex calculation
        },
        badges,
        warning: profile.reliability_score < 50 ? 'Score de fiabilité bas' : null
      }

      return new Response(
        JSON.stringify({ player: playerStats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Squad-wide analysis
    if (!squad_id) {
      return new Response(
        JSON.stringify({ error: 'squad_id or user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get squad info
    const { data: squad } = await supabaseClient
      .from('squads')
      .select('id, name, total_sessions')
      .eq('id', squad_id)
      .single()

    if (!squad) {
      return new Response(
        JSON.stringify({ error: 'Squad not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all members with profiles
    const { data: members } = await supabaseClient
      .from('squad_members')
      .select('user_id, profiles(*)')
      .eq('squad_id', squad_id)

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No members found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each member
    const players: PlayerReliability[] = []
    let totalReliability = 0

    for (const member of members) {
      const profile = member.profiles as {
        id: string
        username: string
        avatar_url: string | null
        reliability_score: number
        total_sessions: number
        total_checkins: number
        total_late: number
        total_noshow: number
      }

      if (!profile) continue

      // Get recent checkins for trend
      const { data: recentCheckins } = await supabaseClient
        .from('session_checkins')
        .select('status')
        .eq('user_id', member.user_id)
        .order('checked_at', { ascending: false })
        .limit(5)

      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      if (recentCheckins && recentCheckins.length >= 3) {
        const presentRatio = recentCheckins.filter(c => c.status === 'present').length / recentCheckins.length
        if (presentRatio >= 0.8) trend = 'improving'
        else if (presentRatio <= 0.4) trend = 'declining'
      }

      // Generate badges
      const badges: string[] = []
      if (profile.reliability_score >= 95) badges.push('star_player')
      if (profile.total_sessions >= 50) badges.push('veteran')
      if (profile.total_noshow === 0 && profile.total_sessions >= 10) badges.push('always_there')

      // Check for warnings
      let warning: string | null = null
      if (profile.reliability_score < 50) {
        warning = 'Fiabilité critique'
      } else if (profile.total_noshow > profile.total_sessions * 0.3) {
        warning = 'Taux de no-show élevé'
      } else if (trend === 'declining') {
        warning = 'Engagement en baisse'
      }

      players.push({
        user_id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        reliability_score: profile.reliability_score,
        trend,
        stats: {
          total_sessions: profile.total_sessions,
          present_count: profile.total_checkins,
          late_count: profile.total_late,
          noshow_count: profile.total_noshow,
          maybe_to_present_rate: 0
        },
        badges,
        warning
      })

      totalReliability += profile.reliability_score
    }

    // Sort by reliability
    players.sort((a, b) => b.reliability_score - a.reliability_score)

    // Generate squad insights
    const insights: string[] = []
    const avgReliability = Math.round(totalReliability / players.length)

    if (avgReliability >= 85) {
      insights.push('Excellente squad ! Continuez comme ça.')
    } else if (avgReliability >= 70) {
      insights.push('Bonne fiabilité globale, quelques améliorations possibles.')
    } else {
      insights.push('La fiabilité de la squad pourrait être améliorée.')
    }

    const lowReliabilityCount = players.filter(p => p.reliability_score < 60).length
    if (lowReliabilityCount > 0) {
      insights.push(`${lowReliabilityCount} membre(s) avec un score faible.`)
    }

    const decliningCount = players.filter(p => p.trend === 'declining').length
    if (decliningCount > 0) {
      insights.push(`${decliningCount} membre(s) avec un engagement en baisse.`)
    }

    const report: SquadReliabilityReport = {
      squad_id: squad.id,
      squad_name: squad.name,
      avg_reliability: avgReliability,
      total_sessions: squad.total_sessions,
      players,
      insights
    }

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-reliability:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
