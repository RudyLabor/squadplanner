import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion'
import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  Users, Calendar, ArrowRight, Check, X as XIcon,
  Target, MessageCircle, Headphones, Sparkles,
  HelpCircle, FileText, Shield, ChevronDown, Menu, X as CloseIcon,
  Mail, MousePointerClick, Clock, Smile
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useAuthStore } from '../hooks'
import { scrollReveal, springTap, scrollRevealLight, scaleReveal } from '../utils/animations'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'
import { HeadphonesIllustration } from '../components/landing/illustrations/HeadphonesIllustration'
import { CalendarIllustration } from '../components/landing/illustrations/CalendarIllustration'
import { ShieldIllustration } from '../components/landing/illustrations/ShieldIllustration'
import { TestimonialCarousel } from '../components/landing/TestimonialCarousel'
import { AnimatedDemo, demoSteps } from '../components/landing/AnimatedDemo'
import { CustomCursor } from '../components/landing/CustomCursor'
import { HeroMockup } from '../components/landing/HeroMockup'

// ─── DATA ────────────────────────────────────────────

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
}
const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const heroStats = [
  { value: '100%', label: 'gratuit pour commencer' },
  { value: '30s', label: 'pour créer ta squad' },
  { value: '0', label: 'excuse pour ne pas jouer' },
]

const steps = [
  { step: '1', title: 'Crée ta Squad', description: 'Donne un nom, choisis ton jeu. Ta squad a direct sa party vocale et son chat.', icon: Users },
  { step: '2', title: 'Invite tes potes', description: 'Partage le code. Ils rejoignent en 10 secondes. Tout le monde au même endroit.', icon: MessageCircle },
  { step: '3', title: 'Planifie, décide, confirme', description: 'Propose un créneau. Chacun répond OUI ou NON. Plus de "on verra".', icon: Calendar },
  { step: '4', title: 'Jouez chaque semaine', description: 'Check-in, jouez, répétez. Semaine après semaine, ta squad devient fiable.', icon: Target },
]

const comparisons = [
  { feature: 'Planning de sessions avec RSVP', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Score de fiabilité par joueur', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Check-in présence réelle', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Coach IA personnalisé', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Party vocale dédiée', discord: true, discordNote: 'Basique', squad: true, squadNote: 'Optimisé gaming' },
  { feature: 'Chat de squad', discord: true, discordNote: 'Basique', squad: true, squadNote: 'Optimisé gaming' },
  { feature: 'Gamification (XP, challenges)', discord: 'partial' as const, discordNote: 'Via bots tiers', squad: true, squadNote: 'Natif' },
]

const faqs = [
  { q: 'Squad Planner est-il gratuit ?', a: 'Oui, Squad Planner est 100% gratuit pour commencer. Crée ta squad, invite tes potes, planifie tes sessions — tout est inclus. Des fonctionnalités premium optionnelles seront disponibles pour les squads qui veulent aller plus loin.' },
  { q: 'Comment inviter mes amis ?', a: 'Une fois ta squad créée, tu reçois un code d\'invitation unique. Partage-le par message, Discord, ou n\'importe quel canal. Tes potes cliquent sur le lien et rejoignent en 10 secondes.' },
  { q: 'Quelle est la différence avec Discord ?', a: 'Discord est fait pour discuter. Squad Planner est fait pour jouer ensemble. On ajoute le planning avec RSVP, le score de fiabilité, et les check-ins pour que vos sessions aient vraiment lieu.' },
  { q: 'Combien de joueurs par squad ?', a: 'Une squad peut accueillir de 2 à 10 joueurs. C\'est la taille idéale pour une équipe de jeu régulière où chacun se sent impliqué.' },
  { q: 'Mes données sont-elles protégées ?', a: 'Absolument. Squad Planner est hébergé en France, conforme au RGPD. Tes données sont chiffrées et tu peux les supprimer à tout moment depuis les paramètres de ton compte.' },
]

