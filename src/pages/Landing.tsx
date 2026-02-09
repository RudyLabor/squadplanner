import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion'
import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react'
import { ArrowRight, Sparkles, Menu, X as CloseIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useAuthStore } from '../hooks'
import { springTap } from '../utils/animations'
import { CustomCursor } from '../components/landing/CustomCursor'
import { HeroMockup } from '../components/landing/HeroMockup'
import { SocialProofSection } from '../components/landing/SocialProofSection'
import { ProblemSection } from '../components/landing/ProblemSection'
import { HowItWorksSection } from '../components/landing/HowItWorksSection'
import { FeaturesSection } from '../components/landing/FeaturesSection'
import { ReliabilitySection } from '../components/landing/ReliabilitySection'
import { ComparisonSection } from '../components/landing/ComparisonSection'
import { TestimonialCarousel } from '../components/landing/TestimonialCarousel'
import { PricingSection } from '../components/landing/PricingSection'
import { FaqSection, faqs } from '../components/landing/FaqSection'
import { CtaSection } from '../components/landing/CtaSection'
import { LandingFooter } from '../components/landing/LandingFooter'

// ─── DATA ────────────────────────────────────────────

const heroStats = [
  { value: '100%', label: 'gratuit pour commencer' },
  { value: '30s', label: 'pour créer ta squad' },
  { value: '0', label: 'excuse pour ne pas jouer' },
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
  const [demoStep, setDemoStep] = useState(0)

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

  const navLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Comment ça marche', href: '#how-it-works' },
    { label: 'Témoignages', href: '#testimonials' },
    { label: 'FAQ', href: '/help', isRoute: true },
  ]

  return (
    <div className={`min-h-screen bg-bg-base landing-page landing-noise ${isDesktop ? 'landing-custom-cursor' : ''}`}>
      <CustomCursor />
      <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />

      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-bg-elevated focus:text-text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:border focus:border-border-default"
      >
        Aller au contenu principal
      </a>

      {/* ═══ NAVBAR ═══ */}
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
            <span className="text-md font-semibold text-text-primary hidden sm:inline">Squad Planner</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              link.isRoute ? (
                <Link key={link.label} to={link.href} className="text-base text-text-tertiary hover:text-text-primary transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className="text-base text-text-tertiary hover:text-text-primary transition-colors">
                  {link.label}
                </a>
              )
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {isLoggedIn ? (
              <Link to="/home" className="px-4 py-2 rounded-lg bg-primary text-white text-base md:text-md font-medium hover:bg-primary-hover transition-colors duration-300 inline-flex items-center">
                Aller à l'app
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden md:inline-flex items-center px-3 md:px-4 py-2 text-base md:text-md text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-hover rounded-lg transition-all">
                  Se connecter
                </Link>
                <Link to="/auth?mode=register&redirect=onboarding" className="hidden md:inline-flex items-center px-3 md:px-4 py-2 rounded-lg bg-primary text-white text-base md:text-md font-medium hover:bg-primary-hover transition-colors duration-300" data-track="navbar_cta_click">
                  Créer ma squad
                  <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
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

      {/* Mobile menu overlay */}
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

      {/* ═══ HERO SECTION ═══ */}
      <main ref={heroRef} id="main-content" aria-label="Accueil" className="relative overflow-hidden pt-20 noise-overlay">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-primary/12 mb-8">
              <Sparkles className="w-4 h-4 text-purple" aria-hidden="true" />
              <span className="text-base text-purple font-medium">Rassemble ta squad et jouez ensemble</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight">
              Transforme<br />
              <span className="text-gradient-animated">
                {'\u00ab\u00a0'}on verra{'\u00a0\u00bb'}
              </span><br />
              en {'\u00ab\u00a0'}on y est{'\u00a0\u00bb'}
            </h1>

            <p className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed">
              Squad Planner fait que tes sessions ont vraiment lieu.
              <span className="text-text-primary font-medium"> Ta squad t'attend.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {isLoggedIn ? (
                <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="inline-flex">
                  <Link to="/home" className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-glow-idle" data-track="hero_cta_click">
                    Accéder à mes squads
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
                    <Link to="/auth?mode=register&redirect=onboarding" className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-glow-idle w-full sm:w-auto justify-center" data-track="hero_cta_click">
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

            <div className="flex items-center justify-center gap-8 md:gap-16 mb-8">
              {heroStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-text-primary">{stat.value}</div>
                  <div className="text-sm md:text-base text-text-quaternary">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-base text-text-quaternary">
              <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Beta ouverte — Rejoins les premiers gamers</span>
            </div>

            {!isLoggedIn && (
              <Link to="/auth" className="block mt-4 text-md text-text-quaternary hover:text-text-tertiary transition-colors">
                Déjà un compte ? Se connecter
              </Link>
            )}
          </div>

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

      {/* ═══ BELOW-THE-FOLD SECTIONS ═══ */}
      <div className="section-divider" />
      <SocialProofSection />
      <div className="section-divider" />
      <ProblemSection />
      <div className="section-divider" />
      <HowItWorksSection demoStep={demoStep} setDemoStep={setDemoStep} />
      <div className="section-divider" />
      <LazySection minHeight={400}><FeaturesSection /></LazySection>
      <div className="section-divider" />
      <LazySection minHeight={300}><ReliabilitySection /></LazySection>
      <div className="section-divider" />
      <LazySection minHeight={400}><ComparisonSection /></LazySection>
      <div className="section-divider" />
      <LazySection minHeight={300}>
        <section id="testimonials" aria-label="Témoignages" className="px-4 md:px-6 py-10 md:py-16">
          <div className="max-w-5xl mx-auto"><TestimonialCarousel /></div>
        </section>
      </LazySection>
      <div className="section-divider" />
      <LazySection minHeight={400}><PricingSection /></LazySection>
      <div className="section-divider" />
      <LazySection minHeight={300}><FaqSection /></LazySection>
      <div className="section-divider" />
      <LazySection minHeight={300}><CtaSection /></LazySection>
      <LandingFooter />
    </div>
  )
}
