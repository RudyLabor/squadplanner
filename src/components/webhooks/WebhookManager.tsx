/**
 * WebhookManager — UI for managing API webhooks on a squad.
 *
 * Displays the list of existing webhooks, lets the user create / edit /
 * delete / test webhooks, and shows the HMAC secret for each one.
 *
 * Gated behind the Club tier via PremiumGate in the parent (Settings page).
 */

import { useState, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  useWebhooks,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
  WEBHOOK_EVENTS,
  type WebhookEvent,
  type Webhook,
} from '../../hooks/useWebhooks'
import { useSquadsQuery } from '../../hooks/queries'
import { Button, Card, Input, Badge, ConfirmDialog, Checkbox } from '../ui'
import { Select } from '../ui/Select'
import {
  Webhook as WebhookIcon,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Loader2,
  Check,
  X,
} from '../icons'
import { showSuccess } from '../../lib/toast'

// ── Sub-components ───────────────────────────────────────────────────

function WebhookStatusBadge({ webhook }: { webhook: Webhook }) {
  if (!webhook.is_active) {
    return <Badge variant="default" size="sm">Inactif</Badge>
  }
  if (webhook.failure_count >= 5) {
    return <Badge variant="error" size="sm">En erreur</Badge>
  }
  if (webhook.failure_count > 0) {
    return <Badge variant="warning" size="sm">{webhook.failure_count} echec{webhook.failure_count > 1 ? 's' : ''}</Badge>
  }
  return <Badge variant="success" size="sm">Actif</Badge>
}

function SecretDisplay({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      showSuccess('Secret copie !')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }, [secret])

  return (
    <div className="flex items-center gap-2 mt-1">
      <code className="flex-1 text-xs font-mono bg-bg-base px-2 py-1 rounded-lg text-text-secondary truncate">
        {visible ? secret : '••••••••••••••••••••••••••••••••'}
      </code>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="p-1 rounded-md hover:bg-bg-hover transition-colors"
        aria-label={visible ? 'Masquer le secret' : 'Afficher le secret'}
      >
        {visible ? (
          <EyeOff className="w-3.5 h-3.5 text-text-quaternary" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-text-quaternary" />
        )}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded-md hover:bg-bg-hover transition-colors"
        aria-label="Copier le secret"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-text-quaternary" />
        )}
      </button>
    </div>
  )
}

function WebhookCard({
  webhook,
  onToggle,
  onDelete,
  onTest,
  isToggling,
  isTesting,
}: {
  webhook: Webhook
  onToggle: () => void
  onDelete: () => void
  onTest: () => void
  isToggling: boolean
  isTesting: boolean
}) {
  const eventLabels = webhook.events
    .map((e) => WEBHOOK_EVENTS.find((ev) => ev.value === e)?.label ?? e)
    .join(', ')

  const lastTriggered = webhook.last_triggered_at
    ? new Date(webhook.last_triggered_at).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Jamais'

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4 rounded-xl bg-surface-card border border-border-default"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <WebhookStatusBadge webhook={webhook} />
          </div>
          <p
            className="text-base font-medium text-text-primary truncate"
            title={webhook.url}
          >
            {webhook.url}
          </p>
        </div>
      </div>

      {/* Events */}
      <div className="mb-3">
        <p className="text-xs text-text-quaternary mb-1">Evenements</p>
        <div className="flex flex-wrap gap-1.5">
          {webhook.events.map((event) => (
            <span
              key={event}
              className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
            >
              {WEBHOOK_EVENTS.find((ev) => ev.value === event)?.label ?? event}
            </span>
          ))}
        </div>
      </div>

      {/* Secret */}
      <div className="mb-3">
        <p className="text-xs text-text-quaternary">Secret HMAC</p>
        <SecretDisplay secret={webhook.secret} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-text-quaternary mb-3">
        <span>Dernier appel : {lastTriggered}</span>
        {webhook.failure_count > 0 && (
          <span className="text-error">
            {webhook.failure_count} echec{webhook.failure_count > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border-default">
        <Button
          size="sm"
          variant="secondary"
          onClick={onToggle}
          disabled={isToggling}
          aria-label={webhook.is_active ? 'Désactiver le webhook' : 'Activer le webhook'}
        >
          {isToggling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : webhook.is_active ? (
            'Désactiver'
          ) : (
            'Activer'
          )}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onTest}
          disabled={isTesting || !webhook.is_active}
          aria-label="Tester le webhook"
        >
          {isTesting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Tester
            </>
          )}
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="danger"
          onClick={onDelete}
          aria-label="Supprimer le webhook"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </m.div>
  )
}