const pillars = [
  {
    id: 'voice',
    icon: Headphones,
    illustration: HeadphonesIllustration,
    title: 'Party vocale 24/7',
    description: 'Ta squad a son salon vocal toujours ouvert. Rejoins en 1 clic, reste aussi longtemps que tu veux.',
    color: 'var(--color-success)',
    gradient: 'from-success/[0.08] to-success/[0.01]',
    details: [
      '1 squad = 1 party vocale dédiée',
      'Rejoindre en 1 clic',
      'Qualité HD, latence ultra-faible',
    ],
    detailText: 'Ta squad a son salon vocal 24/7. Pas besoin de planifier. Rejoins quand tu veux, reste aussi longtemps que tu veux.',
  },
  {
    id: 'planning',
    icon: Calendar,
    illustration: CalendarIllustration,
    title: 'Planning avec décision',
    description: 'Propose un créneau. Chacun répond OUI ou NON. Fini les "on verra" — on sait qui vient.',
    color: 'var(--color-gold)',
    gradient: 'from-amber-500/[0.08] to-amber-500/[0.01]',
    details: [
      'Chat de squad permanent',
      'Chat par session',
      'Résumés IA automatiques',
    ],
    detailText: 'Discute avant la session pour t\'organiser. Pendant pour rigoler. Après pour le débrief. Tout est au même endroit.',
  },
  {
    id: 'reliability',
    icon: Target,
    illustration: ShieldIllustration,
    title: 'Fiabilité mesurée',
    description: 'Check-in à chaque session. Ton score montre si tu tiens parole. Tes potes comptent sur toi.',
    color: 'var(--color-error)',
    gradient: 'from-error/[0.08] to-error/[0.01]',
    details: [
      'Check-in obligatoire',
      'Historique visible',
      'Score par joueur',
    ],
    detailText: 'Chaque membre a un score basé sur sa présence réelle. Tu dis que tu viens ? On vérifie. Les no-shows chroniques, ça se voit.',
  },
]

// ─── LAZY SECTION (PERF 6 — reduces initial DOM from ~946 to ~400 elements) ──
function LazySection({ children, className, minHeight = 200 }: { children: ReactNode; className?: string; minHeight?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '200px 0px' })
  return (
    <div ref={ref} className={className} style={!isInView ? { minHeight } : undefined}>
      {isInView ? children : null}
    </div>
  )
}

// ─── DYNAMIC SOCIAL PROOF (TOP 6) ───────────────────
// Dynamic stats hook removed — low early counts hurt credibility.
// Re-enable when user base reaches meaningful numbers (50+ users, 20+ sessions).

// ─── DISCORD SVG ICON ────────────────────────────────

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
    </svg>
  )
}

// ─── COMPONENT ───────────────────────────────────────

