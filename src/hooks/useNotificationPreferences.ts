import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from './useAuth'
import { showSuccess, showError } from '../lib/toast'
import type { NotificationPreferences } from '../types/database'

// Group notification types into categories for the UI
export const NOTIFICATION_CATEGORIES = [
  {
    key: 'sessions',
    label: 'Sessions',
    icon: '🎮',
    settings: [
      { key: 'session_created', label: 'Nouvelle session créée' },
      { key: 'session_confirmed', label: 'Session confirmée' },
      { key: 'session_cancelled', label: 'Session annulée' },
      { key: 'session_reminder_15min', label: 'Rappel 15 min avant' },
      { key: 'session_reminder_1h', label: 'Rappel 1h avant' },
      { key: 'session_reminder_24h', label: 'Rappel 24h avant' },
      { key: 'session_rsvp_received', label: 'Réponse RSVP reçue' },
      { key: 'session_rsvp_changed', label: 'Changement de RSVP' },
      { key: 'session_checkin_reminder', label: 'Rappel de check-in' },
      { key: 'session_completed', label: 'Session terminée' },
    ],
  },
  {
    key: 'squad',
    label: 'Squad',
    icon: '👥',
    settings: [
      { key: 'squad_member_joined', label: 'Nouveau membre' },
      { key: 'squad_member_left', label: 'Membre parti' },
      { key: 'squad_role_changed', label: 'Changement de rôle' },
      { key: 'squad_settings_changed', label: 'Paramètres modifiés' },
    ],
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: '💬',
    settings: [
      { key: 'message_received', label: 'Message reçu' },
      { key: 'message_mention', label: 'Mention (@)' },
      { key: 'message_reaction', label: 'Réaction emoji' },
      { key: 'message_thread_reply', label: 'Réponse dans un thread' },
      { key: 'dm_received', label: 'Message privé reçu' },
    ],
  },
  {
    key: 'voice',
    label: 'Vocal',
    icon: '🎙️',
    settings: [
      { key: 'party_started', label: 'Party lancée' },
      { key: 'party_member_joined', label: 'Membre rejoint la party' },
      { key: 'incoming_call', label: 'Appel entrant' },
      { key: 'missed_call', label: 'Appel manqué' },
    ],
  },
  {
    key: 'social',
    label: 'Social',
    icon: '🌐',
    settings: [
      { key: 'friend_request', label: "Demande d'ami" },
      { key: 'friend_online', label: 'Ami en ligne' },
      { key: 'story_from_friend', label: 'Nouvelle story' },
      { key: 'matchmaking_request', label: 'Demande de matchmaking' },
    ],
  },
  {
    key: 'gamification',
    label: 'Progression',
    icon: '🏆',
    settings: [
      { key: 'level_up', label: 'Montée de niveau' },
      { key: 'achievement_unlocked', label: 'Succès débloqué' },
      { key: 'streak_at_risk', label: 'Série en danger' },
      { key: 'leaderboard_rank_change', label: 'Changement de rang' },
      { key: 'challenge_completed', label: 'Défi terminé' },
    ],
  },
  {
    key: 'ai',
    label: 'IA',
    icon: '🤖',
    settings: [
      { key: 'ai_coach_tip', label: 'Conseil du coach IA' },
      { key: 'ai_slot_suggestion', label: 'Suggestion de créneau' },
    ],
  },
] as const

export function useNotificationPreferences() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // Table might not exist yet, or no row yet
        if (error.code === 'PGRST116') {
          // No row found, create default
          const { data: newData, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({ user_id: user.id })
            .select()
            .single()

          if (insertError) {
            console.warn('notification_preferences not available:', insertError.message)
            return null
          }
          return newData as NotificationPreferences
        }
        console.warn('notification_preferences error:', error.message)
        return null
      }

      return data as NotificationPreferences
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('Non connecté')

      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      showSuccess('Préférences mises à jour')
    },
    onError: () => showError('Erreur lors de la sauvegarde'),
  })

  const updatePreference = useCallback(
    (key: string, value: boolean) => {
      updateMutation.mutate({ [key]: value } as Partial<NotificationPreferences>)
    },
    [updateMutation]
  )

  const updateQuietHours = useCallback(
    (start: string | null, end: string | null) => {
      updateMutation.mutate({
        quiet_hours_start: start,
        quiet_hours_end: end,
      } as Partial<NotificationPreferences>)
    },
    [updateMutation]
  )

  const toggleSound = useCallback(
    (enabled: boolean) => {
      updateMutation.mutate({ sound_enabled: enabled } as Partial<NotificationPreferences>)
    },
    [updateMutation]
  )

  const toggleVibration = useCallback(
    (enabled: boolean) => {
      updateMutation.mutate({ vibration_enabled: enabled } as Partial<NotificationPreferences>)
    },
    [updateMutation]
  )

  // Bulk update: enable/disable entire category
  const toggleCategory = useCallback(
    (categoryKey: string, enabled: boolean) => {
      const category = NOTIFICATION_CATEGORIES.find((c) => c.key === categoryKey)
      if (!category) return

      const updates: Record<string, boolean> = {}
      category.settings.forEach((s) => {
        updates[s.key] = enabled
      })
      updateMutation.mutate(updates as Partial<NotificationPreferences>)
    },
    [updateMutation]
  )

  return {
    preferences,
    isLoading,
    updatePreference,
    updateQuietHours,
    toggleSound,
    toggleVibration,
    toggleCategory,
    isUpdating: updateMutation.isPending,
  }
}
