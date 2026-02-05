// AI Coach Edge Function
// Provides personalized coaching tips based on player stats and behavior
// Uses Claude AI (Anthropic) for personalized messages with template fallback

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import {
  validateString,
  validateUUID,
  validateOptional,
  validateEnum,
} from '../_shared/schemas.ts'

// CORS Security: Only allow specific origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
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
    console.log('ANTHROPIC_API_KEY non configuree, utilisation du fallback')
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
      console.error(`Claude API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    const aiMessage = data.content?.[0]?.text?.trim()

    if (aiMessage && aiMessage.length > 0 && aiMessage.length < 500) {
      return aiMessage
    }

    return null
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Claude API timeout apres 10 secondes')
    } else {
      console.error('Claude API error:', error)
    }
    return null
  }
}

// Genere un conseil personnalise avec Claude
async function generateAICoachTip(
  username: string,
  reliabilityScore: number,
  totalSessions: number,
  totalCheckins: number,
  trend: string,
  recentNoshows: number,
  daysSinceLastSession: number
): Promise<string | null> {
  const prompt = `Tu es le coach IA de Squad Planner, une app pour coordonner des sessions de jeu entre amis.
Genere un conseil personnalise et motivant pour ${username}.

Statistiques du joueur:
- Score de fiabilite : ${reliabilityScore}%
- Sessions jouees : ${totalSessions}
- Presences : ${totalCheckins}
- Tendance : ${trend === 'improving' ? 'en amelioration' : trend === 'declining' ? 'en baisse' : 'stable'}
- Absences recentes : ${recentNoshows}
- Jours depuis derniere session : ${daysSinceLastSession}

Regles:
- Ton amical et gamer
- 2-3 phrases maximum
- En francais
- Pas d'emojis
- Tutoiement
- Sois specifique selon les stats (felicite si bon score, encourage si en baisse)

Reponds UNIQUEMENT avec le conseil, sans guillemets ni explications.`

  return await callClaudeAPI(prompt)
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
      user_id: string
      context_type: 'profile' | 'home' | 'session'
    }

    try {
      validatedData = {
        user_id: validateUUID(rawBody.user_id, 'user_id'),
        context_type: validateOptional(rawBody.context_type, (v) =>
          validateEnum(v, 'context_type', ['profile', 'home', 'session'])
        ) || 'profile',
      }
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
      )
    }

    const { user_id, context_type } = validatedData

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
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
          { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
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
          { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
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

        const problemDay = Object.entries(dayCount).find(([, count]) => count >= 2)
        if (problemDay) {
          const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
          patternTip = `Tu as tendance a etre en retard le ${dayNames[parseInt(problemDay[0])]}. Prevois un peu plus de marge !`
        }
      }
    }

    // Check cache first (ai_insights table)
    const cacheExpiry = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6h cache

    const { data: cachedInsight } = await supabaseClient
      .from('ai_insights')
      .select('content')
      .eq('user_id', user_id)
      .eq('insight_type', 'coach_tip')
      .gte('created_at', cacheExpiry)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let aiTip: string | null = null
    let aiGenerated = false

    // Si pas de cache, essayer Claude
    if (!cachedInsight) {
      aiTip = await generateAICoachTip(
        profile.username || 'Joueur',
        stats.reliability_score,
        stats.total_sessions,
        stats.total_checkins,
        trend,
        recentNoshows,
        daysSinceLastSession
      )

      if (aiTip) {
        aiGenerated = true
        // Cache the AI response
        await supabaseClient
          .from('ai_insights')
          .insert({
            user_id: user_id,
            insight_type: 'coach_tip',
            content: {
              tip: aiTip,
              context_type: context_type,
              generated_by: 'claude',
              reliability_score: stats.reliability_score,
              trend
            },
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
      }
    } else {
      // Use cached response
      aiTip = cachedInsight.content?.tip || null
      aiGenerated = cachedInsight.content?.generated_by === 'claude'
    }

    // Fallback: Generate template-based tip
    const templateTip = generateCoachTip({
      reliability_score: stats.reliability_score,
      trend,
      recentNoshows,
      daysSinceLastSession,
      totalSessions: stats.total_sessions,
      patternTip,
      contextType: context_type,
    })

    // Use AI tip if available, otherwise template
    const finalTip = aiTip || templateTip.tip
    const finalTone = templateTip.tone // Keep template tone for UI logic

    const response: CoachTipResponse = {
      tip: finalTip,
      tone: finalTone,
      context: {
        reliability_score: stats.reliability_score,
        trend,
        days_since_last_session: daysSinceLastSession,
        recent_noshows: recentNoshows,
        upcoming_sessions: upcomingSessions,
      }
    }

    return new Response(
      JSON.stringify({ ...response, ai_generated: aiGenerated }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-coach:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
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
