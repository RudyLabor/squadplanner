// AI RSVP Reminder Edge Function
// Sends personalized AI-generated reminders to non-responders for upcoming sessions
// Should be called by a cron job every hour or manually triggered
// Uses Claude AI (Anthropic) with fallback to templates

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  }
}

// Configuration pour l'API Claude
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-3-haiku-20240307'
const CLAUDE_TIMEOUT = 10000 // 10 secondes

interface SessionWithDetails {
  id: string
  title: string | null
  game: string | null
  scheduled_at: string
  squad_id: string
  created_by: string
  squads: {
    id: string
    name: string
    owner_id: string
  }
}

interface SquadMember {
  user_id: string
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  }
}

interface RsvpRecord {
  user_id: string
  response: string
}

// Appel a l'API Claude avec timeout
async function callClaudeAPI(prompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    console.log('ANTHROPIC_API_KEY non configuree')
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
        max_tokens: 200,
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

// Génère un message de relance personnalisé avec l'IA
async function generateAIReminderMessage(
  nonResponders: string[],
  sessionTitle: string,
  gameName: string | null,
  scheduledAt: Date,
  squadName: string
): Promise<{ message: string; ai_generated: boolean }> {
  // Formater l'heure de la session
  const sessionTime = scheduledAt.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  })

  // Créer les mentions @username
  const mentions = nonResponders.map(name => `@${name}`).join(', ')

  // Templates de messages variés pour éviter la répétition (fallback)
  const templates = [
    `Hey ${mentions} ! La session ${gameName || sessionTitle} de ${sessionTime} n'attend plus que vous ! On compte sur votre reponse pour confirmer l'equipe. Qui est chaud ?`,
    `${mentions} - Petit rappel amical ! La session ${sessionTitle || gameName} approche (${sessionTime}). Confirmez votre presence pour aider l'orga !`,
    `Yo ${mentions} ! On vous attend pour ${gameName || sessionTitle} le ${sessionTime}. Dites-nous si vous etes la, ca aide a s'organiser !`,
    `${mentions}, la squad ${squadName} a besoin de savoir ! Session ${sessionTitle || gameName} prevue ${sessionTime}. Present, absent ou peut-etre ?`,
    `Rappel ${squadName} ! ${mentions}, on attend votre reponse pour la session ${gameName || sessionTitle} de ${sessionTime}. L'equipe compte sur vous !`,
  ]

  // 1. Essayer Claude (Anthropic) en priorite
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (anthropicKey) {
    const prompt = `Tu es l'assistant IA de Squad Planner, une app de gaming pour coordonner des sessions entre amis.
Genere un message de relance fun et engageant pour rappeler aux joueurs de repondre a la session.

Session : ${sessionTitle || gameName || 'Session gaming'}
Jeu : ${gameName || 'non specifie'}
Date : ${sessionTime}
Squad : ${squadName}
Non-repondants : ${mentions}

Regles:
- Mentionne les joueurs avec @
- Ton amical, pas culpabilisant
- 1-2 phrases maximum
- En francais
- Avec 1-2 emojis gaming appropries
- Tutoiement

Reponds UNIQUEMENT avec le message, sans guillemets ni explications.`

    const aiMessage = await callClaudeAPI(prompt)
    if (aiMessage) {
      return { message: aiMessage, ai_generated: true }
    }
  }

  // 2. Fallback: Gemini
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (geminiKey) {
    try {
      const prompt = `Tu es l'assistant IA de Squad Planner, une app de gaming. Génère un message de relance court et fun (max 200 caractères) en français pour rappeler aux joueurs suivants de répondre à l'invitation : ${mentions}.

Session: ${sessionTitle || gameName || 'Session gaming'}
Jeu: ${gameName || 'non spécifié'}
Date: ${sessionTime}
Squad: ${squadName}

Le message doit:
- Mentionner les joueurs avec @
- Être amical et motivant
- Utiliser le tutoiement
- Avec 1-2 emojis
- Encourager une réponse rapide

Réponds UNIQUEMENT avec le message, sans guillemets ni explications.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 150,
            }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (aiMessage && aiMessage.length > 0 && aiMessage.length < 500) {
          return { message: aiMessage, ai_generated: true }
        }
      }
    } catch (error) {
      console.error('Gemini API error:', error)
    }
  }

  // 3. Fallback: OpenAI
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'Tu es l\'assistant IA de Squad Planner, une app de gaming. Génère des messages de relance courts et fun en français.'
          }, {
            role: 'user',
            content: `Génère un message de relance (max 200 caractères) pour rappeler à ${mentions} de répondre à la session "${sessionTitle || gameName}" de ${sessionTime} pour la squad ${squadName}. Sois amical, utilise le tutoiement, avec 1-2 emojis. Réponds uniquement avec le message.`
          }],
          max_tokens: 100,
          temperature: 0.8
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage = data.choices?.[0]?.message?.content?.trim()
        if (aiMessage && aiMessage.length > 0 && aiMessage.length < 500) {
          return { message: aiMessage, ai_generated: true }
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  // 4. Fallback final: utiliser un template aleatoire
  const randomIndex = Math.floor(Math.random() * templates.length)
  return { message: templates[randomIndex], ai_generated: false }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Security: Verify CRON secret or service role key for CRON jobs
    const cronSecret = Deno.env.get('CRON_SECRET')
    const authHeader = req.headers.get('Authorization')
    const cronHeader = req.headers.get('x-cron-secret')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const isValidCron = cronSecret && cronHeader === cronSecret
    const isValidServiceRole = authHeader && authHeader.replace('Bearer ', '') === serviceRoleKey

    if (!isValidCron && !isValidServiceRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid CRON secret or service role key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for full access (cron job context)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Optionally accept a specific squad_id or session_id for manual trigger
    let targetSquadId: string | null = null
    let targetSessionId: string | null = null

    try {
      const body = await req.json()
      targetSquadId = body.squad_id || null
      targetSessionId = body.session_id || null
    } catch {
      // No body, process all
    }

    // Find sessions in the next 24 hours that are pending or confirmed
    let sessionsQuery = supabaseAdmin
      .from('sessions')
      .select(`
        id,
        title,
        game,
        scheduled_at,
        squad_id,
        created_by,
        squads (
          id,
          name,
          owner_id
        )
      `)
      .in('status', ['pending', 'proposed', 'confirmed'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', in24Hours.toISOString())
      .order('scheduled_at', { ascending: true })

    if (targetSquadId) {
      sessionsQuery = sessionsQuery.eq('squad_id', targetSquadId)
    }
    if (targetSessionId) {
      sessionsQuery = sessionsQuery.eq('id', targetSessionId)
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery

    if (sessionsError) {
      throw sessionsError
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucune session dans les 24h',
          sessions_processed: 0,
          reminders_sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: Array<{
      session_id: string
      session_title: string
      squad_name: string
      non_responders: string[]
      reminder_sent: boolean
      skipped_reason?: string
    }> = []

    for (const session of sessions as SessionWithDetails[]) {
      const squadId = session.squad_id
      const squadName = session.squads?.name || 'Squad'

      // Check if we already sent a reminder for this session today (anti-spam)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data: existingReminder } = await supabaseAdmin
        .from('ai_insights')
        .select('id')
        .eq('session_id', session.id)
        .eq('insight_type', 'rsvp_reminder')
        .gte('created_at', todayStart.toISOString())
        .limit(1)
        .single()

      if (existingReminder) {
        results.push({
          session_id: session.id,
          session_title: session.title || session.game || 'Session',
          squad_name: squadName,
          non_responders: [],
          reminder_sent: false,
          skipped_reason: 'Rappel deja envoye aujourd\'hui'
        })
        continue
      }

      // Get all squad members
      const { data: members } = await supabaseAdmin
        .from('squad_members')
        .select(`
          user_id,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('squad_id', squadId)

      if (!members || members.length === 0) {
        results.push({
          session_id: session.id,
          session_title: session.title || session.game || 'Session',
          squad_name: squadName,
          non_responders: [],
          reminder_sent: false,
          skipped_reason: 'Aucun membre dans la squad'
        })
        continue
      }

      // Get existing RSVPs for this session
      const { data: rsvps } = await supabaseAdmin
        .from('session_rsvps')
        .select('user_id, response')
        .eq('session_id', session.id)

      const respondedUserIds = new Set((rsvps || []).map((r: RsvpRecord) => r.user_id))

      // Find non-responders
      const nonResponders = (members as SquadMember[])
        .filter(m => !respondedUserIds.has(m.user_id))
        .map(m => m.profiles?.username || 'Joueur')
        .filter(name => name !== 'Joueur') // Exclude users without username

      if (nonResponders.length === 0) {
        results.push({
          session_id: session.id,
          session_title: session.title || session.game || 'Session',
          squad_name: squadName,
          non_responders: [],
          reminder_sent: false,
          skipped_reason: 'Tout le monde a repondu'
        })
        continue
      }

      // Generate AI reminder message
      const { message: reminderMessage, ai_generated } = await generateAIReminderMessage(
        nonResponders,
        session.title || 'Session',
        session.game,
        new Date(session.scheduled_at),
        squadName
      )

      console.log(`Message genere (AI: ${ai_generated}):`, reminderMessage)

      // Get the squad owner to send the message as (system message needs a sender)
      const senderId = session.squads?.owner_id || session.created_by

      // Insert the reminder as a system message in the squad chat
      const { error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          squad_id: squadId,
          session_id: session.id,
          sender_id: senderId,
          content: reminderMessage,
          is_system_message: true,
          is_ai_suggestion: true,
          read_by: []
        })

      if (messageError) {
        console.error('Error inserting reminder message:', messageError)
        results.push({
          session_id: session.id,
          session_title: session.title || session.game || 'Session',
          squad_name: squadName,
          non_responders: nonResponders,
          reminder_sent: false,
          skipped_reason: `Erreur d'insertion: ${messageError.message}`
        })
        continue
      }

      // Track that we sent a reminder (anti-spam)
      await supabaseAdmin
        .from('ai_insights')
        .insert({
          squad_id: squadId,
          session_id: session.id,
          insight_type: 'rsvp_reminder',
          content: {
            non_responders: nonResponders,
            message_sent: reminderMessage,
            sent_at: now.toISOString(),
            generated_by: ai_generated ? 'claude' : 'template'
          },
          is_dismissed: false,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // Expire in 48h
        })

      // Optionally send push notifications to non-responders
      const nonResponderMembers = (members as SquadMember[])
        .filter(m => !respondedUserIds.has(m.user_id))

      for (const member of nonResponderMembers) {
        try {
          const sessionTime = new Date(session.scheduled_at)
          const hoursUntil = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60))

          await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                userId: member.user_id,
                title: `${squadName} attend ta reponse !`,
                body: `Session ${session.title || session.game || ''} dans ${hoursUntil}h - Confirme ta presence`,
                url: `/squads/${squadId}`,
                tag: `rsvp-reminder-${session.id}`
              })
            }
          )
        } catch (pushError) {
          console.error(`Push notification error for user ${member.user_id}:`, pushError)
        }
      }

      results.push({
        session_id: session.id,
        session_title: session.title || session.game || 'Session',
        squad_name: squadName,
        non_responders: nonResponders,
        reminder_sent: true
      })
    }

    const remindersSent = results.filter(r => r.reminder_sent).length

    console.log(`AI RSVP Reminder: Processed ${sessions.length} sessions, sent ${remindersSent} reminders`)

    return new Response(
      JSON.stringify({
        success: true,
        sessions_processed: sessions.length,
        reminders_sent: remindersSent,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-rsvp-reminder:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
