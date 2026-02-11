import { useState } from 'react'
import {
  Zap,
  Check,
  Crown,
  Sparkles,
  BarChart3,
  Mic2,
  Calendar,
  Users,
  Infinity as InfinityIcon,
  Loader2,
  X,
} from './icons'
import { Button, ResponsiveModal } from './ui'
import { useSubscriptionStore } from '../hooks'
import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from '../hooks/usePremium'

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  squadId?: string
  feature?: string
}

const PREMIUM_FEATURES = [
  {
    icon: InfinityIcon,
    title: 'Squads illimités',
    description: 'Crée autant de squads que tu veux'
  },
  {
    icon: BarChart3,
    title: 'Stats avancées',
    description: 'Graphiques, tendances, analyses détaillées'
  },
  {
    icon: Sparkles,
    title: 'IA Coach avancé',
    description: 'Conseils personnalisés et prédictions'
  },
  {
    icon: Mic2,
    title: 'Audio HD',
    description: 'Qualité audio supérieure en party vocale'
  },
  {
    icon: Users,
    title: 'Rôles avancés',
    description: 'Coach, manager, permissions personnalisées'
  },
  {
    icon: Calendar,
    title: 'Export calendrier',
    description: 'Synchronise tes sessions avec ton agenda'
  }
]

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  squadId,
  feature
}: PremiumUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { createCheckoutSession, plans } = useSubscriptionStore()

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const priceId = selectedPlan === 'monthly'
        ? plans.find(p => p.id === 'premium_monthly')?.stripePriceId
        : plans.find(p => p.id === 'premium_yearly')?.stripePriceId

      if (!priceId) {
        throw new Error('Plan non trouvé')
      }

      // Premium subscription is personal, squadId is optional
      const { url, error } = await createCheckoutSession(squadId || '', priceId)

      if (error) throw error
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ResponsiveModal open={isOpen} onClose={onClose} size="md">
      {/* Header gradient */}
      <div className="relative bg-gradient-to-br from-primary via-purple to-warning p-6 pb-8">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors"
        >
          <X className="w-5 h-5 text-white" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Passe Premium</h2>
            <p className="text-md text-white/80">Débloquer toutes les features</p>
          </div>
        </div>

        {feature && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-base">
            <Zap className="w-4 h-4" />
            <span>Pour accéder à: {feature}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-xl border-2 transition-interactive ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary-10'
                : 'border-border-hover hover:border-overlay-medium'
            }`}
          >
            <div className="text-base text-text-secondary mb-1">Mensuel</div>
            <div className="text-2xl font-bold text-text-primary">
              {PREMIUM_PRICE_MONTHLY.toFixed(2)}
              <span className="text-md font-normal text-text-tertiary">/mois</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-xl border-2 transition-interactive relative ${
              selectedPlan === 'yearly'
                ? 'border-success bg-success-10'
                : 'border-border-hover hover:border-overlay-medium'
            }`}
          >
            <div className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-success text-xs font-bold text-bg-base">
              -20%
            </div>
            <div className="text-base text-text-secondary mb-1">Annuel</div>
            <div className="text-2xl font-bold text-text-primary">
              {(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}
              <span className="text-md font-normal text-text-tertiary">/mois</span>
            </div>
            <div className="text-xs text-success">2 mois offerts</div>
          </button>
        </div>

        {/* Features list */}
        <div className="space-y-3">
          {PREMIUM_FEATURES.map((feat, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-surface-card"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-15 flex items-center justify-center flex-shrink-0">
                <feat.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-md font-medium text-text-primary">{feat.title}</div>
                <div className="text-sm text-text-tertiary">{feat.description}</div>
              </div>
              <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-error-10 border border-error">
            <p className="text-error text-base">{error}</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-6 pt-0">
        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-primary to-purple hover:opacity-90"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Passer Premium - {selectedPlan === 'monthly'
                ? `${PREMIUM_PRICE_MONTHLY.toFixed(2)}/mois`
                : `${PREMIUM_PRICE_YEARLY.toFixed(2)}/an`
              }
            </>
          )}
        </Button>
        <p className="text-xs text-text-tertiary text-center mt-3">
          Annulation possible à tout moment. Satisfait ou remboursé 30 jours.
        </p>
      </div>
    </ResponsiveModal>
  )
}

export default PremiumUpgradeModal
