import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Zap, Check, Crown, Sparkles, BarChart3,
  Mic2, Calendar, Users, Infinity as InfinityIcon, Loader2
} from 'lucide-react'
import { Button } from './ui'
import { useSubscriptionStore } from '../hooks'
import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from '../hooks/usePremium'
import { useFocusTrap } from '../hooks/useFocusTrap'

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

  // Focus trap et gestion Escape pour l'accessibilité
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  const handleUpgrade = async () => {
    if (!squadId) {
      setError('Sélectionne d\'abord une squad')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const priceId = selectedPlan === 'monthly'
        ? plans.find(p => p.id === 'premium_monthly')?.stripePriceId
        : plans.find(p => p.id === 'premium_yearly')?.stripePriceId

      if (!priceId) {
        throw new Error('Plan non trouve')
      }

      const { url, error } = await createCheckoutSession(squadId, priceId)

      if (error) throw error
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="premium-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 overflow-hidden rounded-2xl"
          >
            <div className="h-full bg-[#101012] border border-[rgba(255,255,255,0.08)] rounded-2xl flex flex-col overflow-hidden">
              {/* Header gradient */}
              <div className="relative bg-gradient-to-br from-[#6366f1] via-[#a78bfa] to-[#fbbf24] p-6 pb-8">
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
                    <h2 id="premium-modal-title" className="text-[20px] font-bold text-white">Passe Premium</h2>
                    <p className="text-[14px] text-white/80">Débloquer toutes les features</p>
                  </div>
                </div>

                {feature && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-[13px]">
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
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPlan === 'monthly'
                        ? 'border-[#6366f1] bg-[rgba(99,102,241,0.1)]'
                        : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <div className="text-[13px] text-[#8b8d90] mb-1">Mensuel</div>
                    <div className="text-[24px] font-bold text-[#f7f8f8]">
                      {PREMIUM_PRICE_MONTHLY.toFixed(2)}
                      <span className="text-[14px] font-normal text-[#5e6063]">/mois</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPlan('yearly')}
                    className={`p-4 rounded-xl border-2 transition-all relative ${
                      selectedPlan === 'yearly'
                        ? 'border-[#34d399] bg-[rgba(52,211,153,0.1)]'
                        : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <div className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-[#34d399] text-xs font-bold text-[#050506]">
                      -20%
                    </div>
                    <div className="text-[13px] text-[#8b8d90] mb-1">Annuel</div>
                    <div className="text-[24px] font-bold text-[#f7f8f8]">
                      {(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}
                      <span className="text-[14px] font-normal text-[#5e6063]">/mois</span>
                    </div>
                    <div className="text-xs text-[#34d399]">2 mois offerts</div>
                  </button>
                </div>

                {/* Features list */}
                <div className="space-y-3">
                  {PREMIUM_FEATURES.map((feat, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[rgba(99,102,241,0.15)] flex items-center justify-center flex-shrink-0">
                        <feat.icon className="w-4 h-4 text-[#6366f1]" />
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#f7f8f8]">{feat.title}</div>
                        <div className="text-[12px] text-[#5e6063]">{feat.description}</div>
                      </div>
                      <Check className="w-4 h-4 text-[#34d399] flex-shrink-0 mt-1" />
                    </div>
                  ))}
                </div>

                {/* Error message */}
                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-[rgba(251,113,133,0.1)] border border-[rgba(251,113,133,0.2)]">
                    <p className="text-[#fb7185] text-[13px]">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="p-6 pt-0">
                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading || !squadId}
                  className="w-full h-12 bg-gradient-to-r from-[#6366f1] to-[#a78bfa] hover:opacity-90"
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
                <p className="text-xs text-[#5e6063] text-center mt-3">
                  Annulation possible à tout moment. Satisfait ou remboursé 30 jours.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PremiumUpgradeModal
