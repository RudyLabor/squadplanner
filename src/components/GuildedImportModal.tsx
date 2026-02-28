import { useState } from 'react'
import { m } from 'framer-motion'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from './ui/Dialog'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import {
  Users,
  Gamepad2,
  Check,
  Copy,
  Loader2,
  ArrowRight,
  Gift,
} from './icons'
import { useGuildedImport, type GuildedImportResult } from '../hooks/useGuildedImport'
import { GAMES } from '../data/games'
import { showSuccess } from '../lib/toast'

interface GuildedImportModalProps {
  open: boolean
  onClose: () => void
}

const ease = [0.16, 1, 0.3, 1] as const

export function GuildedImportModal({ open, onClose }: GuildedImportModalProps) {
  const [serverName, setServerName] = useState('')
  const [game, setGame] = useState('')
  const [description, setDescription] = useState('')
  const [memberNames, setMemberNames] = useState('')
  const [result, setResult] = useState<GuildedImportResult | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  const importMutation = useGuildedImport()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverName.trim() || !game.trim()) return

    importMutation.mutate(
      {
        serverName: serverName.trim(),
        game: game.trim(),
        description: description.trim() || undefined,
        memberNames: memberNames.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data)
        },
      }
    )
  }

  const handleCopyCode = () => {
    if (!result) return
    navigator.clipboard.writeText(result.inviteCode)
    setCodeCopied(true)
    showSuccess("Code d'invitation copie !")
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleClose = () => {
    // Reset state on close
    setServerName('')
    setGame('')
    setDescription('')
    setMemberNames('')
    setResult(null)
    setCodeCopied(false)
    importMutation.reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} size="md" title="Importer depuis Guilded">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Importer depuis Guilded</h2>
            <p className="text-sm text-text-secondary">
              Cree une squad a partir de ton serveur Guilded
            </p>
          </div>
        </div>
      </DialogHeader>

      <DialogBody>
        {result ? (
          /* ─── Success State ─── */
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="py-4 space-y-6"
          >
            {/* Success icon */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Squad creee !
              </h3>
              <p className="text-text-secondary">
                Partage ce code avec tes membres :
              </p>
            </div>

            {/* Invite code */}
            <div className="flex items-center justify-center gap-3">
              <div className="px-6 py-3 rounded-xl bg-surface-card border border-border-default">
                <code className="text-2xl font-bold font-mono text-text-primary tracking-wider">
                  {result.inviteCode}
                </code>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyCode}
                leftIcon={codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {codeCopied ? 'Copie !' : 'Copier'}
              </Button>
            </div>

            {/* Squad info */}
            <div className="p-4 rounded-xl bg-surface-card border border-border-default">
              <div className="flex items-center gap-3 mb-2">
                <Gamepad2 className="w-5 h-5 text-text-tertiary" />
                <span className="text-text-primary font-medium">{result.squadName}</span>
              </div>
              <p className="text-sm text-text-tertiary">
                {result.memberCount} membre{result.memberCount > 1 ? 's' : ''} (invite tes potes avec le code ci-dessus)
              </p>
            </div>

            {/* Promo code banner */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease }}
              className="p-4 rounded-xl bg-gradient-to-br from-purple/10 to-primary/5 border border-purple/15"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Gift className="w-4 h-4 text-purple" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary mb-1">
                    Offre speciale migrés Guilded
                  </p>
                  <p className="text-sm text-text-secondary">
                    Utilise le code{' '}
                    <code className="px-2 py-0.5 rounded bg-purple/10 text-purple font-bold">
                      GUILDED30
                    </code>{' '}
                    pour 30% sur ton premier mois Premium
                  </p>
                </div>
              </div>
            </m.div>
          </m.div>
        ) : (
          /* ─── Import Form ─── */
          <form id="guilded-import-form" onSubmit={handleSubmit} className="py-4 space-y-5">
            {/* Server Name */}
            <div>
              <label
                htmlFor="guilded-server-name"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Nom du serveur Guilded
              </label>
              <input
                type="text"
                id="guilded-server-name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Ex: Les Champions de Valorant"
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
              />
            </div>

            {/* Game */}
            <div>
              <label
                htmlFor="guilded-game"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Jeu principal
              </label>
              <select
                id="guilded-game"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary focus:outline-none focus:border-primary transition-interactive"
              >
                <option value="">Selectionne un jeu</option>
                {GAMES.map((g) => (
                  <option key={g.slug} value={g.name}>
                    {g.icon} {g.name}
                  </option>
                ))}
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Description (optional) */}
            <div>
              <label
                htmlFor="guilded-description"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Description{' '}
                <span className="text-text-quaternary font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                id="guilded-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Une courte description de ton serveur"
                className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
              />
            </div>

            {/* Members (optional) */}
            <div>
              <label
                htmlFor="guilded-members"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Membres a inviter{' '}
                <span className="text-text-quaternary font-normal">(optionnel, un par ligne)</span>
              </label>
              <textarea
                id="guilded-members"
                value={memberNames}
                onChange={(e) => setMemberNames(e.target.value)}
                placeholder={"NomJoueur1\nNomJoueur2\nNomJoueur3"}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive resize-none font-mono text-sm"
              />
              <p className="text-xs text-text-quaternary mt-1">
                Tu pourras leur envoyer le code d'invitation apres la creation.
              </p>
            </div>

            {importMutation.isError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-error text-sm">
                  {importMutation.error?.message || "Erreur lors de l'import"}
                </p>
              </div>
            )}
          </form>
        )}
      </DialogBody>

      <DialogFooter>
        {result ? (
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleClose}>
              Fermer
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleClose()
                // Navigate to the new squad
                window.location.href = `/squad/${result.squadId}`
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Voir ma squad
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="guilded-import-form"
              disabled={importMutation.isPending || !serverName.trim() || !game.trim()}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Creer la squad
                </>
              )}
            </Button>
          </div>
        )}
      </DialogFooter>
    </Dialog>
  )
}
