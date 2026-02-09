import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Crown, Zap, Check, X, BarChart3, Sparkles,
  Mic2, Users, Calendar, Shield, ArrowRight, Loader2,
  Star, ChevronDown, Gift, Rocket
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, Card } from '../components/ui'
import { useAuthStore, useSubscriptionStore, usePremiumStore } from '../hooks'
import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from '../hooks/usePremium'
import { captureException } from '../lib/sentry'

// Features comparison
const FEATURES = [
  {
    name: 'Squads',
    free: '2 max',
    premium: 'Illimité',
    icon: Users,
    highlight: true
  },
  {
    name: 'Historique sessions',
    free: '30 jours',
    premium: 'Illimité',
    icon: Calendar,
    highlight: true
  },
  {
    name: 'Stats & Analytics',
    free: 'Basiques',
    premium: 'Avancées + Tendances',
    icon: BarChart3,
    highlight: true
  },
  {
    name: 'IA Coach',
    free: 'Conseils simples',
    premium: 'Prédictions + Personnalisé',
    icon: Sparkles,
    highlight: true
  },
  {
    name: 'Qualité audio Party',
    free: 'Standard',
    premium: 'Audio HD Premium',
    icon: Mic2,
    highlight: false
  },
  {
    name: 'Rôles squad',
    free: 'Membre / Admin',
    premium: 'Coach, Manager, Personnalisé',
    icon: Shield,
    highlight: false
  },
  {
    name: 'Export calendrier',
    free: false,
    premium: true,
    icon: Calendar,
    highlight: false
  },
  {
    name: 'Badge Premium',
    free: false,
    premium: true,
    icon: Crown,
    highlight: false
  }
]

// Testimonials
const TESTIMONIALS = [
  {
    name: 'Alex',
    squad: 'Les Ranked du Soir',
    text: "Depuis qu'on est Premium, plus personne oublie les sessions. Le coach IA nous a fait gagner 2 ranks !",
    avatar: '🎮'
  },
  {
    name: 'Marie',
    squad: 'GG Girls',
    text: "L'audio HD fait vraiment la diff en ranked. Et les stats nous aident à voir qui clutch le plus 😄",
    avatar: '👑'
  },
  {
    name: 'Lucas',
    squad: 'Apex Legends FR',
    text: "On gère 5 squads différentes maintenant. Impossible sans Premium !",
    avatar: '🔥'
  }
]

// FAQ
const FAQ = [
  {
    q: "Je peux annuler quand je veux ?",
    a: "Oui ! Tu peux annuler ton abonnement à tout moment depuis ton profil. Tu garderas l'accès Premium jusqu'à la fin de ta période payée."
  },
  {
    q: "C'est pour toute ma squad ou juste moi ?",
    a: "L'abonnement Premium est personnel. Mais quand tu crées une squad, elle bénéficie de certains avantages (squads illimitées, rôles avancés)."
  },
  {
    q: "Y a-t-il une période d'essai ?",
    a: "On offre une garantie satisfait ou remboursé de 30 jours. Si ça te plaît pas, on te rembourse sans questions."
  }
]

