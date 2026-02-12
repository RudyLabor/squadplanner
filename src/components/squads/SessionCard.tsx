import { memo } from 'react'
import { m } from 'framer-motion'
import { Calendar, Clock, Users, ChevronRight, CheckCircle2, XCircle, HelpCircle } from '../icons'
import { Link } from 'react-router'
import { Card, Badge, Tooltip } from '../ui'

export const SessionCard = memo(function SessionCard({
  session,
  onRsvp,
}: {
  session: {
    id: string
    title?: string | null
    game?: string | null
    scheduled_at: string
    status: string
    rsvp_counts?: { present: number; absent: number; maybe: number }
    my_rsvp?: 'present' | 'absent' | 'maybe' | null
  }
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
}) {
  const date = new Date(session.scheduled_at)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const isPast = diffMs < 0 && session.status !== 'cancelled'
  const isToday = diffHours >= 0 && diffHours < 24
  const isTomorrow = diffHours >= 24 && diffHours < 48

  let timeLabel = ''
  if (isPast) {
    timeLabel = 'Passée'
  } else if (diffHours < 1 && diffHours >= 0) {
    timeLabel = 'Maintenant !'
  } else if (isToday) {
    timeLabel = `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else if (isTomorrow) {
    timeLabel = `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    timeLabel =
      date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ` \u00B7 ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const getStatusBadge = () => {
    if (session.status === 'cancelled') return { label: 'Annulée', variant: 'danger' as const }
    if (session.status === 'confirmed') return { label: 'Confirmée', variant: 'success' as const }
    if (isPast) return { label: 'Passée', variant: 'default' as const }
    return null
  }

  const statusBadge = getStatusBadge()
  const canRsvp = !isPast && session.status !== 'cancelled'

  return (
    <Card
      className={`p-4 transition-interactive hover:shadow-glow-primary-sm ${isToday && !isPast ? 'border-warning/30 hover:shadow-glow-warning-sm' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isToday && !isPast ? 'bg-warning/15' : 'bg-primary/15'
          }`}
        >
          <Calendar
            className={`w-6 h-6 ${isToday && !isPast ? 'text-warning' : 'text-primary'}`}
            strokeWidth={1.5}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-md font-medium text-text-primary truncate">
              {session.title || session.game || 'Session'}
            </h3>
            {statusBadge && (
              <Tooltip
                content={
                  statusBadge.label === 'Confirmée'
                    ? 'Assez de joueurs ont confirmé leur présence.'
                    : statusBadge.label === 'Annulée'
                      ? "Cette session a été annulée par l'organisateur."
                      : 'Cette session est terminée.'
                }
                position="top"
                delay={200}
              >
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-3 text-base text-text-tertiary mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {session.rsvp_counts?.present || 0} present
              {(session.rsvp_counts?.present || 0) > 1 ? 's' : ''}
            </span>
          </div>

          {canRsvp && (
            <div className="flex gap-2">
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault()
                  onRsvp(session.id, 'present')
                }}
                aria-label="Marquer comme present"
                aria-pressed={session.my_rsvp === 'present'}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-interactive ${
                  session.my_rsvp === 'present'
                    ? 'bg-success/20 text-success border border-success/30 shadow-glow-success'
                    : 'bg-surface-card text-text-tertiary hover:bg-success-10 hover:text-success hover:border-success/20 border border-transparent'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Present
              </m.button>
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault()
                  onRsvp(session.id, 'maybe')
                }}
                aria-label="Marquer comme peut-etre"
                aria-pressed={session.my_rsvp === 'maybe'}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-interactive ${
                  session.my_rsvp === 'maybe'
                    ? 'bg-warning/20 text-warning border border-warning/30 shadow-glow-warning'
                    : 'bg-surface-card text-text-tertiary hover:bg-warning-10 hover:text-warning hover:border-warning/20 border border-transparent'
                }`}
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                Peut-etre
              </m.button>
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault()
                  onRsvp(session.id, 'absent')
                }}
                aria-label="Marquer comme absent"
                aria-pressed={session.my_rsvp === 'absent'}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-interactive ${
                  session.my_rsvp === 'absent'
                    ? 'bg-error/20 text-error border border-error/30 shadow-glow-error'
                    : 'bg-surface-card text-text-tertiary hover:bg-error-10 hover:text-error hover:border-error/20 border border-transparent'
                }`}
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Absent
              </m.button>
            </div>
          )}
        </div>

        <Link to={`/session/${session.id}`} onClick={(e) => e.stopPropagation()}>
          <ChevronRight className="w-5 h-5 text-text-quaternary" />
        </Link>
      </div>
    </Card>
  )
})
