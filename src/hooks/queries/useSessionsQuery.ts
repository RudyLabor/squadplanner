import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'
import { queryKeys } from '../../lib/queryClient'
import type { Session } from '../../types/database'
import { showSuccess, showError } from '../../lib/toast'
import { sendRsvpMessage, sendSessionConfirmedMessage } from '../../lib/systemMessages'
import { createOptimisticMutation, optimisticId } from '../../utils/optimisticUpdate'
import { trackChallengeProgress } from '../../lib/challengeTracker'
import {
  type SessionWithDetails,
  fetchSessionsBySquad,
  fetchUpcomingSessions,
  fetchSessionById,
} from './useSessionFetchers'

export type { SessionWithDetails } from './useSessionFetchers'

type RsvpResponse = 'present' | 'absent' | 'maybe'
type CheckinStatus = 'present' | 'late' | 'noshow'

export function useSquadSessionsQuery(squadId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: queryKeys.sessions.list(squadId),
    queryFn: () => (squadId ? fetchSessionsBySquad(squadId, userId) : []),
    enabled: !!squadId,
    staleTime: 30 * 1000,
  })
}

export function useUpcomingSessionsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions.upcoming(),
    queryFn: () => (userId ? fetchUpcomingSessions(userId) : []),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function useSessionQuery(sessionId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId ?? ''),
    queryFn: () => (sessionId ? fetchSessionById(sessionId, userId) : null),
    enabled: !!sessionId,
    staleTime: 15 * 1000,
  })
}

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
    queryKeys: (vars) => [queryKeys.sessions.list(vars.squad_id), queryKeys.sessions.upcoming()],
    updateCache: (qc, vars) => {
      const tempSession: SessionWithDetails = {
        id: optimisticId(),
        squad_id: vars.squad_id,
        title: vars.title || null,
        game: vars.game || null,
        description: null,
        scheduled_at: vars.scheduled_at,
        created_by: '',
        status: 'proposed',
        duration_minutes: vars.duration_minutes || 120,
        min_players: 1,
        max_players: null,
        rsvp_deadline: null,
        auto_confirm_threshold: vars.auto_confirm_threshold || 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        my_rsvp: 'present',
        rsvp_counts: { present: 1, absent: 0, maybe: 0 },
      }
      qc.setQueryData<SessionWithDetails[]>(queryKeys.sessions.list(vars.squad_id), (old) =>
        old ? [...old, tempSession] : [tempSession]
      )
    },
    errorMessage: 'Erreur lors de la creation de la session',
    invalidateKeys: (_data, vars) => [
      queryKeys.sessions.list(vars.squad_id),
      queryKeys.sessions.upcoming(),
    ],
  })

  return useMutation({
    mutationFn: async (data: CreateSessionVars) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
      await supabase.from('session_rsvps').insert({
        session_id: session.id,
        user_id: user.id,
        response: 'present' as const,
      })
      // Track challenge progress: session creation + auto-RSVP
      trackChallengeProgress(user.id, 'create_session').catch(() => {})
      trackChallengeProgress(user.id, 'rsvp').catch(() => {})
      trackChallengeProgress(user.id, 'daily_rsvp').catch(() => {})
      return session
    },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSuccess: () => {
      showSuccess('Session creee ! Tes potes vont etre notifies.')
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      // Gamification: award XP for creating a session
      import('../../stores/useGamificationStore').then(({ useGamificationStore }) => {
        const store = useGamificationStore.getState()
        store.addXP('session.create')
        store.incrementStat('sessionsCreated')
      })
    },
    onSettled: optimistic.onSettled,
  })
}

