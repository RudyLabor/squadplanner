"use client";

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Crown,
  Copy,
  Check,
  MessageCircle,
  Settings,
  X,
} from '../icons'
import { Link } from 'react-router-dom'
import { Button } from '../ui'
import { showSuccess } from '../../lib/toast'
import { useUpdateSquadMutation } from '../../hooks/queries'
import { InviteModal } from './InviteModal'

// Re-export InviteModal for barrel consumers
export { InviteModal } from './InviteModal'

interface SquadHeaderProps {
  squadId: string
  squad: {
    id: string
    name: string
    game: string
    member_count?: number
    invite_code: string
    owner_id: string
    members?: Array<{ user_id: string }>
  }
  isOwner: boolean
}

export function SquadHeader({ squadId, squad, isOwner }: SquadHeaderProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleCopyCode = async () => {
    if (!squad.invite_code) return
    await navigator.clipboard.writeText(squad.invite_code)
    setCopiedCode(true)
    showSuccess('Code copié ! ')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <>
      <m.div className="mb-6" layoutId={`squad-card-${squadId}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary truncate">{squad.name}</h1>
              {isOwner && <Crown className="w-5 h-5 text-warning flex-shrink-0" />}
            </div>
            <p className="text-base text-text-tertiary">
              {squad.game} · {squad.member_count} membre{(squad.member_count || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)} aria-label="Modifier la squad">
                <Settings className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
            <Link to={`/messages?squad=${squad.id}`} aria-label="Ouvrir les messages de cette squad">
              <Button variant="ghost" size="sm" aria-label="Ouvrir les messages">
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Code d'invitation */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-10 border border-primary/20">
          <div className="flex-1">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-0.5">Code d'invitation</p>
            <p className="text-xl font-bold text-primary tracking-wider">{squad.invite_code}</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleCopyCode} aria-label="Copier le code d'invitation">
            {copiedCode ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copiedCode ? 'Copié !' : 'Copier'}
          </Button>
        </div>
      </m.div>

      {/* Modal d'invitation */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            squadId={squadId}
            squadName={squad.name}
            inviteCode={squad.invite_code || ''}
            existingMemberIds={squad.members?.map((m) => m.user_id) || []}
          />
        )}
      </AnimatePresence>

      {/* Modal d'edition */}
      <AnimatePresence>
        {showEditModal && (
          <EditSquadModal
            squadId={squadId}
            initialName={squad.name}
            initialGame={squad.game}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function EditSquadModal({ squadId, initialName, initialGame, onClose }: {
  squadId: string; initialName: string; initialGame: string; onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [game, setGame] = useState(initialGame)
  const [description, setDescription] = useState('')
  const updateMutation = useUpdateSquadMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !game.trim()) return
    await updateMutation.mutateAsync({ squadId, name: name.trim(), game: game.trim(), description: description.trim() || undefined })
    onClose()
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <m.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-md rounded-2xl bg-bg-elevated border border-border-subtle p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">Modifier la squad</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Nom</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-bg-surface border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Jeu</label>
            <input
              type="text"
              value={game}
              onChange={e => setGame(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-bg-surface border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Decris ta squad..."
              className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:border-primary focus:outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending || !name.trim() || !game.trim()}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </m.div>
    </m.div>
  )
}
