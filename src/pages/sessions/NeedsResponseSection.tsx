import { m } from 'framer-motion'
import { Calendar, ChevronRight, PartyPopper, CheckCircle2 } from '../../components/icons'
import { Link } from 'react-router'
import { Card } from '../../components/ui'
import type { SessionEntry } from './types'
import { formatDate } from './types'

interface NeedsResponseSectionProps {
  needsResponse: SessionEntry[]
}

export function NeedsResponseSection({ needsResponse }: NeedsResponseSectionProps) {
  if (needsResponse.length === 0) return null
  return (
    <section className="mb-6" aria-label="Sessions en attente de réponse">
      <div className="p-4 rounded-xl bg-warning-5 border border-warning" role="alert">
        <div className="flex items-center gap-3 mb-3">
          <m.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3, repeatDelay: 2 }}
          >
            <PartyPopper className="w-5 h-5 text-warning" />
          </m.div>
          <h2 className="text-base font-semibold text-text-primary">
            Ta squad t'attend ! {needsResponse.length} session{needsResponse.length > 1 ? 's' : ''}{' '}
            à confirmer
          </h2>
        </div>
        <p className="text-base text-text-secondary mb-3">
          👉 <span className="text-text-primary">Réponds maintenant</span> — sans ta réponse,
          ta squad ne peut pas s'organiser. Chaque réponse rapide booste ta fiabilité de +5 %.
        </p>
        <ul className="space-y-2" aria-label="Sessions en attente">
          {needsResponse.slice(0, 3).map((session) => (
            <li key={session.id}>
              <Link to={`/session/${session.id}`}>
                <m.div
                  className="flex items-center gap-3 p-3 rounded-lg bg-overlay-heavy hover:bg-border-subtle"
                  whileHover={{ x: 4 }}
                >
                  <Calendar className="w-4 h-4 text-warning" aria-hidden="true" />
                  <span className="flex-1 text-base text-text-primary">
                    {session.title || session.game || 'Session'}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {formatDate(session.scheduled_at)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
                </m.div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

interface AllCaughtUpProps {
  needsResponse: number
  confirmed: number
}

export function AllCaughtUp({ needsResponse, confirmed }: AllCaughtUpProps) {
  if (needsResponse !== 0 || confirmed <= 0) return null
  return (
    <div className="mb-6">
      <Card className="p-4 bg-gradient-to-r from-success-5 to-transparent border-success">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-success">🎯 T'es à jour !</h3>
            <p className="text-sm text-text-secondary">
              Ta squad sait qu'elle peut compter sur toi
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
