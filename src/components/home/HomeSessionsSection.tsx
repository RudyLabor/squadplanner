import { memo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, CheckCircle2, HelpCircle, XCircle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, Badge, SessionCardSkeleton, ContentTransition } from '../ui'

interface UpcomingSession {
  id: string
  title?: string | null
  game?: string | null
  scheduled_at: string
  status: string
  squad_id: string
  squad_name: string
  rsvp_counts: { present: number; absent: number; maybe: number }
  my_rsvp: 'present' | 'absent' | 'maybe' | null
  total_members: number
}

const NextSessionCard = memo(function NextSessionCard({
  session,
  onRsvp,
  isRsvpLoading,
}: {
  session: UpcomingSession
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
  isRsvpLoading?: boolean
}) {
  const scheduledDate = new Date(session.scheduled_at)
  const now = new Date()
  const diffMs = scheduledDate.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let timeLabel = ''
  if (diffMs < 0) {
    timeLabel = 'En cours'
  } else if (diffHours < 1) {
    timeLabel = "Dans moins d'1h"
  } else if (diffHours < 24) {
    timeLabel = `Dans ${diffHours}h`
  } else if (diffDays === 1) {
    timeLabel = 'Demain'
  } else {
    timeLabel = `Dans ${diffDays} jours`
  }

  const timeFormatted = scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateFormatted = scheduledDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

  const hasResponded = session.my_rsvp !== null
  const canRsvp = diffMs > -2 * 60 * 60 * 1000

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="p-4 border-l-4 border-l-primary bg-gradient-to-br from-primary/8 via-transparent to-success/3 hover:from-primary/12 hover:to-success/6 hover:shadow-glow-primary-sm transition-interactive">
        <Link to={`/squad/${session.squad_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-md font-semibold text-text-primary hover:text-primary transition-colors duration-400">
                {session.title || session.game || 'Session'}
              </div>
              <div className="text-base text-text-tertiary">{session.squad_name}</div>
            </div>
            <Badge variant={diffMs < 0 ? 'success' : diffHours < 24 ? 'warning' : 'default'}>
              {timeLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-base text-text-tertiary mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{dateFormatted} · {timeFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{session.rsvp_counts.present}/{session.total_members}</span>
            </div>
          </div>
        </Link>

        {canRsvp && (
          <div className="flex gap-2 pt-2 border-t border-border-subtle">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              disabled={isRsvpLoading}
              onClick={() => onRsvp(session.id, 'present')}
              aria-label="Marquer comme présent"
              aria-pressed={session.my_rsvp === 'present'}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-interactive ${
                session.my_rsvp === 'present'
                  ? 'bg-success/15 text-success border border-success/20 shadow-glow-success'
                  : 'bg-surface-card text-text-tertiary hover:bg-success/10 hover:text-success border border-transparent hover:border-success/15'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Présent</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              disabled={isRsvpLoading}
              onClick={() => onRsvp(session.id, 'maybe')}
              aria-label="Marquer comme peut-être"
              aria-pressed={session.my_rsvp === 'maybe'}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-interactive ${
                session.my_rsvp === 'maybe'
                  ? 'bg-warning/15 text-warning border border-warning/20 shadow-glow-warning'
                  : 'bg-surface-card text-text-tertiary hover:bg-warning/10 hover:text-warning border border-transparent hover:border-warning/15'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Peut-être</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              disabled={isRsvpLoading}
              onClick={() => onRsvp(session.id, 'absent')}
              aria-label="Marquer comme absent"
              aria-pressed={session.my_rsvp === 'absent'}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-interactive ${
                session.my_rsvp === 'absent'
                  ? 'bg-error/15 text-error border border-error/20 shadow-glow-error'
                  : 'bg-surface-card text-text-tertiary hover:bg-error/10 hover:text-error border border-transparent hover:border-error/15'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Absent</span>
            </motion.button>
          </div>
        )}

        {hasResponded && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`flex items-center gap-2 text-base mt-2 pt-2 border-t border-border-subtle ${
              session.my_rsvp === 'present' ? 'text-success' :
              session.my_rsvp === 'absent' ? 'text-error' : 'text-warning'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {session.my_rsvp === 'present' ? "T'es chaud, on t'attend !" :
               session.my_rsvp === 'absent' ? 'Pas dispo cette fois' : 'En mode peut-être...'}
            </span>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
})

interface HomeSessionsSectionProps {
  upcomingSessions: UpcomingSession[]
  sessionsLoading: boolean
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
  isRsvpLoading: boolean
}

export const HomeSessionsSection = memo(function HomeSessionsSection({
  upcomingSessions,
  sessionsLoading,
  onRsvp,
  isRsvpLoading,
}: HomeSessionsSectionProps) {
  const nextSession = upcomingSessions[0]

  if (!sessionsLoading && !nextSession) return null

  return (
    <section aria-label="Prochaine session" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary">
          Prochaine session
        </h2>
        {!sessionsLoading && upcomingSessions.length > 1 && (
          <Link to="/squads" className="text-sm text-primary font-medium">
            Voir tout ({upcomingSessions.length})
          </Link>
        )}
      </div>
      <ContentTransition
        isLoading={sessionsLoading}
        skeleton={<SessionCardSkeleton />}
      >
        {nextSession && (
          <NextSessionCard session={nextSession} onRsvp={onRsvp} isRsvpLoading={isRsvpLoading} />
        )}
      </ContentTransition>
    </section>
  )
})