export default function Landing() {
  const heroRef = useRef(null)
  const { user } = useAuthStore()
  const { scrollYProgress } = useScroll()
  const heroRotateX = useTransform(scrollYProgress, [0, 0.15], [0, 8])
  const heroRotateY = useTransform(scrollYProgress, [0, 0.1, 0.2], [-2, 0, 2])

  // Mouse tracking for 3D mockup (desktop only)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 20 })
  const mouseRotateX = useTransform(smoothMouseY, [-0.5, 0.5], [5, -5])
  const mouseRotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-5, 5])
  const [isDesktop, setIsDesktop] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [activeFeature, setActiveFeature] = useState(0)
  const [demoStep, setDemoStep] = useState(0)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    setIsDesktop(!isCoarse)
    if (isCoarse) return
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) - 0.5)
      mouseY.set((e.clientY / window.innerHeight) - 0.5)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Inject FAQ Schema
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const isLoggedIn = !!user

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setNewsletterError('')
    setNewsletterSuccess(false)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!newsletterEmail.trim() || !emailRegex.test(newsletterEmail)) {
      setNewsletterError('Email invalide')
      return
    }
    setNewsletterLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase.from('newsletter').insert({ email: newsletterEmail })
      if (error) throw error
      setNewsletterSuccess(true)
      setNewsletterEmail('')
    } catch {
      setNewsletterError('Une erreur est survenue. Réessaie.')
    } finally {
      setNewsletterLoading(false)
    }
  }, [newsletterEmail])

  const navLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Comment ça marche', href: '#how-it-works' },
    { label: 'Témoignages', href: '#testimonials' },
    { label: 'FAQ', href: '/help', isRoute: true },
  ]

  return (
    <div className={`min-h-screen bg-bg-base landing-page landing-noise ${isDesktop ? 'landing-custom-cursor' : ''}`}>
      <CustomCursor />

      {/* Scroll Progress */}
      <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />

      {/* Skip to content (Phase 2 #17) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Aller au contenu principal
      </a>

      {/* ═══ NAVBAR (Phase 3 #26-29) ═══ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 transition-all duration-300 ${
          scrolled
            ? 'bg-bg-base/70 backdrop-blur-xl border-b border-border-subtle'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-5xl mx-auto flex items-center justify-between" aria-label="Navigation principale">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-h-[44px] min-w-[44px]">
            <SquadPlannerLogo size={24} />
            <span className="text-[15px] font-semibold text-text-primary hidden sm:inline">Squad Planner</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              link.isRoute ? (
                <Link key={link.label} to={link.href} className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors">
                  {link.label}
                </a>
              )
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {isLoggedIn ? (
              <Link to="/home" className="px-4 py-2 rounded-lg bg-primary text-white text-[13px] md:text-[14px] font-medium hover:bg-primary-hover transition-colors duration-300 inline-flex items-center">
                Aller à l'app
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden md:inline-flex items-center px-3 md:px-4 py-2 text-[13px] md:text-[14px] text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-hover rounded-lg transition-all">
                  Se connecter
                </Link>
                <Link to="/auth?mode=register&redirect=onboarding" className="hidden md:inline-flex items-center px-3 md:px-4 py-2 rounded-lg bg-primary text-white text-[13px] md:text-[14px] font-medium hover:bg-primary-hover transition-colors duration-300" data-track="navbar_cta_click">
                  Créer ma squad
                  <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
                {/* Mobile hamburger */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary"
                  aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay (Phase 3 #28) */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-40 bg-bg-base/95 backdrop-blur-xl flex flex-col pt-20 px-6"
        >
          <div className="flex flex-col gap-4 mb-8">
            {navLinks.map(link => (
              link.isRoute ? (
                <Link key={link.label} to={link.href} onClick={closeMobileMenu} className="text-lg text-text-primary font-medium py-2">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} onClick={closeMobileMenu} className="text-lg text-text-primary font-medium py-2">
                  {link.label}
                </a>
              )
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/auth" onClick={closeMobileMenu} className="block w-full py-3 text-text-secondary border border-border-subtle rounded-xl text-center">
              Se connecter
            </Link>
            <Link to="/auth?mode=register&redirect=onboarding" onClick={closeMobileMenu} className="block w-full py-3 bg-primary text-white rounded-xl font-medium text-center">
              Créer ma squad gratuitement
            </Link>
          </div>
        </motion.div>
      )}

      {/* ═══ HERO SECTION (Phase 4 #30-34) ═══ */}
      <main
        ref={heroRef}
        id="main-content"
        aria-label="Accueil"
        className="relative overflow-hidden pt-20 noise-overlay"
      >
        {/* Background mesh gradient with pulse animation */}
        <div className="absolute inset-0 mesh-gradient-hero" />
        <motion.div
          className="absolute top-0 right-0 w-full max-w-full h-[600px] hero-gradient-pulse"
          style={{
            background: 'radial-gradient(circle at 80% 0%, var(--color-primary-12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative px-4 md:px-6 py-12 md:py-20 max-w-5xl mx-auto">
          <div className="text-center">
            {/* Badge with shimmer */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-primary/12 mb-8">
              <Sparkles className="w-4 h-4 text-purple" aria-hidden="true" />
              <span className="text-[13px] text-purple font-medium">Rassemble ta squad et jouez ensemble</span>
            </div>

            {/* H1 with display font */}
            <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight">
              Transforme<br />
              <span className="text-gradient-animated">
                {'\u00ab\u00a0'}on verra{'\u00a0\u00bb'}
              </span><br />
              en {'\u00ab\u00a0'}on y est{'\u00a0\u00bb'}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed">
              Squad Planner fait que tes sessions ont vraiment lieu.
              <span className="text-text-primary font-medium"> Ta squad t'attend.</span>
            </p>

            {/* CTA buttons (Phase 4 #33) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {isLoggedIn ? (
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="inline-flex"
                >
                  <Link to="/home" className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-[16px] font-semibold shadow-lg shadow-primary/10 cta-glow-idle" data-track="hero_cta_click">
                    Accéder à mes squads
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
                    <Link to="/auth?mode=register&redirect=onboarding" className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-[16px] font-semibold shadow-lg shadow-primary/10 cta-glow-idle w-full sm:w-auto justify-center" data-track="hero_cta_click">
                      Créer ma squad gratuitement
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                  <motion.a
                    href="#how-it-works"
                    className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
                    whileHover={{ scale: 1.02, y: -2 }}
                    {...springTap}
                    data-track="hero_secondary_cta_click"
                  >
                    Comment ça marche ↓
                  </motion.a>
                </>
              )}
            </div>

            {/* Micro-stats */}
            <div className="flex items-center justify-center gap-8 md:gap-16 mb-8">
              {heroStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-text-primary">{stat.value}</div>
                  <div className="text-[12px] md:text-[13px] text-text-quaternary">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Beta badge */}
            <div className="flex items-center justify-center gap-2 text-[13px] text-text-quaternary">
              <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Beta ouverte — Rejoins les premiers gamers</span>
            </div>

            {/* Login link for non-logged users */}
            {!isLoggedIn && (
              <Link to="/auth" className="block mt-4 text-[14px] text-text-quaternary hover:text-text-tertiary transition-colors">
                Déjà un compte ? Se connecter
              </Link>
            )}
          </div>

          {/* App Preview - Realistic Phone Mockup with cycling screens */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 md:mt-16"
          >
            <motion.div
              style={{
                rotateX: isDesktop ? mouseRotateX : heroRotateX,
                rotateY: isDesktop ? mouseRotateY : heroRotateY,
                perspective: 1200,
                transformStyle: 'preserve-3d',
              }}
            >
              <HeroMockup />
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Section divider */}
      <div className="section-divider" />

      {/* ═══ SOCIAL PROOF COUNTERS (Phase 8 #43-45 + TOP 6 dynamic) ═══ */}
      <section aria-label="Statistiques" className="px-4 md:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[
              { end: 3, suffix: ' clics', singularSuffix: ' clic' as string | undefined, label: 'pour confirmer ta présence', icon: MousePointerClick, color: 'var(--color-secondary)' },
              { end: 5, suffix: ' min/sem', singularSuffix: undefined as string | undefined, label: 'pour organiser toutes tes sessions', icon: Clock, color: 'var(--color-primary)' },
              { end: 0, suffix: '', singularSuffix: undefined as string | undefined, label: 'prise de tête pour planifier', icon: Smile, color: 'var(--color-gold)' },
              { end: 4.9, suffix: '★', singularSuffix: undefined as string | undefined, label: 'satisfaction beta testeurs', icon: Target, color: 'var(--color-success)', decimals: 1 },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className="text-center p-4 md:p-6 rounded-2xl bg-bg-elevated border border-border-subtle relative group hover:border-border-hover transition-colors"
                variants={scaleReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-success animate-pulse" />
                <stat.icon className="w-5 h-5 md:w-7 md:h-7 mx-auto mb-2" style={{ color: stat.color }} aria-hidden="true" />
                <AnimatedCounter end={stat.end} suffix={stat.suffix} singularSuffix={stat.singularSuffix} separator=" " className="text-xl md:text-3xl font-bold text-text-primary" duration={2.5} decimals={stat.decimals || 0} />
                <div className="text-[11px] md:text-sm text-text-tertiary mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ PROBLEM SECTION (Phase 5 #35-37) ═══ */}
      <section aria-label="Le problème" className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={scrollRevealLight} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Le problème que tu connais trop bien
            </h2>
            <p className="text-text-tertiary text-lg">
              T'as des amis. T'as Discord. T'as des jeux. Mais vous jouez jamais ensemble.
            </p>
          </motion.div>

          {/* 2x2 grid (Phase 5 #35) */}
          <motion.div className="grid md:grid-cols-2 gap-4 mb-4" variants={staggerContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            {[
              { emoji: '💬', text: '"On joue ce soir ?" → Personne ne répond' },
              { emoji: '🤷', text: '"Je sais pas, on verra" → Rien ne se passe' },
              { emoji: '👻', text: 'Session prévue → 2 mecs sur 5 se connectent' },
              { emoji: '😤', text: 'Tout le monde attend que quelqu\'un organise' },
            ].map((item) => (
              <motion.div
                key={item.text}
                variants={staggerItemVariants}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-card border border-border-subtle hover:border-border-hover hover:scale-[1.02] transition-all cursor-default"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-text-secondary">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Result callout (Phase 5 #36) */}
          <motion.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-5 rounded-xl bg-gradient-to-r from-error/[0.08] to-warning/[0.05] border border-error/20 text-center"
          >
            <span className="text-xl mr-2">💥</span>
            <span className="text-text-primary font-semibold">Résultat → Plus personne n'organise rien. Ta squad meurt à petit feu.</span>
          </motion.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ HOW IT WORKS + DEMO (Phase 6-7 #38-42, merged Phase 20 #83) ═══ */}
      <section id="how-it-works" aria-label="Comment ça marche" className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-primary/[0.015]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Comment ça marche
            </h2>
            <p className="text-text-tertiary text-lg">
              De la création de squad à la session de jeu en 30 secondes
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Phone mockup (AnimatedDemo) */}
            <AnimatedDemo currentStep={demoStep} onStepChange={setDemoStep} />

            {/* Horizontal stepper on desktop, vertical on mobile (Phase 6 #38-40) */}
            <div className="flex-1 w-full">
              {/* Desktop horizontal stepper */}
              <div className="hidden lg:block mb-8">
                <div className="flex items-center justify-between relative">
                  {/* Progress line background */}
                  <div className="absolute top-5 left-[5%] right-[5%] h-0.5 bg-border-subtle" />
                  {/* Active progress line */}
                  <div
                    className="absolute top-5 left-[5%] h-0.5 stepper-line"
                    style={{ width: `${(demoStep / (steps.length - 1)) * 90}%` }}
                  />
                  {steps.map((step, i) => {
                    const isActive = i === demoStep
                    const isPast = i < demoStep
                    const StepIcon = step.icon
                    return (
                      <button
                        type="button"
                        key={step.step}
                        onClick={() => setDemoStep(i)}
                        className="relative z-10 flex flex-col items-center text-center"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                          isActive ? 'bg-primary text-white scale-110' :
                          isPast ? 'bg-primary/20 text-primary' :
                          'bg-bg-elevated border border-border-subtle text-text-quaternary'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-medium transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                          {step.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step details */}
              <div className="space-y-3 lg:space-y-0">
                {steps.map((step, i) => {
                  const isActive = i === demoStep
                  const StepIcon = step.icon
                  return (
                    <motion.button
                      type="button"
                      key={step.step}
                      onClick={() => setDemoStep(i)}
                      className={`flex items-start gap-4 p-4 lg:p-5 rounded-2xl w-full text-left transition-all ${
                        isActive
                          ? 'bg-bg-elevated border border-border-hover'
                          : 'border border-transparent hover:bg-bg-elevated/50 lg:hidden'
                      }`}
                      initial={false}
                      animate={isActive ? { scale: 1 } : { scale: 1 }}
                    >
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isActive ? '' : 'opacity-50'
                      }`} style={{ backgroundColor: `${demoSteps[i]?.color || 'var(--color-primary)'}15` }}>
                        <StepIcon className="w-5 h-5" style={{ color: demoSteps[i]?.color || 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <h3 className={`text-[15px] font-semibold transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>{step.title}</h3>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-[14px] text-text-tertiary mt-1"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </div>
                      {/* Progress bar for active step */}
                      {isActive && (
                        <motion.div
                          className="hidden lg:block h-0.5 bg-primary rounded-full ml-auto self-center"
                          initial={{ width: 0 }}
                          animate={{ width: 40 }}
                          transition={{ duration: (demoSteps[i]?.duration || 3000) / 1000, ease: 'linear' }}
                          key={`progress-${demoStep}`}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ FEATURES - MERGED PILLARS + DETAILS (Phase 9-10 #46-50, Phase 20 #83) ═══ */}
      <LazySection minHeight={400}>
      <section id="features" aria-label="Fonctionnalités principales" className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Les 3 piliers de Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">
              Chacun résout un problème précis. Ensemble, ils font la différence.
            </p>
          </motion.div>

          {/* Pillar tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {pillars.map((pillar, i) => {
              const PillarIcon = pillar.icon
              return (
                <button
                  type="button"
                  key={pillar.id}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all text-sm font-medium ${
                    activeFeature === i
                      ? 'text-white shadow-lg'
                      : 'bg-surface-card border border-border-subtle text-text-tertiary hover:text-text-primary hover:border-border-hover'
                  }`}
                  style={activeFeature === i ? {
                    backgroundColor: `${pillar.color}20`,
                    color: pillar.color,
                    borderColor: `${pillar.color}40`,
                    border: `1px solid ${pillar.color}40`,
                    boxShadow: `0 0 20px ${pillar.color}15`,
                  } : undefined}
                >
                  <PillarIcon className="w-4 h-4" />
                  {pillar.title}
                </button>
              )
            })}
          </div>

          {/* Active pillar detail card */}
          {pillars.map((pillar, i) => {
            if (i !== activeFeature) return null
            const PillarIcon = pillar.icon
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-8 md:p-10 rounded-3xl bg-gradient-to-br ${pillar.gradient} border`}
                style={{ borderColor: `${pillar.color}25` }}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${pillar.color}12` }}>
                      <div className="hidden md:block">
                        <pillar.illustration size={40} />
                      </div>
                      <PillarIcon className="w-8 h-8 md:hidden" style={{ color: pillar.color }} />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">{pillar.title}</h3>
                    <p className="text-text-tertiary mb-4">{pillar.detailText}</p>
                    <ul className="space-y-2">
                      {pillar.details.map(item => (
                        <li key={item} className="flex items-center gap-2 text-[14px] text-text-secondary">
                          <Check className="w-4 h-4" style={{ color: pillar.color }} aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Voice mockup for "voice" pillar */}
                  {pillar.id === 'voice' && (
                    <div className="relative max-w-[240px] mx-auto md:mx-0">
                      <div className="bg-bg-surface rounded-[1.5rem] p-3 border border-success/15">
                        <div className="bg-bg-base rounded-[1.2rem] overflow-hidden p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <motion.div className="w-2 h-2 rounded-full bg-success" animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }} transition={{ duration: 2, repeat: 3, ease: 'easeInOut' }} />
                            <span className="text-xs font-semibold text-text-primary">Party vocale</span>
                            <span className="text-xs text-success ml-auto">En ligne</span>
                          </div>
                          <div className="flex items-center justify-center gap-3 mb-3">
                            {[
                              { name: 'Max', color: 'var(--color-success)', speaking: true },
                              { name: 'Luna', color: 'var(--color-primary)', speaking: false },
                              { name: 'Kira', color: 'var(--color-gold)', speaking: false },
                              { name: 'Jay', color: 'var(--color-purple)', speaking: false },
                            ].map((p) => (
                              <div key={p.name} className="flex flex-col items-center">
                                <div className="relative">
                                  {p.speaking && (
                                    <motion.div className="absolute inset-0 w-10 h-10 rounded-full bg-success" animate={{ scale: [1, 1.3], opacity: [0.3, 0] }} transition={{ duration: 1.5, repeat: 3, ease: 'easeOut' }} />
                                  )}
                                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${p.speaking ? 'ring-2 ring-success/50' : ''}`} style={{ backgroundColor: p.color }}>
                                    {p.name[0]}
                                  </div>
                                </div>
                                <span className={`text-[9px] mt-1 ${p.speaking ? 'text-success font-medium' : 'text-text-tertiary'}`}>{p.name}</span>
                              </div>
                            ))}
                          </div>
                          {/* Voice wave */}
                          <div className="flex items-center justify-center gap-0.5">
                            {[0, 1, 2, 3, 4, 5, 6].map((j) => (
                              <motion.div key={j} className="w-0.5 rounded-full bg-success" animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: 4, delay: j * 0.08, ease: 'easeInOut' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {/* Summary text (Phase 10 #50) */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[15px] text-text-quaternary mt-10"
          >
            Plus qu'un simple Discord — Squad Planner crée des{' '}
            <span className="text-text-primary font-semibold text-gradient-animated">habitudes de jeu régulières</span>{' '}
            pour ta communauté
          </motion.p>
        </div>
      </section>
      </LazySection>

      <div className="section-divider" />

      {/* ═══ RELIABILITY SCORE (Phase 11 #51-52) ═══ */}
      <LazySection minHeight={300}>
      <section aria-label="Score de fiabilité" className="px-4 md:px-6 py-10 md:py-14 bg-gradient-to-b from-transparent to-error/[0.02]">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={scaleReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-surface-card border border-error/20"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular progress mockup (Phase 11 #51) */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-error-10)" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="45" fill="none" stroke="var(--color-error)" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      whileInView={{ strokeDashoffset: 283 * (1 - 0.94) }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-error">94%</span>
                    <span className="text-[10px] text-text-tertiary">fiabilité</span>
                  </div>
                </div>
                {/* Session history dots */}
                <div className="flex gap-1 mt-3">
                  {['✅', '✅', '✅', '❌', '✅', '✅'].map((s, j) => (
                    <motion.span
                      key={j}
                      className="text-xs"
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + j * 0.1 }}
                    >
                      {s}
                    </motion.span>
                  ))}
                </div>
                <span className="text-xs text-text-quaternary mt-1">MaxGamer_94</span>
              </div>

              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  Score de fiabilité : tes potes comptent sur toi
                </h3>
                <p className="text-text-tertiary mb-4">
                  Chaque membre a un score basé sur sa présence réelle. Tu dis que tu viens ? On vérifie.
                  <span className="text-error font-medium"> Les no-shows chroniques, ça se voit.</span>
                </p>
                <motion.div
                  className="flex flex-wrap justify-center md:justify-start gap-3"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {[
                    { label: 'Check-in obligatoire', icon: '✅' },
                    { label: 'Historique visible', icon: '📊' },
                    { label: 'Score par joueur', icon: '🏆' },
                  ].map(item => (
                    <motion.span key={item.label} variants={staggerItemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 text-[13px] text-error">
                      {item.icon} {item.label}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      </LazySection>

      <div className="section-divider" />

      {/* ═══ COMPARISON TABLE (Phase 12 #22, #53-54) ═══ */}
      <LazySection minHeight={400}>
      <section aria-label="Comparaison avec Discord" className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Plus qu'un Discord pour gamers
            </h2>
            <p className="text-text-tertiary text-lg">
              Discord est fait pour discuter. Squad Planner est fait pour <span className="text-text-primary font-medium">jouer ensemble</span>.
            </p>
          </motion.div>

          {/* Semantic table (Phase 2 #22, Phase 12 #53) */}
          <motion.div
            className="overflow-x-auto rounded-2xl border border-border-default"
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <table className="w-full min-w-[500px]">
              <caption className="sr-only">
                Comparaison des fonctionnalités entre Discord et Squad Planner
              </caption>
              <thead>
                <tr className="bg-bg-surface border-b border-border-subtle">
                  <th scope="col" className="text-left text-[12px] md:text-[13px] font-medium text-text-secondary px-3 md:px-6 py-3 sticky left-0 z-10 bg-bg-surface">
                    Fonctionnalité
                  </th>
                  <th scope="col" className="text-center text-[12px] md:text-[13px] font-medium text-text-secondary px-3 md:px-6 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <DiscordIcon className="w-4 h-4" aria-hidden="true" />
                      Discord
                    </span>
                  </th>
                  <th scope="col" className="text-center text-[12px] md:text-[13px] font-medium text-primary px-3 md:px-6 py-3 border-t-2 border-t-primary">
                    <span className="inline-flex items-center gap-1.5">
                      <SquadPlannerLogo size={14} aria-hidden="true" />
                      SP
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, i) => (
                  <tr
                    key={item.feature}
                    className={`${i < comparisons.length - 1 ? 'border-b border-border-subtle' : ''} ${
                      !item.discord ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    <th scope="row" className="text-left text-[13px] md:text-[14px] text-text-primary px-3 md:px-6 py-3 md:py-4 font-normal sticky left-0 z-10 bg-bg-base">
                      {item.feature}
                    </th>
                    <td className="text-center px-3 md:px-6 py-3 md:py-4">
                      {item.discord === true ? (
                        <span className="inline-flex flex-col items-center">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-success" aria-hidden="true" />
                          {item.discordNote ? (
                            <span className="text-[10px] text-text-quaternary mt-0.5">{item.discordNote}</span>
                          ) : (
                            <span className="sr-only">Disponible</span>
                          )}
                        </span>
                      ) : item.discord === 'partial' ? (
                        <span className="inline-flex flex-col items-center">
                          <span className="text-[10px] md:text-[12px] text-warning px-1.5 py-0.5 rounded-full bg-warning/10">{item.discordNote || 'Limité'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex flex-col items-center">
                          <XIcon className="w-4 h-4 md:w-5 md:h-5 text-text-quaternary" aria-hidden="true" />
                          <span className="sr-only">Non disponible</span>
                        </span>
                      )}
                    </td>
                    <td className="text-center px-3 md:px-6 py-3 md:py-4">
                      <span className="inline-flex flex-col items-center">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-success" aria-hidden="true" />
                        {item.squadNote ? (
                          <span className="text-[10px] text-cyan-400 mt-0.5">{item.squadNote}</span>
                        ) : (
                          <span className="sr-only">Disponible</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Honesty footnote (Phase 12 #54) */}
          <p className="text-center text-[13px] text-text-quaternary mt-6 max-w-lg mx-auto">
            Discord reste indispensable pour les communautés larges. Squad Planner est conçu spécifiquement pour ta squad de 3 à 10 joueurs.
          </p>
        </div>
      </section>
      </LazySection>

      <div className="section-divider" />

      {/* ═══ TESTIMONIALS (Phase 13 #55-58) ═══ */}
      <LazySection minHeight={300}>
      <section id="testimonials" aria-label="Témoignages" className="px-4 md:px-6 py-10 md:py-16">
        <div className="max-w-5xl mx-auto">
          <TestimonialCarousel />
        </div>
      </section>
      </LazySection>

      <div className="section-divider" />

      {/* ═══ PRICING SECTION ═══ */}
      <LazySection minHeight={400}>
      <section id="pricing" aria-label="Tarifs" className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Tarifs simples, sans surprise
            </h2>
            <p className="text-text-tertiary text-[15px] max-w-md mx-auto">
              Commence gratuitement. Passe Premium quand tu veux débloquer tout le potentiel.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border border-border-default bg-bg-elevated"
            >
              <h3 className="text-[18px] font-bold text-text-primary mb-1">Gratuit</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-text-primary">0€</span>
                <span className="text-text-quaternary text-sm">/mois</span>
              </div>
              <p className="text-[13px] text-text-tertiary mb-5">Tout ce qu'il faut pour jouer avec ta squad.</p>
              <ul className="space-y-2.5 mb-6">
                {['Squads illimitées', 'Sessions avec RSVP', 'Chat de squad', 'Score de fiabilité', 'Party vocale', 'Notifications push'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <motion.button
                  className="w-full py-3 rounded-xl border border-border-default text-text-primary text-[14px] font-medium hover:bg-bg-hover transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Commencer gratuitement
                </motion.button>
              </Link>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 to-transparent relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-bl-xl">
                POPULAIRE
              </div>
              <h3 className="text-[18px] font-bold text-text-primary mb-1">Premium</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-text-primary">4,99€</span>
                <span className="text-text-quaternary text-sm">/mois</span>
              </div>
              <p className="text-[13px] text-text-tertiary mb-5">Pour les squads qui veulent aller plus loin.</p>
              <ul className="space-y-2.5 mb-6">
                {['Tout le plan Gratuit', 'Coach IA avancé', 'Qualité audio HD', 'Historique illimité', 'Stats avancées', 'Badges exclusifs'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <motion.button
                  className="w-full py-3 rounded-xl bg-primary text-white text-[14px] font-semibold hover:bg-primary-hover transition-colors shadow-glow-primary-sm"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Essayer Premium
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      </LazySection>

      <div className="section-divider" />

      {/* ═══ FAQ INLINE (Phase 19 #78) ═══ */}
      <LazySection minHeight={300}>
      <section aria-label="Questions fréquentes" className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                variants={staggerItemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="border border-border-subtle rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-bg-elevated/50 transition-colors"
                  aria-expanded={expandedFaq === i}
                >
                  <span className="text-[15px] font-medium text-text-primary pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`faq-answer ${expandedFaq === i ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-[14px] text-text-tertiary leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      </LazySection>

      <div className="section-divider" />

      {/* ═══ CTA FINAL (Phase 14 #59-60) ═══ */}
      <LazySection minHeight={300}>
      <section aria-label="Appel à l'action" className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-b from-primary/10 to-cyan-500/[0.04] border border-primary/15 text-center overflow-hidden"
          >
            {/* Animated glow background */}
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary-10)_0%,transparent_60%)]"
              animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative z-10">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" aria-hidden="true" />
              </motion.div>
              <h2 className="text-2xl md:text-4xl font-bold text-text-primary mb-4">
                Ta squad t'attend
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Gratuit, sans engagement. Lance ta première session en 30 secondes.
              </p>
              <motion.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link to="/auth?mode=register&redirect=onboarding" className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-[18px] font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle" data-track="bottom_cta_click">
                  Rejoindre l'aventure
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              {/* Reassurance line (Phase 14 #59) */}
              <p className="text-[13px] text-text-quaternary mt-4">
                Gratuit · Pas de carte bancaire · 30 secondes
              </p>
              {/* Secondary CTA (Phase 14 #60) */}
              <a
                href="mailto:contact@squadplanner.fr"
                className="inline-block mt-4 py-2 text-[13px] text-text-quaternary hover:text-text-tertiary transition-colors underline underline-offset-2 min-h-[44px]"
              >
                Une question ? Contacte-nous
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      </LazySection>

      {/* ═══ FOOTER (Phase 15 #61-62) ═══ */}
      <footer className="px-4 md:px-6 py-16 border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Produit */}
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Produit</h3>
              <ul className="space-y-0">
                <li><Link to="/auth?mode=register&redirect=onboarding" className="inline-block py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Créer ma squad</Link></li>
                <li><Link to="/premium" className="inline-block py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Premium</Link></li>
                <li><a href="#features" className="inline-block py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Fonctionnalités</a></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Ressources</h3>
              <ul className="space-y-0">
                <li><Link to="/help" className="inline-flex items-center gap-1.5 py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px]"><HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />FAQ</Link></li>
                <li><a href="mailto:contact@squadplanner.fr" className="inline-block py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Contact</a></li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Légal</h3>
              <ul className="space-y-0">
                <li><Link to="/legal" className="inline-flex items-center gap-1.5 py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px]"><FileText className="w-3.5 h-3.5" aria-hidden="true" />CGU</Link></li>
                <li><Link to="/legal?tab=privacy" className="inline-flex items-center gap-1.5 py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px]"><Shield className="w-3.5 h-3.5" aria-hidden="true" />Confidentialité</Link></li>
              </ul>
            </div>

            {/* Communauté */}
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Communauté</h3>
              <ul className="space-y-0">
                <li><span className="inline-flex items-center gap-1.5 py-2 text-[14px] text-text-tertiary min-h-[44px]"><span className="w-2 h-2 rounded-full bg-success animate-pulse" />Beta ouverte</span></li>
                {/* TODO: Réactiver quand le compte @squadplannerapp existera sur X */}
                <li>
                  <span className="inline-flex items-center gap-1.5 py-2 text-[14px] text-text-quaternary min-h-[44px] cursor-default">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Twitter / X (bientôt)
                  </span>
                </li>
                <li><a href="mailto:contact@squadplanner.fr" className="inline-block py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Nous contacter</a></li>
              </ul>
            </div>
          </div>

          {/* Trust badges (Phase 15 #61) */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { label: 'Hébergé en France', icon: '🇫🇷' },
              { label: 'RGPD compliant', icon: '🛡️' },
              { label: 'Données chiffrées', icon: '🔒' },
            ].map(badge => (
              <span key={badge.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-subtle text-[12px] text-text-tertiary">
                {badge.icon} {badge.label}
              </span>
            ))}
          </div>

          {/* Newsletter (Phase 15 #61) — proper form with validation */}
          <div className="max-w-md mx-auto mb-10">
            <form onSubmit={handleNewsletterSubmit} noValidate>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Reçois les updates Squad Planner"
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-border-subtle rounded-lg text-[14px] text-text-primary placeholder:text-text-quaternary focus:border-primary focus:outline-none transition-colors"
                    aria-label="Adresse email pour la newsletter"
                    value={newsletterEmail}
                    onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterError(''); setNewsletterSuccess(false) }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="px-5 min-h-[44px] bg-primary text-white text-[14px] font-medium rounded-lg hover:bg-primary-hover transition-colors shrink-0 disabled:opacity-60"
                >
                  {newsletterLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "S'abonner"
                  )}
                </button>
              </div>
              {newsletterError && <p role="alert" className="text-error text-sm mt-1.5">{newsletterError}</p>}
              {newsletterSuccess && <p role="status" className="text-success text-sm mt-1.5">Merci ! Tu recevras nos updates.</p>}
            </form>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border-subtle pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SquadPlannerLogo size={20} />
              <div>
                <span className="text-[14px] font-semibold text-text-primary">Squad Planner</span>
                <span className="text-[12px] text-text-quaternary ml-2">Le Calendly du gaming</span>
              </div>
            </div>
            <p className="text-[13px] text-text-quaternary">
              © 2026 Squad Planner. Jouez ensemble, pour de vrai.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
