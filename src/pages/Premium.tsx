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

// const containerVariants = theme.animation.container
// const itemVariants = theme.animation.item

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
    premium: 'HD Crystal Clear',
    icon: Mic2,
    highlight: false
  },
  {
    name: 'Rôles squad',
    free: 'Membre / Admin',
    premium: 'Coach, Manager, Custom',
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
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement')
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
    <div className="min-h-screen bg-[#08090a] pb-24">
      {/* Confetti */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={80}
          gravity={0.2}
          colors={['#5e6dd2', '#f5a623', '#4ade80', '#8b93ff', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-b from-[#1a1b2e] via-[#0f1015] to-[#08090a] pt-8 pb-16"
      >
        {/* Animated gradient background - reduced animation */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-[#5e6dd2]/20 to-[#f5a623]/10 blur-3xl"
            animate={{
              x: [0, 80, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 3, repeat: 2, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-[#8b93ff]/20 to-[#4ade80]/10 blur-3xl"
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#f5a623]/20 to-[#f5a623]/5 border border-[#f5a623]/30">
                <Gift className="w-4 h-4 text-[#f5a623]" />
                <span className="text-[13px] font-medium text-[#f5a623]">
                  2 mois offerts sur l'annuel
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#f5a623]/60 mb-6 shadow-[0_0_40px_rgba(245,166,35,0.3)]">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-[#f7f8f8] mb-4">
              Passe au niveau
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5a623] to-[#ffd700]"> supérieur</span>
            </h1>

            <p className="text-[16px] md:text-[18px] text-[#8b8d90] max-w-xl mx-auto mb-8">
              Débloquer tout le potentiel de Squad Planner. Stats avancées, IA coach personnalisé, audio HD et bien plus.
            </p>

            {/* Already Premium */}
            {hasPremium && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/30">
                  <Check className="w-5 h-5 text-[#4ade80]" />
                  <span className="text-[15px] font-medium text-[#4ade80]">
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
              className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-[#5e6dd2] bg-[rgba(94,109,210,0.1)] shadow-[0_0_30px_rgba(94,109,210,0.2)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)]'
              }`}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="text-[14px] text-[#8b8d90] mb-2">Mensuel</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[36px] font-bold text-[#f7f8f8]">
                  {PREMIUM_PRICE_MONTHLY.toFixed(2)}€
                </span>
                <span className="text-[14px] text-[#5e6063]">/mois</span>
              </div>
              <p className="text-[13px] text-[#5e6063]">
                Flexibilité maximale, annule quand tu veux
              </p>
              {selectedPlan === 'monthly' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#5e6dd2] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.button>

            {/* Yearly */}
            <motion.button
              onClick={() => setSelectedPlan('yearly')}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                selectedPlan === 'yearly'
                  ? 'border-[#4ade80] bg-[rgba(74,222,128,0.1)] shadow-[0_0_30px_rgba(74,222,128,0.2)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)]'
              }`}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Best value badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#4ade80] to-[#4ade80] text-[11px] font-bold text-[#08090a]">
                🎁 MEILLEURE OFFRE
              </div>

              <div className="text-[14px] text-[#8b8d90] mb-2">Annuel</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[36px] font-bold text-[#f7f8f8]">
                  {(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}€
                </span>
                <span className="text-[14px] text-[#5e6063]">/mois</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] line-through text-[#5e6063]">
                  {(PREMIUM_PRICE_MONTHLY * 12).toFixed(2)}€/an
                </span>
                <span className="text-[13px] font-semibold text-[#4ade80]">
                  {PREMIUM_PRICE_YEARLY.toFixed(2)}€/an
                </span>
              </div>
              <p className="text-[13px] text-[#4ade80]">
                Économise {savings}% — 2 mois offerts !
              </p>
              {selectedPlan === 'yearly' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center">
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
              <div className="mb-4 p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                <p className="text-[#f87171] text-[13px]">{error}</p>
              </div>
            )}
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="h-14 px-10 text-[16px] bg-gradient-to-r from-[#5e6dd2] via-[#8b93ff] to-[#5e6dd2] bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all shadow-[0_0_30px_rgba(94,109,210,0.4)]"
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
            <p className="text-[12px] text-[#5e6063] mt-3">
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
          <h2 className="text-[20px] font-bold text-[#f7f8f8] text-center mb-8">
            Comparatif des fonctionnalités
          </h2>

          <Card className="overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
              <div className="text-[13px] font-semibold text-[#8b8d90]">Fonctionnalité</div>
              <div className="text-[13px] font-semibold text-[#8b8d90] text-center">Gratuit</div>
              <div className="text-[13px] font-semibold text-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#f5a623] to-[#f5a623]/70 text-[11px] font-bold text-[#08090a]">
                  <Crown className="w-3 h-3" />
                  PREMIUM
                </span>
              </div>
            </div>

            {/* Features rows */}
            <div className="divide-y divide-[rgba(255,255,255,0.06)]">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-3 gap-4 p-4 items-center ${
                    feature.highlight ? 'bg-[rgba(94,109,210,0.05)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-4 h-4 text-[#5e6dd2]" />
                    <span className="text-[14px] text-[#f7f8f8]">{feature.name}</span>
                  </div>
                  <div className="text-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-[#4ade80] mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-[#5e6063] mx-auto" />
                      )
                    ) : (
                      <span className="text-[13px] text-[#8b8d90]">{feature.free}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof feature.premium === 'boolean' ? (
                      <Check className="w-5 h-5 text-[#4ade80] mx-auto" />
                    ) : (
                      <span className="text-[13px] font-medium text-[#4ade80]">{feature.premium}</span>
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
          <h2 className="text-[20px] font-bold text-[#f7f8f8] text-center mb-2">
            Ils sont passés Premium
          </h2>
          <p className="text-[14px] text-[#8b8d90] text-center mb-8">
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#f7f8f8]">{testimonial.name}</div>
                      <div className="text-[12px] text-[#5e6063]">{testimonial.squad}</div>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#8b8d90] leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex gap-0.5 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#f5a623] text-[#f5a623]" />
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
          <h2 className="text-[20px] font-bold text-[#f7f8f8] text-center mb-8">
            Questions fréquentes
          </h2>

          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQ.map((item, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <span className="text-[15px] font-medium text-[#f7f8f8]">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#5e6063] transition-transform ${
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
                    <p className="text-[14px] text-[#8b8d90] leading-relaxed">
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
            <Card className="p-8 bg-gradient-to-br from-[rgba(94,109,210,0.15)] to-[rgba(245,166,35,0.1)] border-[rgba(94,109,210,0.3)]">
              <Crown className="w-12 h-12 text-[#f5a623] mx-auto mb-4" />
              <h3 className="text-[20px] font-bold text-[#f7f8f8] mb-2">
                Prêt à passer Premium ?
              </h3>
              <p className="text-[14px] text-[#8b8d90] mb-6 max-w-md mx-auto">
                Rejoins les squads qui ont choisi de jouer sérieusement ensemble.
              </p>
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="h-12 px-8 bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#08090a] font-semibold hover:opacity-90"
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
