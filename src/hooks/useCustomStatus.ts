import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuth'
import { showSuccess, showError } from '../lib/toast'

interface StatusUpdate {
  statusText: string | null
  statusEmoji: string | null
  durationMinutes?: number | null
}

export function useCustomStatus() {
  const { user, profile } = useAuthStore()
  const queryClient = useQueryClient()

  const currentStatus = profile
    ? {
        text: profile.status_text as string | null,
        emoji: profile.status_emoji as string | null,
        expiresAt: profile.status_expires_at as string | null,
        isActive:
          !!profile.status_text &&
          (!profile.status_expires_at ||
            new Date(profile.status_expires_at as string) > new Date()),
      }
    : null

  const updateStatusMutation = useMutation({
    mutationFn: async ({ statusText, statusEmoji, durationMinutes }: StatusUpdate) => {
      if (!user?.id) throw new Error('Non connecté')

      const { error } = await supabase.rpc('update_user_status', {
        p_user_id: user.id,
        p_status_text: statusText,
        p_status_emoji: statusEmoji,
        p_duration_minutes: durationMinutes ?? null,
      })

      if (error) {
        // Fallback to direct update if RPC not deployed yet
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            status_text: statusText,
            status_emoji: statusEmoji,
            status_expires_at: durationMinutes
              ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
              : null,
          })
          .eq('id', user.id)

        if (updateError) throw updateError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (variables.statusText) {
        showSuccess('Statut mis à jour')
      } else {
        showSuccess('Statut supprimé')
      }
    },
    onError: () => {
      showError('Erreur lors de la mise à jour du statut')
    },
  })

  const setStatus = useCallback(
    (update: StatusUpdate) => {
      updateStatusMutation.mutate(update)
    },
    [updateStatusMutation]
  )

  const clearStatus = useCallback(() => {
    updateStatusMutation.mutate({ statusText: null, statusEmoji: null })
  }, [updateStatusMutation])

  return {
    currentStatus,
    setStatus,
    clearStatus,
    isUpdating: updateStatusMutation.isPending,
  }
}

// Preset statuses for quick selection
export const STATUS_PRESETS = [
  { emoji: '🎮', text: 'En jeu' },
  { emoji: '🔇', text: 'Ne pas déranger' },
  { emoji: '🎧', text: 'En écoute' },
  { emoji: '💤', text: 'AFK' },
  { emoji: '🏆', text: 'En ranked' },
  { emoji: '📺', text: 'En stream' },
  { emoji: '🍔', text: 'En pause' },
  { emoji: '🔥', text: 'On fire' },
] as const

export const STATUS_DURATIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 heure', minutes: 60 },
  { label: '4 heures', minutes: 240 },
  { label: "Jusqu'à demain", minutes: 1440 },
  { label: 'Permanent', minutes: null },
] as const
