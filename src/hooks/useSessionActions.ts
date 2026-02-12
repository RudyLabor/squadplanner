import { supabase, isSupabaseReady } from '../lib/supabase'
import { sendRsvpMessage, sendSessionConfirmedMessage } from '../lib/systemMessages'

// Trigger haptic feedback if available
function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(25)
        break
      case 'heavy':
        navigator.vibrate(50)
        break
      case 'success':
        navigator.vibrate([10, 50, 10])
        break
      case 'warning':
      case 'error':
        navigator.vibrate([50, 100, 50])
        break
    }
  }
}

type RsvpResponse = 'present' | 'absent' | 'maybe'
type CheckinStatus = 'present' | 'late' | 'noshow'

interface SessionsStateSlice {
  fetchSessionById: (id: string) => Promise<any>
}

type GetState = () => SessionsStateSlice

export function createSessionActions(get: GetState) {
  return {
    updateRsvp: async (sessionId: string, response: RsvpResponse) => {
      if (!isSupabaseReady()) return { error: new Error('Supabase not ready') }
      try {
        const {
          data: { session: authSession3 },
        } = await supabase.auth.getSession()
        const user = authSession3?.user
        if (!user) throw new Error('Not authenticated')

        const { data: existing } = await supabase
          .from('session_rsvps')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .single()

        if (existing) {
          const { error } = await supabase
            .from('session_rsvps')
            .update({
              response,
              responded_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (error) throw error
        } else {
          const { error } = await supabase.from('session_rsvps').insert({
            session_id: sessionId,
            user_id: user.id,
            response,
            responded_at: new Date().toISOString(),
          })

          if (error) throw error
        }

        const [{ data: profile }, { data: rsvpSession }] = await Promise.all([
          supabase.from('profiles').select('username').eq('id', user.id).single(),
          supabase.from('sessions').select('squad_id, title').eq('id', sessionId).single(),
        ])

        if (profile?.username && rsvpSession?.squad_id) {
          sendRsvpMessage(
            rsvpSession.squad_id,
            profile.username,
            rsvpSession.title,
            response
          ).catch(() => {})
        }

        // Haptic feedback on RSVP confirmation
        triggerHaptic('success')

        await get().fetchSessionById(sessionId)
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },

    checkin: async (sessionId: string, status: CheckinStatus) => {
      if (!isSupabaseReady()) return { error: new Error('Supabase not ready') }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) throw new Error('Not authenticated')

        const { data: existing } = await supabase
          .from('session_checkins')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .single()

        if (existing) {
          const { error } = await supabase
            .from('session_checkins')
            .update({
              status,
              checked_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (error) throw error
        } else {
          const { error } = await supabase.from('session_checkins').insert({
            session_id: sessionId,
            user_id: user.id,
            status,
            checked_at: new Date().toISOString(),
          })

          if (error) throw error
        }

        await get().fetchSessionById(sessionId)
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },

    cancelSession: async (sessionId: string) => {
      if (!isSupabaseReady()) return { error: new Error('Supabase not ready') }
      try {
        const { error } = await supabase
          .from('sessions')
          .update({ status: 'cancelled' as const })
          .eq('id', sessionId)

        if (error) throw error

        await get().fetchSessionById(sessionId)
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },

    confirmSession: async (sessionId: string) => {
      if (!isSupabaseReady()) return { error: new Error('Supabase not ready') }
      try {
        const { data: session } = await supabase
          .from('sessions')
          .select('squad_id, title, scheduled_at')
          .eq('id', sessionId)
          .single()

        const { error } = await supabase
          .from('sessions')
          .update({ status: 'confirmed' as const })
          .eq('id', sessionId)

        if (error) throw error

        if (session?.squad_id) {
          sendSessionConfirmedMessage(session.squad_id, session.title, session.scheduled_at).catch(
            () => {}
          )
        }

        // Haptic feedback on session confirmation
        triggerHaptic('success')

        await get().fetchSessionById(sessionId)
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },
  }
}
