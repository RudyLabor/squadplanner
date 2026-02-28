/**
 * useWebhooks — Hook for managing API webhooks (Club tier feature).
 *
 * Provides CRUD operations for webhooks attached to a squad, plus a
 * test-fire helper.  Data is stored in the Supabase `webhooks` table
 * (to be created via migration) and cached with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { queryKeys } from '../lib/queryClient'
import { showSuccess, showError } from '../lib/toast'

// ── Types ────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'session.created'
  | 'session.confirmed'
  | 'session.cancelled'
  | 'rsvp.updated'
  | 'member.joined'
  | 'member.left'
  | 'message.sent'

export interface Webhook {
  id: string
  squad_id: string
  url: string
  events: WebhookEvent[]
  is_active: boolean
  secret: string
  created_at: string
  last_triggered_at: string | null
  failure_count: number
}

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'session.created', label: 'Session creee' },
  { value: 'session.confirmed', label: 'Session confirmee' },
  { value: 'session.cancelled', label: 'Session annulee' },
  { value: 'rsvp.updated', label: 'RSVP mis a jour' },
  { value: 'member.joined', label: 'Membre rejoint' },
  { value: 'member.left', label: 'Membre parti' },
  { value: 'message.sent', label: 'Message envoye' },
]

// ── Helpers ──────────────────────────────────────────────────────────

/** Generate a cryptographically-random 32-char hex secret. */
function generateWebhookSecret(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Fetch ────────────────────────────────────────────────────────────

async function fetchWebhooks(squadId: string): Promise<Webhook[]> {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Webhook[]
}

// ── Query hook ───────────────────────────────────────────────────────

export function useWebhooks(squadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.webhooks.list(squadId ?? ''),
    queryFn: () => fetchWebhooks(squadId!),
    enabled: !!squadId,
    staleTime: 30 * 1000,
  })
}

// ── Mutations ────────────────────────────────────────────────────────

export function useCreateWebhookMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      squadId,
      url,
      events,
    }: {
      squadId: string
      url: string
      events: WebhookEvent[]
    }) => {
      const secret = generateWebhookSecret()

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          squad_id: squadId,
          url,
          events,
          is_active: true,
          secret,
          failure_count: 0,
        })
        .select()
        .single()

      if (error) throw error
      return data as Webhook
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.list(variables.squadId) })
      showSuccess('Webhook cree avec succes !')
    },
    onError: (error: Error) => {
      showError(error.message || 'Erreur lors de la creation du webhook')
    },
  })
}

export function useUpdateWebhookMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      squadId,
      updates,
    }: {
      id: string
      squadId: string
      updates: Partial<Pick<Webhook, 'url' | 'events' | 'is_active'>>
    }) => {
      const { data, error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Webhook
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.list(variables.squadId) })
      showSuccess('Webhook mis a jour')
    },
    onError: (error: Error) => {
      showError(error.message || 'Erreur lors de la mise a jour')
    },
  })
}

export function useDeleteWebhookMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, squadId }: { id: string; squadId: string }) => {
      const { error } = await supabase.from('webhooks').delete().eq('id', id)
      if (error) throw error
      return { id, squadId }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.list(variables.squadId) })
      showSuccess('Webhook supprime')
    },
    onError: (error: Error) => {
      showError(error.message || 'Erreur lors de la suppression')
    },
  })
}

export function useTestWebhookMutation() {
  return useMutation({
    mutationFn: async ({ webhook }: { webhook: Webhook }) => {
      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        squad_id: webhook.squad_id,
        data: {
          message: 'Ceci est un test de webhook depuis Squad Planner',
          webhook_id: webhook.id,
        },
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret,
          'X-Webhook-Event': 'test',
          'User-Agent': 'SquadPlanner-Webhook/1.0',
        },
        body: JSON.stringify(testPayload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { status: response.status }
    },
    onSuccess: () => {
      showSuccess('Test envoye avec succes !')
    },
    onError: (error: Error) => {
      showError(`Echec du test : ${error.message}`)
    },
  })
}
