import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Crown, Copy, Check, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui'
import { showSuccess } from '../../lib/toast'
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
          <Link to={`/messages?squad=${squad.id}`} aria-label="Ouvrir les messages de cette squad">
            <Button variant="ghost" size="sm" aria-label="Ouvrir les messages">
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Link>
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
    </>
  )
}
