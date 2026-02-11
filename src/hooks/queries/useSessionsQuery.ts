/**
 * PHASE 1.1 - React Query hooks for Sessions
 *
 * Optimized session fetching with:
 * - Automatic deduplication
 * - Smart caching
 * - Optimistic updates for RSVP (Phase 4.5)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryClient'
import type { Session, SessionRsvp, SessionCheckin } from '../../types/database'
import { showSuccess, showError } from '../../lib/toast'
import { sendRsvpMessage, sendSessionConfirmedMessage } from '../../lib/systemMessages'
import { createOptimisticMutation, optimisticId } from '../../utils/optimisticUpdate'

type RsvpResponse = 'present' | 'absent' | 'maybe'
type CheckinStatus = 'present' | 'late' | 'noshow'

export interface SessionWithDetails extends Session {
  rsvps?: (SessionRsvp & { profiles?: { username?: string } })[]
  checkins?: SessionCheckin[]
  my_rsvp?: RsvpResponse | null
  rsvp_counts?: { present: number; absent: number; maybe: number }
}

// Fetch sessions for a squad
async function fetchSessionsBySquad(squadId: string, userId?: string): Promise<SessionWithDetails[]> {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('squad_id', squadId)
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  if (!sessions?.length) return []

  // Get all RSVPs for these sessions in one query
  const sessionIds = sessions.map(s => s.id)
  const { data: allRsvps } = await supabase
    .from('session_rsvps')
    .select('*')
    .in('session_id', sessionIds)

  return sessions.map(session => {
    const sessionRsvps = allRsvps?.filter(r => r.session_id === session.id) || []
    const myRsvp = userId ? sessionRsvps.find(r => r.user_id === userId)?.response as RsvpResponse | undefined : null

    return {
      ...session,
      rsvps: sessionRsvps,
      my_rsvp: myRsvp || null,
      rsvp_counts: {
        present: sessionRsvps.filter(r => r.response === 'present').length,
        absent: sessionRsvps.filter(r => r.response === 'absent').length,
        maybe: sessionRsvps.filter(r => r.response === 'maybe').length,
      },
    }
  })
}

// Fetch all upcoming sessions across all user's squads
async function fetchUpcomingSessions(userId: string): Promise<SessionWithDetails[]> {
  // First get user's squad IDs
  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id')
    .eq('user_id', userId)

  if (!memberships?.length) return []

  const squadIds = memberships.map(m => m.squad_id)

  // Get upcoming sessions
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .in('squad_id', squadIds)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(20)

  if (error) throw error
  if (!sessions?.length) return []

  // Get RSVPs
  const sessionIds = sessions.map(s => s.id)
  const { data: allRsvps } = await supabase
    .from('session_rsvps')
    .select('*')
    .in('session_id', sessionIds)

  return sessions.map(session => {
    const sessionRsvps = allRsvps?.filter(r => r.session_id === session.id) || []
    const myRsvp = sessionRsvps.find(r => r.user_id === userId)?.response as RsvpResponse | undefined

    return {
      ...session,
      rsvps: sessionRsvps,
      my_rsvp: myRsvp || null,
      rsvp_counts: {
        present: sessionRsvps.filter(r => r.response === 'present').length,
        absent: sessionRsvps.filter(r => r.response === 'absent').length,
        maybe: sessionRsvps.filter(r => r.response === 'maybe').length,
      },
    }
  })
}

// Fetch a single session with full details
async function fetchSessionById(sessionId: string, userId?: string): Promise<SessionWithDetails | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) throw error

  // Get RSVPs with profiles
  const { data: rsvps } = await supabase
    .from('session_rsvps')
    .select('*, profiles(username)')
    .eq('session_id', sessionId)

  // Get checkins
  const { data: checkins } = await supabase
    .from('session_checkins')
    .select('*')
    .eq('session_id', sessionId)

  const myRsvp = userId ? rsvps?.find(r => r.user_id === userId)?.response as RsvpResponse | undefined : null

  return {
    ...session,
    rsvps: rsvps || [],
    checkins: checkins || [],
    my_rsvp: myRsvp || null,
    rsvp_counts: {
      present: rsvps?.filter(r => r.response === 'present').length || 0,
      absent: rsvps?.filter(r => r.response === 'absent').length || 0,
      maybe: rsvps?.filter(r => r.response === 'maybe').length || 0,
    },
  }
}

/**
 * Hook to fetch sessions for a specific squad
 */
export function useSquadSessionsQuery(squadId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: queryKeys.sessions.list(squadId),
    queryFn: () => squadId ? fetchSessionsBySquad(squadId, userId) : [],
    enabled: !!squadId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch all upcoming sessions across squads
 */
export function useUpcomingSessionsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions.upcoming(),
    queryFn: () => userId ? fetchUpcomingSessions(userId) : [],
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single session by ID
 */
export function useSessionQuery(sessionId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId ?? ''),
    queryFn: () => sessionId ? fetchSessionById(sessionId, userId) : null,
    enabled: !!sessionId,
    staleTime: 15 * 1000, // Shorter stale time for session details
  })
}

/**
 * Mutation to create a new session
 * Optimistic update: session appears in list instantly
 */
