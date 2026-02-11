import { create } from 'zustand'
import { supabase, isSupabaseReady } from '../lib/supabase'
import type { Session, SessionRsvp, SessionCheckin } from '../types/database'
import { createSessionActions } from './useSessionActions'

type RsvpResponse = 'present' | 'absent' | 'maybe'

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

  fetchSessions: (squadId: string) => Promise<void>
  fetchSessionById: (id: string) => Promise<SessionWithDetails | null>
  createSession: (data: {
    squad_id: string
    title?: string
    game?: string
    scheduled_at: string
    duration_minutes?: number
    auto_confirm_threshold?: number
  }) => Promise<{ session: Session | null; error: Error | null }>
  updateRsvp: (sessionId: string, response: RsvpResponse) => Promise<{ error: Error | null }>
  checkin: (sessionId: string, status: 'present' | 'late' | 'noshow') => Promise<{ error: Error | null }>
  cancelSession: (sessionId: string) => Promise<{ error: Error | null }>
  confirmSession: (sessionId: string) => Promise<{ error: Error | null }>
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,

  fetchSessions: async (squadId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true })

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('squad_id', squadId)
        .order('scheduled_at', { ascending: true })

      if (error) throw error

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

      set((state) => {
        const otherSquadSessions = state.sessions.filter(s => s.squad_id !== squadId)
        return {
          sessions: [...otherSquadSessions, ...sessionsWithDetails],
          isLoading: false
        }
      })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchSessionById: async (id: string) => {
    if (!isSupabaseReady()) return null
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const user = authSession?.user

      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const { data: rsvps } = await supabase
        .from('session_rsvps')
        .select('*')
        .eq('session_id', id)

      // Fetch usernames separately to avoid PostgREST join errors
      if (rsvps?.length) {
        const userIds = [...new Set(rsvps.map(r => r.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds)
        const profileMap = new Map((profiles || []).map(p => [p.id, p]))
        rsvps.forEach((r: SessionRsvp & { profiles?: { username?: string } }) => {
          (r as SessionRsvp & { profiles: { username: string } }).profiles = profileMap.get(r.user_id) || { username: 'Joueur' }
        })
      }

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
        ...sessionData,
        rsvps: rsvps || [],
        checkins: checkins || [],
        my_rsvp: my_rsvp || null,
        rsvp_counts,
      }

      set({ currentSession: sessionWithDetails })
      return sessionWithDetails
    } catch {
      return null
    }
  },

  createSession: async (data) => {
    if (!isSupabaseReady()) return { session: null, error: new Error('Supabase not ready') }
    try {
      set({ isLoading: true })

      const { data: { session: authSession2 } } = await supabase.auth.getSession()
      const user = authSession2?.user
      if (!user) throw new Error('Not authenticated')

      const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({
          squad_id: data.squad_id,
          title: data.title,
          game: data.game,
          scheduled_at: data.scheduled_at,
          created_by: user.id,
          status: 'proposed' as const,
          duration_minutes: data.duration_minutes || 120,
          auto_confirm_threshold: data.auto_confirm_threshold || 3,
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('session_rsvps')
        .insert({
          session_id: newSession.id,
          user_id: user.id,
          response: 'present' as const,
        })

      await get().fetchSessions(data.squad_id)
      set({ isLoading: false })
      return { session: newSession, error: null }
    } catch (error) {
      set({ isLoading: false })
      return { session: null, error: error as Error }
    }
  },

  ...createSessionActions(get),
}))
