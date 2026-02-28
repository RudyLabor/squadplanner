import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { showSuccess, showError } from '../lib/toast'

// ── Types ──

export interface OnboardingCall {
  id: string
  user_id: string
  scheduled_date: string
  scheduled_time: string
  topic: string
  status: 'booked' | 'completed' | 'cancelled'
  created_at: string
}

interface BookCallInput {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  topic: string
}

// ── Query keys ──

const ONBOARDING_CALL_KEY = ['onboarding-call'] as const

// ── Hook ──

export function useOnboardingCall() {
  const queryClient = useQueryClient()

  // Fetch user's active (booked) call
  const {
    data: call,
    isLoading,
    error,
  } = useQuery({
    queryKey: ONBOARDING_CALL_KEY,
    queryFn: async (): Promise<OnboardingCall | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error: fetchError } = await supabase
          .from('onboarding_calls')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'booked')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError) {
          // Table may not exist yet — graceful fallback
          if (
            fetchError.code === '42P01' ||
            fetchError.message?.includes('relation') ||
            fetchError.message?.includes('does not exist')
          ) {
            console.warn('[OnboardingCall] Table not found, skipping')
            return null
          }
          throw fetchError
        }

        return data as OnboardingCall | null
      } catch (err) {
        console.warn('[OnboardingCall] Error fetching:', err)
        return null
      }
    },
    staleTime: 30_000,
    retry: 1,
  })

  // Book a new call
  const bookCallMutation = useMutation({
    mutationFn: async (input: BookCallInput): Promise<OnboardingCall> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { data, error: insertError } = await supabase
        .from('onboarding_calls')
        .insert({
          user_id: user.id,
          scheduled_date: input.date,
          scheduled_time: input.time,
          topic: input.topic,
          status: 'booked',
        })
        .select()
        .single()

      if (insertError) {
        // Table may not exist
        if (
          insertError.code === '42P01' ||
          insertError.message?.includes('relation') ||
          insertError.message?.includes('does not exist')
        ) {
          throw new Error(
            'Cette fonctionnalité sera bientôt disponible. La base de données est en cours de configuration.'
          )
        }
        throw insertError
      }

      return data as OnboardingCall
    },
    onSuccess: () => {
      showSuccess('Appel réservé ! Tu recevras un email avec le lien de visio.')
      queryClient.invalidateQueries({ queryKey: ONBOARDING_CALL_KEY })
    },
    onError: (err: Error) => {
      showError(err.message || 'Erreur lors de la réservation')
    },
  })

  // Cancel a call
  const cancelCallMutation = useMutation({
    mutationFn: async (callId: string): Promise<void> => {
      const { error: updateError } = await supabase
        .from('onboarding_calls')
        .update({ status: 'cancelled' })
        .eq('id', callId)

      if (updateError) {
        if (
          updateError.code === '42P01' ||
          updateError.message?.includes('relation') ||
          updateError.message?.includes('does not exist')
        ) {
          throw new Error('Cette fonctionnalité sera bientôt disponible.')
        }
        throw updateError
      }
    },
    onSuccess: () => {
      showSuccess('Appel annulé')
      queryClient.invalidateQueries({ queryKey: ONBOARDING_CALL_KEY })
    },
    onError: (err: Error) => {
      showError(err.message || "Erreur lors de l'annulation")
    },
  })

  return {
    call: call ?? null,
    isLoading,
    error,
    bookCall: bookCallMutation.mutateAsync,
    isBooking: bookCallMutation.isPending,
    cancelCall: cancelCallMutation.mutateAsync,
    isCancelling: cancelCallMutation.isPending,
  }
}