type CreateSessionVars = {
  squad_id: string
  title?: string
  game?: string
  scheduled_at: string
  duration_minutes?: number
  auto_confirm_threshold?: number
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient()

  const optimistic = createOptimisticMutation<Session, CreateSessionVars>(queryClient, {
    queryKeys: (vars) => [
      queryKeys.sessions.list(vars.squad_id),
      queryKeys.sessions.upcoming(),
    ],
    updateCache: (qc, vars) => {
      const tempSession: SessionWithDetails = {
        id: optimisticId(),
        squad_id: vars.squad_id,
        title: vars.title || null,
        game: vars.game || null,
        scheduled_at: vars.scheduled_at,
        created_by: '',
        status: 'proposed',
        duration_minutes: vars.duration_minutes || 120,
        auto_confirm_threshold: vars.auto_confirm_threshold || 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        my_rsvp: 'present',
        rsvp_counts: { present: 1, absent: 0, maybe: 0 },
      }
      qc.setQueryData<SessionWithDetails[]>(
        queryKeys.sessions.list(vars.squad_id),
        (old) => old ? [...old, tempSession] : [tempSession]
      )
    },
    errorMessage: 'Erreur lors de la creation de la session',
    invalidateKeys: (data, vars) => [
      queryKeys.sessions.list(vars.squad_id),
      queryKeys.sessions.upcoming(),
    ],
  })

  return useMutation({
    mutationFn: async (data: CreateSessionVars) => {
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
          auto_confirm_threshold: data.auto_confirm_threshold || 3,
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

      return session
    },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSuccess: () => {
      showSuccess('Session creee ! Tes potes vont etre notifies.')
    },
    onSettled: optimistic.onSettled,
  })
}

/**
 * PHASE 4.5 - Optimistic RSVP mutation
 * Updates UI instantly, reverts on error
 */
export function useRsvpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, response }: { sessionId: string; response: RsvpResponse }) => {
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
        const { error } = await supabase
          .from('session_rsvps')
          .update({ response, responded_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
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

      // Send system message
      const [{ data: profile }, { data: session }] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', user.id).single(),
        supabase.from('sessions').select('squad_id, title').eq('id', sessionId).single()
      ])

      if (profile?.username && session?.squad_id) {
        sendRsvpMessage(session.squad_id, profile.username, session.title, response).catch(() => {})
      }

      return { sessionId, response, userId: user.id, squadId: session?.squad_id }
    },
    // PHASE 4.5 - Optimistic update
    onMutate: async ({ sessionId, response }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions.detail(sessionId) })

      // Snapshot previous value
      const previousSession = queryClient.getQueryData<SessionWithDetails>(
        queryKeys.sessions.detail(sessionId)
      )

      // Optimistically update the cache
      if (previousSession) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          queryClient.setQueryData<SessionWithDetails>(
            queryKeys.sessions.detail(sessionId),
            {
              ...previousSession,
              my_rsvp: response,
              rsvp_counts: {
                present: previousSession.rsvp_counts?.present || 0,
                absent: previousSession.rsvp_counts?.absent || 0,
                maybe: previousSession.rsvp_counts?.maybe || 0,
                // Adjust counts optimistically
                ...(previousSession.my_rsvp && { [previousSession.my_rsvp]: (previousSession.rsvp_counts?.[previousSession.my_rsvp] || 1) - 1 }),
                [response]: (previousSession.rsvp_counts?.[response] || 0) + (previousSession.my_rsvp === response ? 0 : 1),
              },
            }
          )
        }
      }

      return { previousSession }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          queryKeys.sessions.detail(variables.sessionId),
          context.previousSession
        )
      }
      showError('Erreur de connexion. Réessaie.')
    },
    onSuccess: (data) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) })
      if (data.squadId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.upcoming() })
    },
  })
}

/**
 * Mutation to check in to a session
 */
export function useCheckinMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: CheckinStatus }) => {
      const { data: { user } } = await supabase.auth.getUser()
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
          .update({ status, checked_at: new Date().toISOString() })
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

      return sessionId
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) })
      showSuccess('Check-in enregistré !')
    },
    onError: () => {
      showError('Erreur lors du check-in')
    },
  })
}

/**
 * Mutation to confirm a session
 */
export function useConfirmSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
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

      // Send system message
      if (session?.squad_id) {
        sendSessionConfirmedMessage(session.squad_id, session.title, session.scheduled_at).catch(() => {})
      }

      return { sessionId, squadId: session?.squad_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) })
      if (data.squadId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
      }
      showSuccess('Session confirmée !')
    },
    onError: () => {
      showError('Erreur lors de la confirmation')
    },
  })
}

/**
 * Mutation to cancel a session
 */
export function useCancelSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: session } = await supabase
        .from('sessions')
        .select('squad_id')
        .eq('id', sessionId)
        .single()

      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' as const })
        .eq('id', sessionId)

      if (error) throw error

      return { sessionId, squadId: session?.squad_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) })
      if (data.squadId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.upcoming() })
      showSuccess('Session annulée')
    },
    onError: () => {
      showError('Erreur lors de l\'annulation')
    },
  })
}
