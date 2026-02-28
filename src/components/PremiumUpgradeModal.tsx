import { useState } from 'react'
import { Zap, Check, Crown, Loader2, X } from './icons'
import { Button, ResponsiveModal } from './ui'
import { useSubscriptionStore } from '../hooks'
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
  SQUAD_LEADER_PRICE_MONTHLY,
  SQUAD_LEADER_PRICE_YEARLY,
  FEATURE_MIN_TIER,
} from '../hooks/usePremium'
import type { SubscriptionTier } from '../types/database'

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  squadId?: string
  feature?: string
}

const UPGRADE_TIERS = [
  {
    tier: 'premium' as SubscriptionTier,
    name: 'Premium',
    monthlyPrice: PREMIUM_PRICE_MONTHLY,
    yearlyPrice: PREMIUM_PRICE_YEARLY,
    highlights: ['5 squads', 'Sessions illimitées', 'Chat complet', 'Stats avancées', 'IA Coach'],
    gradient: 'from-primary to-primary/80',
    borderColor: 'border-primary',
    bgColor: 'bg-primary/5',
    popular: false,
  },
  {
    tier: 'squad_leader' as SubscriptionTier,
    name: 'Squad Leader',
    monthlyPrice: SQUAD_LEADER_PRICE_MONTHLY,
    yearlyPrice: SQUAD_LEADER_PRICE_YEARLY,
    highlights: [
      'Tout Premium',
      'Squads illimités',
      'Audio HD',
      'Dashboard analytics',
      'Sessions récurrentes',
    ],
    gradient: 'from-warning to-warning/80',
    borderColor: 'border-warning',
    bgColor: 'bg-warning/5',
    popular: true,
  },
]

// Determine the recommended tier based on the feature being gated
function getRecommendedTier(feature?: string): SubscriptionTier {
  if (!feature) return 'premium'
  for (const [key, tier] of Object.entries(FEATURE_MIN_TIER)) {
    const label = key.replace(/_/g, ' ').toLowerCase()
    if (feature.toLowerCase().includes(label)) return tier
  }
  return 'premium'
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  squadId,
  feature,
}: PremiumUpgradeModalProps) {
  const recommended = getRecommendedTier(feature)
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    recommended === 'club' ? 'squad_leader' : recommended
  )
  const [isYearly, setIsYearly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { createCheckoutSession, plans } = useSubscriptionStore()

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const planId = `${selectedTier}_${isYearly ? 'yearly' : 'monthly'}`
      const priceId = plans.find((p) => p.id === planId)?.stripePriceId

      if (!priceId) {
        throw new Error('Plan non trouvé')
      }

      const { url, error } = await createCheckoutSession(
        priceId,
        selectedTier,
        squadId || undefined
      )

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

  const activeTier = UPGRADE_TIERS.find((t) => t.tier === selectedTier) || UPGRADE_TIERS[0]
  const totalLabel = isYearly
    ? `${activeTier.yearlyPrice.toFixed(2)}€/an`
    : `${activeTier.monthlyPrice.toFixed(2)}€/mois`

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
            <h2 className="text-xl font-bold text-white">Débloque cette feature</h2>
            <p className="text-md text-white/80">Essaie 7 jours gratuit — sans carte bancaire</p>
          </div>
        </div>

        {feature && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-base">
            <Zap className="w-4 h-4" />
            <span>Pour accéder à : {feature}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tier selector */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {UPGRADE_TIERS.map((t) => (
            <button
              key={t.tier}
              onClick={() => setSelectedTier(t.tier)}
              className={`p-4 rounded-xl border-2 transition-interactive text-left relative ${
                selectedTier === t.tier
                  ? `${t.borderColor} ${t.bgColor}`
                  : 'border-border-hover hover:border-overlay-medium'
              }`}
            >
              {t.popular && (
                <div className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-warning text-xs font-bold text-bg-base">
                  POPULAIRE
                </div>
              )}
              <div className="flex items-center gap-1.5 mb-1">
                {t.popular && <Crown className="w-3.5 h-3.5 text-warning" />}
                <span className="text-md font-semibold text-text-primary">{t.name}</span>
              </div>
              <div className="text-lg font-bold text-text-primary">
                {(isYearly ? t.yearlyPrice / 12 : t.monthlyPrice).toFixed(2)}€
                <span className="text-sm font-normal text-text-tertiary">/mois</span>
              </div>
            </button>
          ))}
        </div>

        {/* Interval toggle */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 p-0.5 rounded-lg bg-bg-elevated border border-border-default">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !isYearly ? 'bg-primary-bg text-white' : 'text-text-tertiary'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isYearly ? 'bg-success-bg text-white' : 'text-text-tertiary'
              }`}
            >
              Annuel
              <span className="px-1 py-0.5 rounded text-xs font-bold bg-black/25 text-white">
                2 mois offerts
              </span>
            </button>
          </div>
        </div>

        {/* Features list for selected tier */}
        <div className="space-y-2">
          {activeTier.highlights.map((feat) => (
            <div key={feat} className="flex items-center gap-3 p-3 rounded-xl bg-surface-card">
              <Check
                className={`w-4 h-4 flex-shrink-0 ${activeTier.popular ? 'text-warning' : 'text-success'}`}
              />
              <span className="text-md text-text-primary">{feat}</span>
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
          className={`w-full h-12 bg-gradient-to-r ${activeTier.gradient} hover:opacity-90 ${
            activeTier.popular ? 'text-bg-base' : 'text-white'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {activeTier.popular ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              Choisir {activeTier.name} — {totalLabel}
            </>
          )}
        </Button>
        <p className="text-xs text-text-tertiary text-center mt-3">
          Annulation en 1 clic. Remboursé sous 30 jours. Zéro risque.
        </p>
      </div>
    </ResponsiveModal>
  )
}

export default PremiumUpgradeModal