export function useRsvpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, response }: { sessionId: string; response: RsvpResponse }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
          .update({ response, responded_at: new Date().toISOString() })
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
      const [{ data: profile }, { data: session }] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', user.id).single(),
        supabase.from('sessions').select('squad_id, title').eq('id', sessionId).single(),
      ])
      if (profile?.username && session?.squad_id) {
        sendRsvpMessage(session.squad_id, profile.username, session.title, response).catch(() => {})
      }
      // Track challenge progress for RSVP actions
      if (response === 'present') {
        trackChallengeProgress(user.id, 'rsvp').catch(() => {})
        trackChallengeProgress(user.id, 'daily_rsvp').catch(() => {})
      }
      return { sessionId, response, userId: user.id, squadId: session?.squad_id }
    },
    onMutate: async ({ sessionId, response }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions.detail(sessionId) })
      const previousSession = queryClient.getQueryData<SessionWithDetails>(
        queryKeys.sessions.detail(sessionId)
      )
      if (previousSession) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          queryClient.setQueryData<SessionWithDetails>(queryKeys.sessions.detail(sessionId), {
            ...previousSession,
            my_rsvp: response,
            rsvp_counts: {
              present: previousSession.rsvp_counts?.present || 0,
              absent: previousSession.rsvp_counts?.absent || 0,
              maybe: previousSession.rsvp_counts?.maybe || 0,
              ...(previousSession.my_rsvp && {
                [previousSession.my_rsvp]:
                  (previousSession.rsvp_counts?.[previousSession.my_rsvp] || 1) - 1,
              }),
              [response]:
                (previousSession.rsvp_counts?.[response] || 0) +
                (previousSession.my_rsvp === response ? 0 : 1),
            },
          })
        }
      }
      return { previousSession }
    },
    onError: (_err, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          queryKeys.sessions.detail(variables.sessionId),
          context.previousSession
        )
      }
      showError('Erreur de connexion. Reessaie.')
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) })
      if (data.squadId)
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.upcoming() })
      // Refresh challenges to show updated progress
      if (data.response === 'present') {
        queryClient.invalidateQueries({ queryKey: ['challenges'] })
        // Gamification: award XP for RSVP
        import('../../stores/useGamificationStore').then(({ useGamificationStore }) => {
          useGamificationStore.getState().addXP('session.rsvp')
        })
      }
      // Auto-confirm: if RSVP is "present", check if threshold is met
      if (data.response === 'present') {
        try {
          const { data: session } = await supabase
            .from('sessions')
            .select('status, auto_confirm_threshold')
            .eq('id', data.sessionId)
            .single()
          if (session && session.status === 'proposed' && session.auto_confirm_threshold) {
            const { count } = await supabase
              .from('session_rsvps')
              .select('id', { count: 'exact', head: true })
              .eq('session_id', data.sessionId)
              .eq('response', 'present')
            if (count !== null && count >= session.auto_confirm_threshold) {
              await supabase
                .from('sessions')
                .update({ status: 'confirmed' as const })
                .eq('id', data.sessionId)
              const { data: sessionInfo } = await supabase
                .from('sessions')
                .select('squad_id, title, scheduled_at')
                .eq('id', data.sessionId)
                .single()
              if (sessionInfo?.squad_id) {
                sendSessionConfirmedMessage(sessionInfo.squad_id, sessionInfo.title, sessionInfo.scheduled_at).catch(() => {})
              }
              queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) })
              if (data.squadId)
                queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
              showSuccess('Session auto-confirmee ! Le seuil de joueurs est atteint.')
            }
          }
        } catch {
          // Auto-confirm is best-effort, don't block the RSVP flow
        }
      }
    },
  })
}

export function useCheckinMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: CheckinStatus }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
        const { error } = await supabase.from('session_checkins').insert({
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
      showSuccess('Check-in enregistre !')
    },
    onError: () => {
      showError('Erreur lors du check-in')
    },
  })
}

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
      if (session?.squad_id) {
        sendSessionConfirmedMessage(session.squad_id, session.title, session.scheduled_at).catch(
          () => {}
        )
      }
      return { sessionId, squadId: session?.squad_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) })
      if (data.squadId)
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
      showSuccess('Session confirmee !')
    },
    onError: () => {
      showError('Erreur lors de la confirmation')
    },
  })
}

type UpdateSessionVars = {
  sessionId: string
  title?: string
  game?: string
  scheduled_at?: string
  duration_minutes?: number
  auto_confirm_threshold?: number
}

export function useUpdateSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateSessionVars) => {
      const updates: Record<string, unknown> = {}
      if (data.title !== undefined) updates.title = data.title
      if (data.game !== undefined) updates.game = data.game
      if (data.scheduled_at !== undefined) updates.scheduled_at = data.scheduled_at
      if (data.duration_minutes !== undefined) updates.duration_minutes = data.duration_minutes
      if (data.auto_confirm_threshold !== undefined)
        updates.auto_confirm_threshold = data.auto_confirm_threshold
      updates.updated_at = new Date().toISOString()

      const { data: session, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', data.sessionId)
        .select('id, squad_id')
        .single()
      if (error) throw error
      return { sessionId: data.sessionId, squadId: session.squad_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) })
      if (data.squadId)
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.upcoming() })
      showSuccess('Session modifiée !')
    },
    onError: () => {
      showError('Erreur lors de la modification')
    },
  })
}

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
      if (data.squadId)
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.squadId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.upcoming() })
      showSuccess('Session annulee')
    },
    onError: () => {
      showError("Erreur lors de l'annulation")
    },
  })
}