export function Premium() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hasPremium } = usePremiumStore()
  const { createCheckoutSession, createPortalSession, plans } = useSubscriptionStore()

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

  // Confetti on page load
  useEffect(() => {
    if (isHeroInView) {
      setTimeout(() => {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }, 500)
    }
  }, [isHeroInView])

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const priceId = selectedPlan === 'monthly'
        ? plans.find(p => p.id === 'premium_monthly')?.stripePriceId
        : plans.find(p => p.id === 'premium_yearly')?.stripePriceId

      if (!priceId) {
        throw new Error('Plan non trouvé')
      }

      // Premium subscription is personal, not tied to a specific squad
      // Pass undefined to create checkout without squad association
      const { url, error } = await createCheckoutSession(undefined as unknown as string, priceId)

      if (error) throw error
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      // Log to Sentry but show user-friendly message
      const error = err instanceof Error ? err : new Error(String(err))
      captureException(error, {
        context: 'stripe_checkout',
        selectedPlan,
        userId: user.id
      })

      // User-friendly error message instead of technical details
      const errorMessage = error.message
      if (errorMessage.includes('Edge Function') || errorMessage.includes('non-2xx')) {
        setError('Une erreur est survenue. Réessaye dans quelques instants.')
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Problème de connexion. Vérifie ta connexion internet.')
      } else {
        setError('Une erreur est survenue. Réessaye dans quelques instants.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const { url, error } = await createPortalSession()
      if (error) throw error
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const savings = Math.round((PREMIUM_PRICE_MONTHLY * 12 - PREMIUM_PRICE_YEARLY) / (PREMIUM_PRICE_MONTHLY * 12) * 100)

  return (
    <div className="min-h-0 bg-bg-base pb-6">
      {/* Confetti */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={80}
          gravity={0.2}
          colors={['#6366f1', '#fbbf24', '#34d399', '#a78bfa', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-b from-surface-dark via-bg-surface to-bg-base pt-8 pb-16"
      >
        {/* Animated gradient background - reduced animation */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-primary/10 to-warning/05 blur-3xl"
            animate={{
              x: [0, 80, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 3, repeat: 2, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-purple/10 to-success/05 blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, -40, 0],
            }}
            transition={{ duration: 3, repeat: 2, ease: "easeInOut", delay: 0.5 }}
          />
        </div>

        <div className="relative px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-warning/10 to-warning/025 border border-warning/15">
                <Gift className="w-4 h-4 text-warning" />
                <span className="text-[13px] font-medium text-warning">
                  2 mois offerts sur l'annuel
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-warning to-warning/60 mb-6 shadow-glow-warning">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4">
              Passe au niveau
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-warning to-warning/70"> supérieur</span>
            </h1>

            <p className="text-[16px] md:text-[18px] text-text-secondary max-w-xl mx-auto mb-8">
              Débloquer tout le potentiel de Squad Planner. Stats avancées, IA coach personnalisé, audio HD et bien plus.
            </p>

            {/* Already Premium */}
            {hasPremium && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-success/05 border border-success/15">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-[15px] font-medium text-success">
                    Tu es déjà Premium !
                  </span>
                </div>
                <div className="mt-4">
                  <Button variant="secondary" onClick={handleManageSubscription} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gérer mon abonnement'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 max-w-4xl mx-auto -mt-8">
        {/* Pricing Cards */}
        {!hasPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-4 mb-16"
          >
            {/* Monthly */}
            <motion.button
              onClick={() => setSelectedPlan('monthly')}
              className={`relative p-6 rounded-2xl border-2 text-left transition-interactive ${
                selectedPlan === 'monthly'
                  ? 'border-primary bg-primary/5 shadow-glow-primary-sm'
                  : 'border-border-hover bg-white/[0.02] hover:border-border-hover'
              }`}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="text-[14px] text-text-secondary mb-2">Mensuel</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[36px] font-bold text-text-primary">
                  {PREMIUM_PRICE_MONTHLY.toFixed(2)}€
                </span>
                <span className="text-[14px] text-text-tertiary">/mois</span>
              </div>
              <p className="text-[13px] text-text-tertiary">
                Flexibilité maximale, annule quand tu veux
              </p>
              {selectedPlan === 'monthly' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.button>

            {/* Yearly */}
            <motion.button
              onClick={() => setSelectedPlan('yearly')}
              className={`relative p-6 rounded-2xl border-2 text-left transition-interactive ${
                selectedPlan === 'yearly'
                  ? 'border-success bg-success/5 shadow-glow-success'
                  : 'border-border-hover bg-white/[0.02] hover:border-border-hover'
              }`}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Best value badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-success to-success text-xs font-bold text-bg-base">
                🎁 MEILLEURE OFFRE
              </div>

              <div className="text-[14px] text-text-secondary mb-2">Annuel</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[36px] font-bold text-text-primary">
                  {(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}€
                </span>
                <span className="text-[14px] text-text-tertiary">/mois</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] line-through text-text-tertiary">
                  {(PREMIUM_PRICE_MONTHLY * 12).toFixed(2)}€/an
                </span>
                <span className="text-[13px] font-semibold text-success">
                  {PREMIUM_PRICE_YEARLY.toFixed(2)}€/an
                </span>
              </div>
              <p className="text-[13px] text-success">
                Économise {savings}% — 2 mois offerts !
              </p>
              {selectedPlan === 'yearly' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* CTA Button */}
        {!hasPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-16"
          >
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error/5 border border-error/10">
                <p className="text-error text-[13px]">{error}</p>
              </div>
            )}
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="h-14 px-10 text-[16px] bg-gradient-to-r from-primary via-purple to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-interactive shadow-glow-primary-md"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Passer Premium maintenant
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-[12px] text-text-tertiary mt-3">
              🔒 Paiement sécurisé · Annulation facile · Satisfait ou remboursé 30j
            </p>
          </motion.div>
        )}

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-xl font-semibold text-text-primary text-center mb-8">
            Comparatif des fonctionnalités
          </h2>

          <Card className="overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/[0.02] border-b border-border-default">
              <div className="text-[13px] font-semibold text-text-secondary">Fonctionnalité</div>
              <div className="text-[13px] font-semibold text-text-secondary text-center">Gratuit</div>
              <div className="text-[13px] font-semibold text-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-warning to-warning/70 text-xs font-bold text-bg-base">
                  <Crown className="w-3 h-3" />
                  PREMIUM
                </span>
              </div>
            </div>

            {/* Features rows */}
            <div className="divide-y divide-border-default">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-3 gap-4 p-4 items-center ${
                    feature.highlight ? 'bg-primary/[0.025]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-4 h-4 text-primary" />
                    <span className="text-[14px] text-text-primary">{feature.name}</span>
                  </div>
                  <div className="text-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-text-tertiary mx-auto" />
                      )
                    ) : (
                      <span className="text-[13px] text-text-secondary">{feature.free}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof feature.premium === 'boolean' ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <span className="text-[13px] font-medium text-success">{feature.premium}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-xl font-semibold text-text-primary text-center mb-2">
            Ils sont passés Premium
          </h2>
          <p className="text-[14px] text-text-secondary text-center mb-8">
            Et ils ne reviendraient pas en arrière
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-5 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-text-primary">{testimonial.name}</div>
                      <div className="text-[12px] text-text-tertiary">{testimonial.squad}</div>
                    </div>
                  </div>
                  <p className="text-[14px] text-text-secondary leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex gap-0.5 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-xl font-semibold text-text-primary text-center mb-8">
            Questions fréquentes
          </h2>

          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQ.map((item, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <span className="text-[15px] font-medium text-text-primary">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-tertiary transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                  >
                    <p className="text-[14px] text-text-secondary leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        {!hasPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card className="p-8 bg-gradient-to-br from-primary/[0.075] to-warning/5 border-primary">
              <Crown className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Prêt à passer Premium ?
              </h3>
              <p className="text-[14px] text-text-secondary mb-6 max-w-md mx-auto">
                Rejoins les squads qui ont choisi de jouer sérieusement ensemble.
              </p>
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="h-12 px-8 bg-gradient-to-r from-warning to-warning/70 text-bg-base font-semibold hover:opacity-90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Commencer — {selectedPlan === 'monthly'
                      ? `${PREMIUM_PRICE_MONTHLY.toFixed(2)}€/mois`
                      : `${(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}€/mois`
                    }
                  </>
                )}
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Premium