function CreateWebhookForm({
  squadId,
  onCreated,
  onCancel,
}: {
  squadId: string
  onCreated: () => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([])
  const [urlError, setUrlError] = useState<string | undefined>(undefined)

  const createMutation = useCreateWebhookMutation()

  const toggleEvent = useCallback((event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }, [])

  const validateUrl = useCallback((value: string): boolean => {
    try {
      const parsed = new URL(value)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setUrlError('L\'URL doit commencer par https:// ou http://')
        return false
      }
      setUrlError(undefined)
      return true
    } catch {
      setUrlError('URL invalide')
      return false
    }
  }, [])

  const handleSubmit = useCallback(() => {
    if (!validateUrl(url)) return
    if (selectedEvents.length === 0) return

    createMutation.mutate(
      { squadId, url, events: selectedEvents },
      {
        onSuccess: () => {
          setUrl('')
          setSelectedEvents([])
          onCreated()
        },
      }
    )
  }, [url, selectedEvents, squadId, createMutation, validateUrl, onCreated])

  const isValid = url.length > 0 && selectedEvents.length > 0 && !urlError

  return (
    <m.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-4 rounded-xl bg-surface-card border border-primary/20 space-y-4">
        <h4 className="text-base font-semibold text-text-primary">Nouveau webhook</h4>

        {/* URL input */}
        <Input
          label="URL du endpoint"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => {
            const v = (e.target as HTMLInputElement).value
            setUrl(v)
            if (v.length > 0) validateUrl(v)
            else setUrlError(undefined)
          }}
          error={urlError}
          icon={<WebhookIcon className="w-4 h-4" />}
        />

        {/* Event checkboxes */}
        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">
            Evenements a ecouter
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map((event) => (
              <Checkbox
                key={event.value}
                checked={selectedEvents.includes(event.value)}
                onChange={() => toggleEvent(event.value)}
                label={event.label}
                size="sm"
              />
            ))}
          </div>
          {selectedEvents.length === 0 && (
            <p className="text-xs text-text-quaternary mt-1">
              Selectionne au moins un evenement
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Créer le webhook
          </Button>
          <Button size="sm" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    </m.div>
  )
}

// ── Main component ───────────────────────────────────────────────────

interface WebhookManagerProps {
  /** If provided, locks the manager to a single squad. */
  squadId?: string
}

export function WebhookManager({ squadId: fixedSquadId }: WebhookManagerProps) {
  const [selectedSquadId, setSelectedSquadId] = useState<string>(fixedSquadId ?? '')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const squadId = fixedSquadId ?? selectedSquadId

  // Fetch user's squads for the squad selector
  const { data: squads } = useSquadsQuery()
  const { data: webhooks, isLoading, isError, error } = useWebhooks(squadId || undefined)

  const updateMutation = useUpdateWebhookMutation()
  const deleteMutation = useDeleteWebhookMutation()
  const testMutation = useTestWebhookMutation()

  const handleToggle = useCallback(
    (webhook: Webhook) => {
      setTogglingId(webhook.id)
      updateMutation.mutate(
        {
          id: webhook.id,
          squadId: webhook.squad_id,
          updates: { is_active: !webhook.is_active },
        },
        { onSettled: () => setTogglingId(null) }
      )
    },
    [updateMutation]
  )

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { id: deleteTarget.id, squadId: deleteTarget.squad_id },
      { onSettled: () => setDeleteTarget(null) }
    )
  }, [deleteTarget, deleteMutation])

  const handleTest = useCallback(
    (webhook: Webhook) => {
      setTestingId(webhook.id)
      testMutation.mutate({ webhook }, { onSettled: () => setTestingId(null) })
    },
    [testMutation]
  )

  // Squad selector (only shown when no fixedSquadId)
  const squadOptions = (squads ?? []).map((s) => ({
    value: s.id,
    label: `${s.name} (${s.game})`,
  }))

  return (
    <div className="space-y-4">
      {/* Squad selector */}
      {!fixedSquadId && (
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">
            Squad
          </label>
          <Select
            value={selectedSquadId}
            onChange={(v) => setSelectedSquadId(v as string)}
            options={squadOptions}
            placeholder="Choisis un squad"
          />
        </div>
      )}

      {/* Content area */}
      {!squadId ? (
        <div className="text-center py-8">
          <WebhookIcon className="w-10 h-10 text-text-quaternary mx-auto mb-3" />
          <p className="text-base text-text-secondary">
            Selectionne un squad pour gerer ses webhooks
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-base text-text-secondary">Chargement...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-base text-error mb-2">Erreur de chargement</p>
          <p className="text-sm text-text-quaternary">
            {(error as Error)?.message ?? 'La table webhooks n\'existe peut-etre pas encore'}
          </p>
        </div>
      ) : (
        <>
          {/* Header with create button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-quaternary">
              {webhooks && webhooks.length > 0
                ? `${webhooks.length} webhook${webhooks.length > 1 ? 's' : ''} configure${webhooks.length > 1 ? 's' : ''}`
                : 'Aucun webhook configure'}
            </p>
            {!showCreateForm && (
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            )}
          </div>

          {/* Create form */}
          <AnimatePresence>
            {showCreateForm && (
              <CreateWebhookForm
                squadId={squadId}
                onCreated={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            )}
          </AnimatePresence>

          {/* Webhook list */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {(webhooks ?? []).map((webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  onToggle={() => handleToggle(webhook)}
                  onDelete={() => setDeleteTarget(webhook)}
                  onTest={() => handleTest(webhook)}
                  isToggling={togglingId === webhook.id}
                  isTesting={testingId === webhook.id}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {webhooks && webhooks.length === 0 && !showCreateForm && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 px-4"
            >
              <WebhookIcon className="w-12 h-12 text-text-quaternary mx-auto mb-3 opacity-50" />
              <p className="text-base text-text-secondary mb-1">Pas encore de webhook</p>
              <p className="text-sm text-text-quaternary mb-4">
                Connecte Discord, Notion ou Google Sheets à ta squad en ajoutant un webhook.
              </p>
              <Button size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                Créer mon premier webhook
              </Button>
            </m.div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer ce webhook ?"
        description={`Le webhook vers ${deleteTarget?.url ?? ''} sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default WebhookManager
