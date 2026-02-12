import { memo } from 'react'
import { m } from 'framer-motion'
import {
  Calendar,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Sparkles,
} from '../icons'
import { Link } from 'react-router'
import { Card, Badge, SessionCardSkeleton, ContentTransition } from '../ui'
import { EmptyStateIllustration } from '../EmptyStateIllustration'

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
    <m.div
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
            <m.button
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
            </m.button>

            <m.button
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
            </m.button>

            <m.button
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
            </m.button>
          </div>
        )}

        {hasResponded && (
          <m.div
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
          </m.div>
        )}
      </Card>
    </m.div>
  )
})

interface HomeSessionsSectionProps {
  upcomingSessions: UpcomingSession[]
  sessionsLoading: boolean
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
  isRsvpLoading: boolean
  onCreateSession?: () => void
}

// Empty state pour encourager la création de session
const SessionEmptyState = memo(function SessionEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="p-8 border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/8 via-transparent to-success/5 relative overflow-hidden">
      {/* Animated background gradient */}
      <m.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative flex flex-col items-center text-center space-y-5">
        {/* Illustration */}
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <EmptyStateIllustration type="sessions" className="w-32 h-32" />
        </m.div>

        {/* Text content */}
        <div className="space-y-2">
          <m.h3
            className="text-xl font-bold text-text-primary flex items-center justify-center gap-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Aucune session prévue
            <m.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🎮
            </m.span>
          </m.h3>
          <m.p
            className="text-base text-text-tertiary max-w-sm mx-auto"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Planifie ta première session avec ta squad !
          </m.p>
        </div>

        {/* CTA Button */}
        <m.button
          whileHover={{ scale: 1.05, y: -2, boxShadow: 'var(--shadow-glow-primary-sm)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreate}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-bold shadow-lg hover:shadow-xl transition-shadow group"
        >
          <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Créer une session
          <m.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
          </m.div>
        </m.button>

        {/* Helper text */}
        <m.p
          className="text-sm text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Ta squad recevra une notification instantanément
        </m.p>
      </div>
    </Card>
  )
})

export const HomeSessionsSection = memo(function HomeSessionsSection({
  upcomingSessions,
  sessionsLoading,
  onRsvp,
  isRsvpLoading,
  onCreateSession,
}: HomeSessionsSectionProps) {
  const nextSession = upcomingSessions[0]

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
        {nextSession ? (
          <NextSessionCard session={nextSession} onRsvp={onRsvp} isRsvpLoading={isRsvpLoading} />
        ) : onCreateSession ? (
          <SessionEmptyState onCreate={onCreateSession} />
        ) : null}
      </ContentTransition>
    </section>
  )
})
