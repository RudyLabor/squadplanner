import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import {
  Check,
  Gift,
  ArrowRight,
  Loader2,
  Rocket,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  Crown,
  Zap,
  XCircle,
} from '../../components/icons'
import { Button, Card } from '../../components/ui'
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
  SQUAD_LEADER_PRICE_MONTHLY,
  SQUAD_LEADER_PRICE_YEARLY,
  TEAM_PRICE_MONTHLY,
  TEAM_PRICE_YEARLY,
  CLUB_PRICE_MONTHLY,
  CLUB_PRICE_YEARLY,
} from '../../hooks/usePremium'
import { useAuthStore } from '../../hooks/useAuth'
import { usePremium } from '../../hooks/usePremium'
import { useSquadsQuery } from '../../hooks/queries/useSquadsQuery'
import type { SubscriptionTier } from '../../types/database'

interface PremiumPricingProps {
  isLoading: boolean
  error: string | null
  onUpgrade: (tier: SubscriptionTier, interval: 'monthly' | 'yearly') => void
  onStartTrial: () => void
}

const TIERS = [
  {
    tier: 'premium' as SubscriptionTier,
    name: 'Premium',
    description: 'Pour les joueurs qui veulent plus de squads et zéro limite.',
    monthlyPrice: PREMIUM_PRICE_MONTHLY,
    yearlyPrice: PREMIUM_PRICE_YEARLY,
    features: [
      '5 squads — joue à tous tes jeux sans choisir',
      'Sessions illimitées — plus de limites',
      'Historique 90 jours — retrouve n\'importe quelle session',
      'Chat complet — GIF, vocal, sondages',
      'Heatmaps de présence et tendances',
      'IA Coach — conseils pour tes créneaux',
      'Badge Premium violet',
      'Zéro pub',
    ],
    ctaLabel: 'Passer Premium — 6,99€/mois',
    gradient: 'from-primary to-primary/80',
    badgeClass: 'bg-primary/20 text-primary-hover',
    borderActive: 'border-primary bg-primary/5',
    popular: false,
    badge: null,
  },
  {
    tier: 'squad_leader' as SubscriptionTier,
    name: 'Squad Leader',
    description: 'Pour les capitaines qui veulent des stats et une squad qui ne ghost plus.',
    monthlyPrice: SQUAD_LEADER_PRICE_MONTHLY,
    yearlyPrice: SQUAD_LEADER_PRICE_YEARLY,
    features: [
      'Tout Premium inclus',
      'Squads illimités',
      'Historique illimité',
      'Audio HD — son cristallin en party',
      'IA Coach avancé — tactiques personnalisées',
      'Dashboard analytics — heatmaps et tendances de ta squad',
      'Rôles avancés — chaque membre sait son rôle',
      'Export calendrier — synchro Google Calendar',
      'Sessions récurrentes — crée une fois, ça se répète',
      'Badge Squad Leader doré',
    ],
    ctaLabel: 'Passer Squad Leader — 14,99€/mois',
    gradient: 'from-warning to-warning/80',
    badgeClass: 'bg-warning/20 text-warning',
    borderActive: 'border-warning bg-warning/5',
    popular: true,
    badge: 'POPULAIRE',
  },
  {
    tier: 'team' as SubscriptionTier,
    name: 'Clan',
    description: 'Pour les grosses squads qui veulent grandir.',
    monthlyPrice: TEAM_PRICE_MONTHLY,
    yearlyPrice: TEAM_PRICE_YEARLY,
    features: [
      'Tout Squad Leader inclus',
      'Dashboard multi-squads',
      'Stats cross-squad',
      "Jusqu'à 75 membres",
      'Support prioritaire 8h',
      'Badge Clan bleu',
    ],
    ctaLabel: 'Passer Clan — 24,99€/mois',
    gradient: 'from-info to-info/80',
    badgeClass: 'bg-info/20 text-info',
    borderActive: 'border-info bg-info/5',
    popular: false,
    badge: null,
  },
  {
    tier: 'club' as SubscriptionTier,
    name: 'Club',
    description: 'Pour les orgas esport.',
    monthlyPrice: CLUB_PRICE_MONTHLY,
    yearlyPrice: CLUB_PRICE_YEARLY,
    features: [
      'Tout Clan inclus',
      'Branding personnalisé',
      'Intégrations externes',
      'Mise en route guidée',
      'Support prioritaire 4h',
      "Jusqu'à 100 membres",
      'Facture pro dispo',
    ],
    ctaLabel: 'Contacter les ventes',
    gradient: 'from-primary to-purple',
    badgeClass: 'bg-primary/20 text-primary-hover',
    borderActive: 'border-primary bg-primary/5',
    popular: false,
    badge: 'B2B',
  },
]

