import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Crown, Zap, Check, X, BarChart3, Sparkles,
  Mic2, Users, Calendar, Shield, ArrowRight, Loader2,
  Star, ChevronDown, Gift, Rocket, CheckCircle2, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, Card } from '../components/ui'
import { useAuthStore, useSubscriptionStore, usePremiumStore } from '../hooks'
import { showSuccess } from '../lib/toast'
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

// Testimonial avatar SVG illustrations (modern flat/gradient style)
function TestimonialAvatar({ type }: { type: 'alex' | 'marie' | 'lucas' }) {
  if (type === 'alex') {
    // Male gamer: short styled hair, headphones around neck, confident look
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar AlexGaming" className="flex-shrink-0">
        <defs>
          <linearGradient id="alexBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="alexSkin" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5D0B0" />
            <stop offset="1" stopColor="#E8B896" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#alexBg)" />
        <rect x="19" y="30" width="10" height="6" rx="2" fill="url(#alexSkin)" />
        <path d="M10 48 C10 39 16 35 24 35 C32 35 38 39 38 48" fill="#4F46E5" />
        <path d="M18 35 L24 38 L30 35" stroke="#6366f1" strokeWidth="1" fill="none" opacity="0.6" />
        <ellipse cx="24" cy="22" rx="10" ry="11" fill="url(#alexSkin)" />
        <path d="M14 19 C14 12 18 8 24 8 C30 8 34 12 34 19 C34 16 31 11 24 11 C17 11 14 16 14 19Z" fill="#3B2510" />
        <path d="M14 19 C14 17 15 14 18 13 C16 16 15 18 15 20Z" fill="#3B2510" />
        <path d="M26 9 C29 9 33 11 34 16 C33 13 30 10 26 10Z" fill="#4A3420" />
        <ellipse cx="20" cy="22" rx="1.8" ry="2" fill="#2D1B0E" />
        <ellipse cx="28" cy="22" rx="1.8" ry="2" fill="#2D1B0E" />
        <circle cx="20.6" cy="21.4" r="0.6" fill="white" opacity="0.8" />
        <circle cx="28.6" cy="21.4" r="0.6" fill="white" opacity="0.8" />
        <path d="M17.5 19.5 L22 18.5" stroke="#3B2510" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26 18.5 L30.5 19.5" stroke="#3B2510" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24 23 L23.2 26 L24.8 26" stroke="#D4A87A" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M21 28.5 C22.5 30 25.5 30 27 28.5" stroke="#C4917A" strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M12 32 C12 28 14 27 16 28" stroke="#555" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M36 32 C36 28 34 27 32 28" stroke="#555" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M16 28 C16 34 17 35 19 35" stroke="#555" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M32 28 C32 34 31 35 29 35" stroke="#555" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="10" y="30" width="5" height="4" rx="2" fill="#444" />
        <rect x="33" y="30" width="5" height="4" rx="2" fill="#444" />
      </svg>
    )
  }

  if (type === 'marie') {
    // Female gamer: longer hair, subtle smile, gaming earbuds visible
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar MarieGG" className="flex-shrink-0">
        <defs>
          <linearGradient id="marieBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC4899" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="marieSkin" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE1C8" />
            <stop offset="1" stopColor="#F0C9A8" />
          </linearGradient>
          <linearGradient id="marieHair" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2A1506" />
            <stop offset="1" stopColor="#4A2810" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#marieBg)" />
        <path d="M12 18 C12 10 17 6 24 6 C31 6 36 10 36 18 L37 36 C37 38 35 38 34 36 L34 22 L14 22 L14 36 C14 38 12 38 11 36Z" fill="url(#marieHair)" />
        <path d="M11 22 L11 40 C11 42 13 41 14 38 L14 22Z" fill="url(#marieHair)" />
        <path d="M37 22 L37 40 C37 42 35 41 34 38 L34 22Z" fill="url(#marieHair)" />
        <rect x="20" y="30" width="8" height="6" rx="2" fill="url(#marieSkin)" />
        <path d="M10 48 C10 39 16 35 24 35 C32 35 38 39 38 48" fill="#7C3AED" />
        <path d="M20 35 L24 37 L28 35" stroke="#9333EA" strokeWidth="0.8" fill="none" opacity="0.5" />
        <ellipse cx="24" cy="22" rx="10" ry="11" fill="url(#marieSkin)" />
        <path d="M14 18 C14 11 18 7 24 7 C30 7 34 11 34 18 C34 15 31 11 24 11 C17 11 14 15 14 18Z" fill="url(#marieHair)" />
        <path d="M14 18 C14 15 13 13 15 12 C14 15 14 17 15 19Z" fill="url(#marieHair)" />
        <path d="M34 18 C34 15 35 13 33 12 C34 15 34 17 33 19Z" fill="url(#marieHair)" />
        <path d="M14 20 C12 22 11 28 12 34" stroke="#3A1A08" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M34 20 C36 22 37 28 36 34" stroke="#3A1A08" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="20" cy="22" rx="2" ry="2.2" fill="#2D1B0E" />
        <ellipse cx="28" cy="22" rx="2" ry="2.2" fill="#2D1B0E" />
        <circle cx="20.7" cy="21.3" r="0.7" fill="white" opacity="0.85" />
        <circle cx="28.7" cy="21.3" r="0.7" fill="white" opacity="0.85" />
        <path d="M17.5 20.5 C18 19.8 19 19.5 20 19.8" stroke="#2D1B0E" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <path d="M26 19.8 C27 19.5 28 19.8 28.5 20.5" stroke="#2D1B0E" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <path d="M17.5 19 C18.5 18 21 18 22 18.5" stroke="#3A1A08" strokeWidth="0.9" strokeLinecap="round" fill="none" />
        <path d="M26 18.5 C27 18 29.5 18 30.5 19" stroke="#3A1A08" strokeWidth="0.9" strokeLinecap="round" fill="none" />
        <path d="M24 23.5 L23.5 26 L24.5 26" stroke="#DEB08A" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <path d="M21 28 C22 29.5 26 29.5 27 28" stroke="#D09A7E" strokeWidth="1" strokeLinecap="round" fill="none" />
        <circle cx="13" cy="24" r="1.8" fill="#E5E7EB" />
        <circle cx="13" cy="24" r="1" fill="#9CA3AF" />
        <path d="M14.5 24 L16 23" stroke="#D1D5DB" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="35" cy="24" r="1.8" fill="#E5E7EB" />
        <circle cx="35" cy="24" r="1" fill="#9CA3AF" />
        <path d="M33.5 24 L32 23" stroke="#D1D5DB" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    )
  }

  // Lucas: cap/beanie, casual look, beard stubble
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar LucasApex" className="flex-shrink-0">
      <defs>
        <linearGradient id="lucasBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id="lucasSkin" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8C49C" />
          <stop offset="1" stopColor="#D4A878" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#lucasBg)" />
      <rect x="19" y="30" width="10" height="6" rx="2" fill="url(#lucasSkin)" />
      <path d="M10 48 C10 39 16 35 24 35 C32 35 38 39 38 48" fill="#374151" />
      <path d="M22 36 L22 40" stroke="#9CA3AF" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M26 36 L26 40" stroke="#9CA3AF" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M18 36 C20 38 28 38 30 36" stroke="#4B5563" strokeWidth="1.5" fill="none" />
      <ellipse cx="24" cy="23" rx="10" ry="11" fill="url(#lucasSkin)" />
      <path d="M13 19 C13 11 17 7 24 7 C31 7 35 11 35 19 L35 17 C35 17 34 14 24 14 C14 14 13 17 13 17Z" fill="#1F2937" />
      <rect x="12" y="16" width="24" height="4" rx="2" fill="#374151" />
      <path d="M12 18 L36 18" stroke="#4B5563" strokeWidth="0.8" />
      <path d="M14 17 C16 16.5 20 16 24 16 C28 16 32 16.5 34 17" stroke="#4B5563" strokeWidth="0.6" fill="none" />
      <path d="M14 19 C14 19 15 20 16 19.5" stroke="#6B4226" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M34 19 C34 19 33 20 32 19.5" stroke="#6B4226" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="23" rx="1.8" ry="2" fill="#2D1B0E" />
      <ellipse cx="28" cy="23" rx="1.8" ry="2" fill="#2D1B0E" />
      <circle cx="20.6" cy="22.4" r="0.6" fill="white" opacity="0.8" />
      <circle cx="28.6" cy="22.4" r="0.6" fill="white" opacity="0.8" />
      <path d="M17.5 20.5 L22 20" stroke="#5C3A1E" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M26 20 L30.5 20.5" stroke="#5C3A1E" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M24 24 L23 27 L25 27" stroke="#C4976A" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M20.5 29 C22 30.5 26 30.5 27.5 29" stroke="#B8876A" strokeWidth="1" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="29" r="0.35" fill="#8B6040" opacity="0.4" />
      <circle cx="19.5" cy="30" r="0.35" fill="#8B6040" opacity="0.4" />
      <circle cx="21" cy="31" r="0.35" fill="#8B6040" opacity="0.35" />
      <circle cx="27" cy="31" r="0.35" fill="#8B6040" opacity="0.35" />
      <circle cx="28.5" cy="30" r="0.35" fill="#8B6040" opacity="0.4" />
      <circle cx="30" cy="29" r="0.35" fill="#8B6040" opacity="0.4" />
      <circle cx="22.5" cy="31.5" r="0.3" fill="#8B6040" opacity="0.3" />
      <circle cx="25.5" cy="31.5" r="0.3" fill="#8B6040" opacity="0.3" />
      <circle cx="24" cy="31.8" r="0.3" fill="#8B6040" opacity="0.3" />
      <circle cx="19" cy="31" r="0.3" fill="#8B6040" opacity="0.3" />
      <circle cx="29" cy="31" r="0.3" fill="#8B6040" opacity="0.3" />
    </svg>
  )
}

