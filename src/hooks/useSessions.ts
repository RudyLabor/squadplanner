import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Session, SessionRsvp, SessionCheckin } from '../types/database'

type RsvpResponse = 'present' | 'absent' | 'maybe'
type CheckinStatus = 'present' | 'late' | 'noshow'

interface SessionWithDetails extends Session {
  rsvps?: (SessionRsvp & { profiles?: { username?: string } })[]
  checkins?: SessionCheckin[]
  my_rsvp?: RsvpResponse | null
  rsvp_counts?: { present: number; absent: number; maybe: number }
}

interface SessionsState {
  sessions: SessionWithDetails[]
  currentSession: SessionWithDetails | null
  isLoading: boolean
  
  // Actions
  fetchSessions: (squadId: string) => Promise<void>
  fetchSessionById: (id: string) => Promise<SessionWithDetails | null>
  createSession: (data: {
    squad_id: string
    title?: string
    game?: string
    scheduled_at: string
    duration_minutes?: number
  }) => Promise<{ session: Session | null; error: Error | null }>
  updateRsvp: (sessionId: string, response: RsvpResponse) => Promise<{ error: Error | null }>
  checkin: (sessionId: string, status: CheckinStatus) => Promise<{ error: Error | null }>
  cancelSession: (sessionId: string) => Promise<{ error: Error | null }>
  confirmSession: (sessionId: string) => Promise<{ error: Error | null }>
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,

  fetchSessions: async (squadId: string) => {
    try {
      set({ isLoading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('squad_id', squadId)
        .order('scheduled_at', { ascending: true })

      if (error) throw error

      // Get RSVPs for each session
      const sessionsWithDetails: SessionWithDetails[] = []
      for (const session of sessions || []) {
        const { data: rsvps } = await supabase
          .from('session_rsvps')
          .select('*')
          .eq('session_id', session.id)

        const my_rsvp = user ? (rsvps?.find(r => r.user_id === user.id)?.response as RsvpResponse | undefined) : null
        
        const rsvp_counts = {
          present: rsvps?.filter(r => r.response === 'present').length || 0,
          absent: rsvps?.filter(r => r.response === 'absent').length || 0,
          maybe: rsvps?.filter(r => r.response === 'maybe').length || 0,
        }

        sessionsWithDetails.push({
          ...session,
          rsvps,
          my_rsvp: my_rsvp || null,
          rsvp_counts,
        })
      }

      set({ sessions: sessionsWithDetails, isLoading: false })
    } catch (error) {
      console.error('Error fetching sessions:', error)
      set({ isLoading: false })
    }
  },

  fetchSessionById: async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Get RSVPs with profiles
      const { data: rsvps } = await supabase
        .from('session_rsvps')
        .select('*, profiles(username)')
        .eq('session_id', id)

      // Get checkins
      const { data: checkins } = await supabase
        .from('session_checkins')
        .select('*')
        .eq('session_id', id)

      const my_rsvp = user ? (rsvps?.find(r => r.user_id === user.id)?.response as RsvpResponse | undefined) : null
      
      const rsvp_counts = {
        present: rsvps?.filter(r => r.response === 'present').length || 0,
        absent: rsvps?.filter(r => r.response === 'absent').length || 0,
        maybe: rsvps?.filter(r => r.response === 'maybe').length || 0,
      }

      const sessionWithDetails: SessionWithDetails = {
        ...session,
        rsvps: rsvps || [],
        checkins: checkins || [],
        my_rsvp: my_rsvp || null,
        rsvp_counts,
      }

      set({ currentSession: sessionWithDetails })
      return sessionWithDetails
    } catch (error) {
      console.error('Error fetching session:', error)
      return null
    }
  },

  createSession: async (data) => {
    try {
      set({ isLoading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          squad_id: data.squad_id,
          title: data.title,
          game: data.game,
          scheduled_at: data.scheduled_at,
          created_by: user.id,
          status: 'proposed' as const,
          duration_minutes: data.duration_minutes || 120,
        })
        .select()
        .single()

      if (error) throw error

      // Auto-RSVP creator as present
      await supabase
        .from('session_rsvps')
        .insert({
          session_id: session.id,
          user_id: user.id,
          response: 'present' as const,
        })

      await get().fetchSessions(data.squad_id)
      set({ isLoading: false })
      return { session, error: null }
    } catch (error) {
      set({ isLoading: false })
      return { session: null, error: error as Error }
    }
  },

  updateRsvp: async (sessionId: string, response: RsvpResponse) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if RSVP exists
      const { data: existing } = await supabase
        .from('session_rsvps')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('session_rsvps')
          .update({
            response,
            responded_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('session_rsvps')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            response,
            responded_at: new Date().toISOString(),
          })
        
        if (error) throw error
      }

      // Refresh current session
      await get().fetchSessionById(sessionId)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  checkin: async (sessionId: string, status: CheckinStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if checkin exists
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
        const { error } = await supabase
          .from('session_checkins')
          .insert({
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
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'confirmed' as const })
        .eq('id', sessionId)

      if (error) throw error

      await get().fetchSessionById(sessionId)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },
}))
