import { supabase } from '../../lib/supabase'
import type { Session, SessionRsvp, SessionCheckin } from '../../types/database'

type RsvpResponse = 'present' | 'absent' | 'maybe'

export interface SessionWithDetails extends Session {
  rsvps?: (SessionRsvp & { profiles?: { username?: string } })[]
  checkins?: SessionCheckin[]
  my_rsvp?: RsvpResponse | null
  rsvp_counts?: { present: number; absent: number; maybe: number }
}

function computeRsvpCounts(rsvps: SessionRsvp[], userId?: string) {
  const myRsvp = userId ? rsvps.find(r => r.user_id === userId)?.response as RsvpResponse | undefined : null
  return {
    my_rsvp: myRsvp || null,
    rsvp_counts: {
      present: rsvps.filter(r => r.response === 'present').length,
      absent: rsvps.filter(r => r.response === 'absent').length,
      maybe: rsvps.filter(r => r.response === 'maybe').length,
    },
  }
}

export async function fetchSessionsBySquad(squadId: string, userId?: string): Promise<SessionWithDetails[]> {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('squad_id', squadId)
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  if (!sessions?.length) return []

  const sessionIds = sessions.map(s => s.id)
  const { data: allRsvps } = await supabase
    .from('session_rsvps')
    .select('*')
    .in('session_id', sessionIds)

  return sessions.map(session => {
    const sessionRsvps = allRsvps?.filter(r => r.session_id === session.id) || []
    return { ...session, rsvps: sessionRsvps, ...computeRsvpCounts(sessionRsvps, userId) }
  })
}

export async function fetchUpcomingSessions(userId: string): Promise<SessionWithDetails[]> {
  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id')
    .eq('user_id', userId)

  if (!memberships?.length) return []

  const squadIds = memberships.map(m => m.squad_id)
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .in('squad_id', squadIds)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(20)

  if (error) throw error
  if (!sessions?.length) return []

  const sessionIds = sessions.map(s => s.id)
  const { data: allRsvps } = await supabase
    .from('session_rsvps')
    .select('*')
    .in('session_id', sessionIds)

  return sessions.map(session => {
    const sessionRsvps = allRsvps?.filter(r => r.session_id === session.id) || []
    return { ...session, rsvps: sessionRsvps, ...computeRsvpCounts(sessionRsvps, userId) }
  })
}

export async function fetchSessionById(sessionId: string, userId?: string): Promise<SessionWithDetails | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) throw error

  const { data: rsvps } = await supabase
    .from('session_rsvps')
    .select('*')
    .eq('session_id', sessionId)

  // Fetch usernames separately to avoid PostgREST join errors
  if (rsvps?.length) {
    const userIds = [...new Set(rsvps.map(r => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))
    rsvps.forEach((r: any) => {
      r.profiles = profileMap.get(r.user_id) || { username: 'Joueur' }
    })
  }

  const { data: checkins } = await supabase
    .from('session_checkins')
    .select('*')
    .eq('session_id', sessionId)

  return {
    ...session,
    rsvps: rsvps || [],
    checkins: checkins || [],
    ...computeRsvpCounts(rsvps || [], userId),
  }
}