// Testimonials
const TESTIMONIALS = [
  {
    name: 'AlexGaming',
    squad: 'Les Ranked du Soir',
    memberSince: 'Membre depuis 6 mois',
    text: "Depuis qu'on est Premium, plus personne oublie les sessions. Le coach IA nous a fait gagner 2 ranks !",
    avatarType: 'alex' as const
  },
  {
    name: 'MarieGG',
    squad: 'GG Girls',
    memberSince: 'Membre depuis 4 mois',
    text: "L'audio HD fait vraiment la diff en ranked. Et les stats nous aident à voir qui clutch le plus.",
    avatarType: 'marie' as const
  },
  {
    name: 'LucasApex',
    squad: 'Apex Legends FR',
    memberSince: 'Membre depuis 8 mois',
    text: "On gère 5 squads différentes maintenant. Impossible sans Premium !",
    avatarType: 'lucas' as const
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
    a: "Oui ! Tu bénéficies de 7 jours d'essai gratuit sans carte bancaire. À la fin de l'essai, tu choisis ton plan. On offre aussi une garantie satisfait ou remboursé de 30 jours sur les abonnements."
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

  const handleStartTrial = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    // Mock trial activation - no backend logic yet
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
    showSuccess('Essai gratuit activé ! Profite de 7 jours Premium.')
  }

  const savings = Math.round((PREMIUM_PRICE_MONTHLY * 12 - PREMIUM_PRICE_YEARLY) / (PREMIUM_PRICE_MONTHLY * 12) * 100)

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Premium">
      {/* Confetti */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={80}
          gravity={0.2}
          colors={['var(--color-primary)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-purple)', 'var(--color-text-primary)']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple/5 to-bg-base dark:from-surface-dark dark:via-bg-surface dark:to-bg-base pt-8 pb-16"
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
                <span className="text-base font-medium text-warning">
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

            <p className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-8">
              Débloque tout le potentiel de Squad Planner. Stats avancées, IA coach personnalisé, audio HD et bien plus.
            </p>

            {/* Already Premium */}
            {hasPremium && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-success/05 border border-success/15">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-md font-medium text-success">
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
        {/* Free Trial Banner */}
        {!hasPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-success/10 to-transparent border border-success/20 p-6 md:p-8"
          >
            {/* Sparkle decorations */}
            <motion.div
              className="absolute top-3 right-8 text-success/40"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <motion.div
              className="absolute bottom-4 left-6 text-success/30"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>

            <div className="relative text-center">
              {/* Gift icon */}
              <motion.div
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-success to-success/60 mb-4 shadow-lg"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Gift className="w-7 h-7 text-white" />
              </motion.div>

              <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                7 jours d'essai gratuit
              </h2>
              <p className="text-md text-text-secondary mb-1">
                Essaie Premium gratuitement pendant 7 jours
              </p>
              <p className="text-base text-text-tertiary mb-5">
                Pas de carte bancaire requise. Annule à tout moment.
              </p>

              <Button
                onClick={handleStartTrial}
                className="h-12 px-8 text-md bg-gradient-to-r from-success to-success/80 text-white font-semibold hover:opacity-90 shadow-lg mb-5"
              >
                <Gift className="w-5 h-5" />
                Commencer l'essai gratuit
                <ArrowRight className="w-5 h-5" />
              </Button>

              {/* Trust badges */}
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
          </motion.div>
        )}

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
                  : 'border-border-hover bg-overlay-faint hover:border-border-hover'
              }`}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md text-text-secondary">Mensuel</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-xs font-medium text-success">
                  <Gift className="w-3 h-3" />
                  7j gratuits
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-text-primary">
                  {PREMIUM_PRICE_MONTHLY.toFixed(2)}€
                </span>
                <span className="text-md text-text-tertiary">/mois</span>
              </div>
              <p className="text-base text-success mb-1">
                Commence par 7 jours gratuits
              </p>
              <p className="text-base text-text-tertiary">
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
                  : 'border-border-hover bg-overlay-faint hover:border-border-hover'
              }`}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Best value badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-success to-success text-xs font-bold text-bg-base">
                MEILLEURE OFFRE
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-md text-text-secondary">Annuel</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-xs font-medium text-success">
                  <Gift className="w-3 h-3" />
                  7j gratuits
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-text-primary">
                  {(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}€
                </span>
                <span className="text-md text-text-tertiary">/mois</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base line-through text-text-tertiary">
                  {(PREMIUM_PRICE_MONTHLY * 12).toFixed(2)}€/an
                </span>
                <span className="text-base font-semibold text-success">
                  {PREMIUM_PRICE_YEARLY.toFixed(2)}€/an
                </span>
              </div>
              <p className="text-base text-success mb-1">
                Commence par 7 jours gratuits
              </p>
              <p className="text-base text-success">
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
                <p className="text-error text-base">{error}</p>
              </div>
            )}
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="h-14 px-10 text-lg bg-gradient-to-r from-primary via-purple to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-interactive shadow-glow-primary-md animate-pulse-glow"
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
            <p className="text-sm text-text-tertiary mt-3">
              Paiement sécurisé · Annulation facile · Satisfait ou remboursé 30j
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
            <div className="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-3 gap-2 md:gap-4 p-4 bg-overlay-faint border-b border-border-default">
              <div className="text-base font-semibold text-text-secondary">Fonctionnalité</div>
              <div className="text-base font-semibold text-text-secondary text-center">Gratuit</div>
              <div className="text-base font-semibold text-center">
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
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
                  className={`grid grid-cols-[2fr_1fr_1fr] md:grid-cols-3 gap-2 md:gap-4 p-4 items-center ${
                    feature.highlight ? 'bg-primary-5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-md text-text-primary break-words">{feature.name}</span>
                  </div>
                  <div className="text-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-text-tertiary mx-auto" />
                      )
                    ) : (
                      <span className="text-base text-text-secondary">{feature.free}</span>
                    )}
                  </div>
                  <div className="text-center min-w-0">
                    {typeof feature.premium === 'boolean' ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <span className="text-base font-medium text-success break-words">{feature.premium}</span>
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
          <p className="text-md text-text-secondary text-center mb-8">
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
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-br from-primary/30 via-purple/20 to-warning/20 h-full">
                  <Card className="p-5 h-full rounded-[15px] bg-bg-surface">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-1 ring-offset-bg-surface">
                        <TestimonialAvatar type={testimonial.avatarType} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-md font-semibold text-text-primary truncate">{testimonial.name}</span>
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        </div>
                        <div className="text-sm text-text-tertiary">{testimonial.squad}</div>
                        <div className="flex items-center gap-1 text-xs text-text-tertiary/70">
                          <Clock className="w-3 h-3" />
                          <span>{testimonial.memberSince}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-md text-text-secondary leading-relaxed">
                      &laquo; {testimonial.text} &raquo;
                    </p>
                    <div className="flex gap-0.5 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                  </Card>
                </div>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: index * 0.08, duration: 0.35, ease: 'easeOut' }}
              >
              <Card className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <span className="text-md font-medium text-text-primary">{item.q}</span>
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
                    <p className="text-md text-text-secondary leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </Card>
              </motion.div>
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
              <p className="text-md text-text-secondary mb-2 max-w-md mx-auto">
                Rejoins les squads qui ont choisi de jouer sérieusement ensemble.
              </p>
              <p className="text-base text-success mb-6 font-medium">
                Commence par 7 jours d'essai gratuit — sans carte bancaire
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
    </main>
  )
}

export default Premium
