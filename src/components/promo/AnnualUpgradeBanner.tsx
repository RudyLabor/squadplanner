import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Zap, TrendingUp } from '../icons'
import { Button } from '../ui/Button'
import { Link } from 'react-router'
import { usePremiumStore } from '../../hooks'

/**
 * Banner displayed in-app to monthly subscribers suggesting they switch to annual billing.
 * Shows estimated yearly savings based on their current tier.
 */
export function AnnualUpgradeBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { tier, hasPremium } = usePremiumStore()

  // Only show for paid subscribers (annual savings pitch)
  if (dismissed || !hasPremium || tier === 'free') return null

  const savingsMap: Record<string, string> = {
    premium: '13,98',
    squad_leader: '29,98',
    team: '49,98',
    club: '79,98',
  }
  const savings = savingsMap[tier] || '13,98'

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 mb-4 rounded-xl border border-success/20 p-4 relative"
        style={{ background: 'linear-gradient(135deg, var(--color-success-5), transparent)' }}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-bg-base/50 flex items-center justify-center hover:bg-bg-base/80 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5 text-text-tertiary" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary mb-1">
              Passe en annuel et économise {savings} €
            </p>
            <p className="text-xs text-text-tertiary mb-3">
              2 mois offerts sur ton abonnement actuel. Même features, moins cher.
            </p>
            <Link to="/premium">
              <Button variant="primary" size="sm" leftIcon={<Zap className="w-3.5 h-3.5" />}>
                Voir l'offre annuelle
              </Button>
            </Link>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}
