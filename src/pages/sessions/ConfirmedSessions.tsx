import { memo } from 'react'
import { m } from 'framer-motion'
import { Calendar, Plus, Clock, Users } from '../../components/icons'
import { Link } from 'react-router'
import { Button, Card, Badge, SessionCardSkeleton, ContentTransition } from '../../components/ui'
import type { SessionEntry } from './types'
import { formatDate } from './types'

interface ConfirmedSessionsProps {
  confirmed: SessionEntry[]
  sessionsLoading: boolean
}

export const ConfirmedSessions = memo(function ConfirmedSessions({
  confirmed,
  sessionsLoading,
}: ConfirmedSessionsProps) {
  return (
    <section className="mb-8" aria-label="Sessions confirmées">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium text-text-tertiary tracking-wide">
          Sessions confirmées
        </h2>
        {!sessionsLoading && <Badge variant="success">{confirmed.length}</Badge>}
      </div>
      <ContentTransition
        isLoading={sessionsLoading}
        skeleton={
          <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
            <SessionCardSkeleton />
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </div>
        }
      >
        {confirmed.length > 0 ? (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0 list-none">
            {confirmed.map((session) => (
              <li key={session.id}>
                <Link to={`/session/${session.id}`}>
                  <m.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.99 }}>
                    <Card className="p-4 transition-interactive hover:shadow-glow-success card-interactive">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success-10 flex items-center justify-center shrink-0">
                          <Calendar
                            className="w-6 h-6 text-success"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="text-md font-medium text-text-primary truncate">
                              {session.title || session.game || 'Session'}
                            </h3>
                            <Badge variant="success" className="shrink-0">
                              Confirmé
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-base text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              {formatDate(session.scheduled_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              {session.rsvp_counts?.present || 0} présents
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </m.div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 text-center">
              <m.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
              >
                <Calendar className="w-12 h-12 mx-auto mb-4 text-text-tertiary" strokeWidth={1} />
              </m.div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Aucune session confirmée
              </h3>
              <p className="text-md text-text-secondary mb-4">
                Réponds "Présent" à une session pour la voir ici.
              </p>
              <Link to="/squads">
                <Button variant="secondary" size="sm">
                  <Plus className="w-4 h-4" />
                  Voir mes squads
                </Button>
              </Link>
            </Card>
          </m.div>
        )}
      </ContentTransition>
    </section>
  )
})

export function HowItWorksSection() {
  return (
    <section aria-label="Guide des sessions">
      <Card className="p-6">
        <h2 className="text-md font-semibold text-text-primary mb-4">
          Comment fonctionnent les sessions ?
        </h2>
        <ol className="space-y-3 list-none">
          {[
            { num: '1', text: 'Un membre de ta squad propose un créneau' },
            { num: '2', text: 'Tu cliques "Présent", "Absent" ou "Peut-être"' },
            { num: '3', text: "À l'heure, tu fais ton check-in" },
            { num: '4', text: 'Ton score de fiabilité augmente !' },
          ].map((step) => (
            <li key={step.num} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-lg bg-primary-10 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-sm font-bold text-primary">{step.num}</span>
              </div>
              <span className="text-base text-text-secondary">{step.text}</span>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  )
}