export function PremiumPricing({ isLoading, error, onUpgrade, onStartTrial }: PremiumPricingProps) {
  const [isYearly, setIsYearly] = useState(false)

  // R18 — Personalized stats for connected users
  const { user, profile } = useAuthStore()
  const { tier } = usePremium()
  const { data: squads } = useSquadsQuery()
  const squadCount = squads?.length ?? 0
  const isConnected = !!user && tier === 'free'

  // Launch promo countdown — expires April 30, 2026
  const PROMO_END = new Date('2026-04-30T23:59:59').getTime()
  const [timeLeft, setTimeLeft] = useState('')
  const [promoActive, setPromoActive] = useState(true)

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const diff = PROMO_END - now
      if (diff <= 0) {
        setPromoActive(false)
        return
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24))
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const min = Math.floor((diff / (1000 * 60)) % 60)
      setTimeLeft(`${d}j ${h}h ${min}min`)
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* Launch promo banner */}
      {promoActive && (
        <div
          className="animate-fade-in-up mb-6 p-4 rounded-2xl bg-bg-surface border border-warning/20 text-center"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-error" />
            <span className="text-base font-bold text-error">Offre de bienvenue -30%</span>
            <Zap className="w-5 h-5 text-error" />
          </div>
          <p className="text-sm text-text-secondary mb-1">
            Code <span className="font-mono font-bold text-error">LAUNCH30</span> sur tous les plans
          </p>
          <p className="text-xs text-success font-medium mb-1">Appliqué automatiquement au checkout</p>
          <p className="text-xs text-text-tertiary">Expire dans {timeLeft}</p>
        </div>
      )}

      {/* Free Trial Banner */}
      <div
        className="animate-fade-in-up relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-success/10 to-transparent border border-success/20 p-6 md:p-8"
        style={{ animationDelay: '0.2s' }}
      >
        <m.div
          className="absolute top-3 right-8 text-success/40"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-6 h-6" />
        </m.div>
        <m.div
          className="absolute bottom-4 left-6 text-success/30"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <Sparkles className="w-5 h-5" />
        </m.div>
        <div className="relative text-center">
          <m.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-success to-success/60 mb-4 shadow-lg"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Gift className="w-7 h-7 text-white" />
          </m.div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
            Teste tout pendant 7 jours — sans rien payer
          </h2>
          <p className="text-base text-text-secondary mb-1">
            Active Premium maintenant. Si ça ne change rien, désactive en 1 clic.
          </p>
          <p className="text-base text-text-tertiary mb-5">
            Pas de carte bancaire requise. Annule à tout moment.
          </p>
          <Button
            onClick={onStartTrial}
            className="h-12 px-8 text-base bg-gradient-to-r from-success to-success/80 text-white font-semibold hover:opacity-90 shadow-lg mb-5"
          >
            <Gift className="w-5 h-5" /> Commencer l'essai gratuit{' '}
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 text-base text-text-secondary">
              <Shield className="w-4 h-4 text-success" />
              <span>Aucun engagement</span>
            </div>
            <div className="flex items-center gap-2 text-base text-text-secondary">
              <Clock className="w-4 h-4 text-success" />
              <span>7 jours complets</span>
            </div>
            <div className="flex items-center gap-2 text-base text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Pas de CB requise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle mensuel/annuel */}
      <div
        className="animate-fade-in-up flex justify-center mb-6"
        style={{ animationDelay: '0.25s' }}
      >
        <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-bg-elevated border border-border-default">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              !isYearly
                ? 'bg-primary-bg text-white shadow-sm'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-lg text-base font-medium transition-colors flex items-center gap-2 ${
              isYearly
                ? 'bg-success-bg text-white shadow-sm'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            Annuel
            <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-white text-xs font-bold">
              Économise 2 mois
            </span>
          </button>
        </div>
      </div>

      {/* Ce que tu rates — Loss Aversion (R14 + R18 personalized) */}
      <div
        className="animate-fade-in-up mb-8 p-5 rounded-2xl bg-error/[0.04] border border-error/10"
        style={{ animationDelay: '0.27s' }}
      >
        <h3 className="text-base font-bold text-text-primary mb-3 text-center">
          {isConnected ? `${profile?.username || 'Toi'}, voilà ce que tu rates` : 'Ce que tu rates en restant gratuit'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(isConnected
            ? [
                { text: `Tu as ${squadCount} squad${squadCount > 1 ? 's' : ''} · 5 membres max`, detail: 'Premium : 5 squads · 20 membres' },
                { text: 'Limité à 2 sessions par semaine', detail: 'Premium : illimité' },
                { text: 'Historique limité à 7 jours', detail: 'Premium : 90 jours' },
                { text: 'Pas de heatmaps ni tendances', detail: 'Premium : analytics complets' },
                { text: "Pas d'IA Coach", detail: 'Premium : conseils personnalisés' },
                { text: 'Chat basique (texte seulement)', detail: 'Premium : GIF, voice, polls' },
              ]
            : [
                { text: '1 squad · 5 membres max', detail: 'Premium : 5 squads · 20 membres' },
                { text: '2 sessions par semaine max', detail: 'Premium : illimité' },
                { text: 'Historique limité à 7 jours', detail: 'Premium : 90 jours' },
                { text: 'Pas de heatmaps ni tendances', detail: 'Premium : analytics complets' },
                { text: "Pas d'IA Coach", detail: 'Premium : conseils personnalisés' },
                { text: 'Chat basique (texte seulement)', detail: 'Premium : GIF, voice, polls' },
              ]
          ).map((item) => (
            <div key={item.text} className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-error/70 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-text-secondary line-through decoration-error/40">
                  {item.text}
                </span>
                <span className="text-xs text-success ml-1.5">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-tertiary text-center mt-3">
          Chaque jour sans Premium, c'est une session de plus où tu ne sais pas qui vient vraiment.
        </p>
      </div>

      {/* Pricing Cards — 3 tiers */}
      <div
        className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        style={{ animationDelay: '0.3s' }}
      >
        {TIERS.map((t, index) => {
          const price = isYearly ? t.yearlyPrice / 12 : t.monthlyPrice
          const yearlyTotal = t.yearlyPrice
          const savings = Math.round(
            ((t.monthlyPrice * 12 - t.yearlyPrice) / (t.monthlyPrice * 12)) * 100
          )

          return (
            <m.div
              key={t.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`relative p-5 rounded-2xl overflow-hidden ${
                t.popular
                  ? 'border-2 border-warning/40 bg-gradient-to-br from-warning/8 to-transparent'
                  : 'border border-border-default bg-bg-elevated'
              }`}
            >
              {t.badge && (
                <div
                  className={`absolute top-0 right-0 px-3 py-1 text-sm font-bold rounded-bl-xl ${
                    t.popular ? 'bg-warning text-bg-base' : 'bg-primary-bg text-white'
                  }`}
                >
                  {t.badge}
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-text-primary">{t.name}</h3>
                {t.popular && <Crown className="w-4 h-4 text-warning" />}
              </div>

              <p className="text-sm text-text-tertiary mb-3">{t.description}</p>

              <div className="flex items-baseline gap-1 mb-1">
                {isYearly && (
                  <span className="text-lg text-text-quaternary line-through mr-1">{t.monthlyPrice.toFixed(2)}€</span>
                )}
                <span className="text-2xl font-bold text-text-primary">{price.toFixed(2)}€</span>
                <span className="text-text-quaternary text-sm">/mois</span>
              </div>

              {isYearly && (
                <p className="text-xs text-success mb-1">
                  {yearlyTotal.toFixed(2)}€/an · Économise {savings}%
                </p>
              )}

              {(t.tier === 'premium' || t.tier === 'squad_leader') && (
                <p className="text-xs text-text-quaternary mb-2">
                  Soit <span className="font-semibold text-text-secondary">{(price / 30).toFixed(2)}€/jour</span> — {t.tier === 'premium' ? "le prix d'un bonbon" : "moins qu'un café"}
                </p>
              )}

              <ul className="space-y-2 mb-5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        t.popular ? 'text-warning' : 'text-success'
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <m.button
                onClick={() => onUpgrade(t.tier, isYearly ? 'yearly' : 'monthly')}
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl text-base font-semibold transition-colors flex items-center justify-center gap-2 ${
                  t.popular
                    ? 'bg-gradient-to-r from-warning to-warning/80 text-bg-base hover:opacity-90'
                    : t.tier === 'club'
                      ? 'border border-primary text-primary-hover hover:bg-primary-10'
                      : 'bg-primary-bg text-white hover:bg-primary-bg-hover shadow-glow-primary-sm'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t.popular && <Crown className="w-4 h-4" />}
                    {t.ctaLabel}
                  </>
                )}
              </m.button>
            </m.div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/5 border border-error/10">
          <p className="text-error text-base">{error}</p>
        </div>
      )}

      {/* Trust badges */}
      <div
        className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3 mb-12 text-sm text-text-tertiary"
        style={{ animationDelay: '0.4s' }}
      >
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Paiement sécurisé Stripe
        </span>
        <span>—</span>
        <span>Annulation en 1 clic</span>
        <span>—</span>
        <span>Remboursé sur demande sous 30 jours</span>
      </div>

      {/* Final CTA */}
      <div className="animate-fade-in-up text-center" style={{ animationDelay: '0.5s' }}>
        <Card className="p-8 bg-gradient-to-br from-primary/[0.075] to-warning/5 border-primary">
          <Crown className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Ta squad mérite mieux qu'un {'« '}on verra{' »'}
          </h3>
          <p className="text-base text-text-secondary mb-2 max-w-md mx-auto">
            Les squads Premium jouent 3x plus régulièrement. Plus de montées en rang, plus de souvenirs, zéro soirées gâchées.
          </p>
          <p className="text-base text-success mb-6 font-medium">
            Commence par 7 jours d'essai gratuit — sans carte bancaire
          </p>
          <Button
            onClick={onStartTrial}
            disabled={isLoading}
            className="h-12 px-8 bg-gradient-to-r from-warning to-warning/70 text-bg-base font-semibold hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5" /> Essai gratuit 7 jours
              </>
            )}
          </Button>
        </Card>
      </div>
    </>
  )
}
