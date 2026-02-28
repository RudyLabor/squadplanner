import { useState } from 'react'
import { m } from 'framer-motion'
import { Check, Crown } from '../icons'
import { Link } from 'react-router'
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

const TIERS = [
  {
    name: 'Gratuit',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "L'essentiel pour organiser tes sessions.",
    features: [
      '1 squad · 5 membres max',
      '2 sessions/semaine',
      'Historique 7 jours',
      'Chat basique',
      'Score de fiabilité',
      'Notifications push',
    ],
    cta: 'Commencer gratuitement',
    ctaStyle: 'border border-border-default text-text-primary hover:bg-bg-hover',
    popular: false,
    badge: null,
    dailyPrice: false,
  },
  {
    name: 'Premium',
    monthlyPrice: PREMIUM_PRICE_MONTHLY,
    yearlyPrice: PREMIUM_PRICE_YEARLY,
    description: 'Pour les squads qui jouent sérieusement.',
    features: [
      '5 squads',
      'Sessions illimitées',
      'Historique 90 jours',
      'Chat complet (GIF, voice, polls)',
      'Heatmaps de présence et tendances',
      'IA Coach basique',
      'Badge Premium violet',
      'Zéro pub',
    ],
    cta: 'Passer Premium — 6,99€/mois',
    ctaStyle: 'bg-gradient-to-r from-primary to-purple text-white hover:opacity-90 shadow-glow-primary-sm',
    popular: true,
    badge: 'RECOMMANDÉ',
    dailyPrice: true,
  },
  {
    name: 'Squad Leader',
    monthlyPrice: SQUAD_LEADER_PRICE_MONTHLY,
    yearlyPrice: SQUAD_LEADER_PRICE_YEARLY,
    description: 'Pour les capitaines de squad.',
    features: [
      'Squads illimités',
      'Historique illimité',
      'Audio HD Party',
      'IA Coach avancé',
      'Dashboard analytics squad',
      'Rôles avancés (IGL, Coach)',
      'Export calendrier',
      'Sessions récurrentes',
      'Badge Squad Leader doré',
    ],
    cta: 'Passer Squad Leader — 14,99€/mois',
    ctaStyle: 'bg-gradient-to-r from-warning to-warning/80 text-bg-base hover:opacity-90',
    popular: false,
    badge: null,
    dailyPrice: true,
  },
  {
    name: 'Clan',
    monthlyPrice: TEAM_PRICE_MONTHLY,
    yearlyPrice: TEAM_PRICE_YEARLY,
    description: 'Pour les grosses squads qui veulent scaler.',
    features: [
      'Tout Squad Leader inclus',
      'Dashboard multi-squads',
      'Stats cross-squad',
      "Jusqu'à 75 membres",
      'Support prioritaire 8h',
      'Badge Clan bleu',
    ],
    cta: 'Passer Clan — 24,99€/mois',
    ctaStyle: 'bg-gradient-to-r from-info to-info/80 text-white hover:opacity-90',
    popular: false,
    badge: null,
    dailyPrice: false,
  },
  {
    name: 'Club',
    monthlyPrice: CLUB_PRICE_MONTHLY,
    yearlyPrice: CLUB_PRICE_YEARLY,
    description: 'Pour les orgas esport.',
    features: [
      'Tout Squad Leader inclus',
      'Dashboard multi-squads',
      'Stats cross-squad',
      'Branding personnalisé',
      'Intégrations externes',
      'Mise en route guidée',
      'Support prioritaire 24h',
      'Facture pro dispo',
    ],
    cta: 'Passer Club — 39,99€/mois',
    ctaStyle: 'border border-primary text-primary hover:bg-primary-10',
    popular: false,
    badge: 'B2B',
    dailyPrice: false,
  },
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section aria-label="Tarifs" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-6xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Choisis ton plan — commence gratuit, upgrade quand tu veux
          </h2>
          <p className="text-text-tertiary text-md max-w-md mx-auto mb-6">
            Le gratuit suffit pour organiser tes sessions. Le premium, c'est pour ceux qui veulent
            tout optimiser.
          </p>

          {/* Toggle mensuel/annuel */}
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
                Économise 2 mois (-17%)
              </span>
            </button>
          </div>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-3">
          {TIERS.map((tier, index) => {
            const price =
              isYearly && tier.monthlyPrice > 0 ? tier.yearlyPrice / 12 : tier.monthlyPrice
            const yearlyTotal = tier.yearlyPrice

            return (
              <m.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * index }}
                className={`p-5 rounded-2xl relative overflow-hidden ${
                  tier.popular
                    ? 'border-2 border-warning/40 bg-gradient-to-br from-warning/8 to-transparent'
                    : 'surface-glass'
                }`}
                style={tier.popular
                  ? { boxShadow: '0 0 30px rgba(245, 158, 11, 0.1)' }
                  : { backdropFilter: 'blur(24px) saturate(1.2)', WebkitBackdropFilter: 'blur(24px) saturate(1.2)' }
                }
              >
                {tier.badge && (
                  <div
                    className={`absolute top-0 right-0 px-3 py-1 text-sm font-bold rounded-bl-xl ${
                      tier.popular ? 'bg-warning text-bg-base' : 'bg-primary-bg text-white'
                    }`}
                  >
                    {tier.badge}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                  {tier.popular && <Crown className="w-4 h-4 text-warning" />}
                  {tier.popular && (
                    <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-xs font-semibold">
                      Essai 7 jours gratuit
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  {isYearly && tier.monthlyPrice > 0 && (
                    <span className="text-lg text-text-quaternary line-through mr-1">{tier.monthlyPrice.toFixed(2)}€</span>
                  )}
                  <span className="text-2xl font-bold text-text-primary">
                    {price.toFixed(2)}€
                  </span>
                  <span className="text-text-quaternary text-sm">/mois</span>
                </div>

                {isYearly && tier.monthlyPrice > 0 && (
                  <p className="text-xs text-success mb-2">
                    {yearlyTotal.toFixed(2)}€/an · Économise{' '}
                    {Math.round(
                      ((tier.monthlyPrice * 12 - yearlyTotal) / (tier.monthlyPrice * 12)) * 100
                    )}
                    %
                  </p>
                )}

                {tier.dailyPrice && (
                  <p className="text-xs text-text-quaternary mb-2">
                    Soit <span className="font-semibold text-text-secondary">{(price / 30).toFixed(2)}€/jour</span> — {price < 10 ? "le prix d'un bonbon" : "moins qu'un café"}
                  </p>
                )}

                <p className="text-sm text-text-tertiary mb-4">{tier.description}</p>

                <ul className="space-y-2 mb-5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          tier.popular ? 'text-warning' : 'text-success'
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/auth">
                  <m.button
                    className={`w-full py-2.5 rounded-xl text-base font-semibold transition-colors ${tier.ctaStyle}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tier.cta}
                  </m.button>
                </Link>
                {tier.monthlyPrice > 0 && (
                  <p className="text-xs text-text-quaternary text-center mt-2">
                    Sans engagement · Annule en 1 clic
                  </p>
                )}
              </m.div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-text-quaternary">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Données hébergées en France
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Chiffrement SSL
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Conforme RGPD
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Paiement sécurisé Stripe
          </span>
          <span className="flex items-center gap-1.5">Remboursé sur demande sous 30 jours</span>
        </div>
      </div>
    </section>
  )
}
