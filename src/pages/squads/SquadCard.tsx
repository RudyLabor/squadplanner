import { memo } from 'react'
import { m } from 'framer-motion'
import {
  Gamepad2,
  Copy,
  Check,
  Crown,
  Mic,
  Calendar,
  ChevronRight,
} from '../../components/icons'
import { Link } from 'react-router'
import { Card, CardContent } from '../../components/ui'

export interface SquadNextSession {
  squadId: string
  sessionTitle?: string
  scheduledAt: string
  rsvpCount: number
}

export const SquadCard = memo(function SquadCard({ squad, isOwner, nextSession, hasActiveParty, copiedCode, onCopyCode }: {
  squad: {
    id: string
    name: string
    game: string
    invite_code: string
    member_count?: number
    total_members?: number
  }
  isOwner: boolean
  nextSession?: SquadNextSession
  hasActiveParty: boolean
  copiedCode: string | null
  onCopyCode: (code: string) => void
}) {
  const memberCount = squad.member_count || squad.total_members || 1

  // Formatage de la prochaine session
  let sessionLabel = ''
  if (nextSession) {
    const date = new Date(nextSession.scheduledAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMs < 0) {
      sessionLabel = 'Session en cours'
    } else if (diffHours < 1) {
      sessionLabel = 'Dans moins d\'1h'
    } else if (diffHours < 24) {
      sessionLabel = `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      sessionLabel = `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      sessionLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    }
  }

  return (
    <m.article
      layoutId={`squad-card-${squad.id}`}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-labelledby={`squad-name-${squad.id}`}
    >
      <Link to={`/squad/${squad.id}`}>
        <Card className={`cursor-pointer transition-interactive ${
          hasActiveParty
            ? 'border-success/30 shadow-glow-success bg-gradient-to-r from-success/5 to-transparent'
            : 'hover:border-primary/25 hover:shadow-glow-primary-sm'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icone avec indicateur party */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  hasActiveParty
                    ? 'bg-success/15'
                    : 'bg-primary/15'
                }`}>
                  {hasActiveParty ? (
                    <Mic className="w-6 h-6 text-success" strokeWidth={1.5} />
                  ) : (
                    <Gamepad2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  )}
                </div>
                {hasActiveParty && (
                  <m.div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-bg-elevated"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: 3 }}
                  />
                )}
              </div>

              {/* Infos squad */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 id={`squad-name-${squad.id}`} className="text-md font-semibold text-text-primary truncate">{squad.name}</h3>
                  {isOwner && (
                    <Crown className="w-4 h-4 text-warning flex-shrink-0" />
                  )}
                </div>
                <p className="text-base text-text-tertiary">
                  {squad.game} · {memberCount} membre{memberCount > 1 ? 's' : ''}
                </p>

                {/* Prochaine session ou etat */}
                <div className="mt-2">
                  {hasActiveParty ? (
                    <div className="flex items-center gap-1.5 text-sm text-success">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Party en cours</span>
                    </div>
                  ) : nextSession ? (
                    <div className="flex items-center gap-1.5 text-sm text-primary">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{sessionLabel}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-text-quaternary">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Aucune session planifiée</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onCopyCode(squad.invite_code)
                  }}
                  className="p-2 rounded-lg hover:bg-surface-card-hover transition-colors"
                  aria-label="Copier le code d'invitation"
                >
                  <m.div
                    key={copiedCode === squad.invite_code ? 'check' : 'copy'}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {copiedCode === squad.invite_code ? (
                      <Check className="w-4 h-4 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-quaternary" aria-hidden="true" />
                    )}
                  </m.div>
                </button>
                <ChevronRight className="w-5 h-5 text-text-quaternary" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </m.article>
  )
})
