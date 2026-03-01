import { m } from 'framer-motion'
import { Mic, Users } from '../../components/icons'
import { Link } from 'react-router'
import { Card } from '../../components/ui'

export function PartyEmptyState() {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-8 text-center bg-gradient-to-br from-primary/[0.08] to-transparent border-primary">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <m.div
            className="absolute inset-0 rounded-2xl bg-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <m.div
            className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-md shadow-primary/15"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Mic className="w-8 h-8 text-white" strokeWidth={1.5} />
          </m.div>
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">Lance ta première party vocale</h2>
        <p className="text-base text-text-secondary mb-2 max-w-[300px] mx-auto leading-relaxed">
          Qualité HD, latence ultra-faible — parle avec ta squad comme si vous étiez dans la même pièce.
        </p>
        <p className="text-sm text-text-quaternary mb-6 max-w-[280px] mx-auto">
          Crée ou rejoins une squad pour débloquer le voice chat.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/squads"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-bg text-white font-medium shadow-md shadow-primary/10 hover:bg-primary-bg-hover transition-colors"
          >
            <Users className="w-4 h-4" /> Créer une squad
          </Link>
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card text-text-primary text-sm font-medium border border-border-subtle hover:border-border-hover transition-colors"
          >
            Découvrir des squads
          </Link>
        </div>
      </Card>
    </m.div>
  )
}
