
import { useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion'
import { useRef, useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '../hooks/useAuth'
import { LandingNavbar } from '../components/landing/LandingNavbar'
import { LandingHero } from '../components/landing/LandingHero'
import { SocialProofSection } from '../components/landing/SocialProofSection'
import { ProblemSection } from '../components/landing/ProblemSection'
import { HowItWorksSection } from '../components/landing/HowItWorksSection'
import { FeaturesSection } from '../components/landing/FeaturesSection'
import { ReliabilitySection } from '../components/landing/ReliabilitySection'
import { ComparisonSection } from '../components/landing/ComparisonSection'
import { TestimonialCarousel } from '../components/landing/TestimonialCarousel'
import { PricingSection } from '../components/landing/PricingSection'
import { FaqSection } from '../components/landing/FaqSection'
import { CtaSection } from '../components/landing/CtaSection'
import { SeoContentSection } from '../components/landing/SeoContentSection'
import { LandingFooter } from '../components/landing/LandingFooter'
import { MobileStickyCTA } from '../components/landing/MobileStickyCTA'
import { CaptainQuiz } from '../components/landing/CaptainQuiz'
import { GhostCalculator } from '../components/landing/GhostCalculator'
import { SocialProofNotification } from '../components/SocialProofNotification'
import { ArrowRight } from '../components/icons'
import { Link } from 'react-router'
import { trackEvent } from '../utils/analytics'

// ─── LAZY SECTION (PERF 6 — reduces initial DOM from ~946 to ~400 elements) ──
function LazySection({
  children,
  className,
  id,
  minHeight = 200,
}: {
  children: ReactNode
  className?: string
  id?: string
  minHeight?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '200px 0px' })
  return (
    <div ref={ref} id={id} className={className} style={!isInView ? { minHeight } : undefined}>
      {isInView ? children : null}
    </div>
  )
}

// ─── COMPONENT ───────────────────────────────────────
export default function Landing() {
  const { user } = useAuthStore()
  const { scrollYProgress } = useScroll()
  const heroRotateX = useTransform(scrollYProgress, [0, 0.15], [0, 8])
  const heroRotateY = useTransform(scrollYProgress, [0, 0.1, 0.2], [-2, 0, 2])
  // Note: scroll-progress bar removed — user reported unwanted blue bar at top

  // Mouse tracking for 3D mockup (desktop only)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 20 })
  const mouseRotateX = useTransform(smoothMouseY, [-0.5, 0.5], [5, -5])
  const mouseRotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-5, 5])
  const [isDesktop, setIsDesktop] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    setIsDesktop(!isCoarse)
    if (isCoarse) return
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5)
      mouseY.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const isLoggedIn = !!user

  // Track landing page view
  useEffect(() => {
    trackEvent('page_viewed', { page: 'landing' })
  }, [])

  return (
    <div
      className="min-h-screen bg-bg-base landing-page landing-noise mesh-bg"
    >

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-bg-elevated focus:text-text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:border focus:border-border-default"
      >
        Aller au contenu principal
      </a>

      <LandingNavbar isLoggedIn={isLoggedIn} />

      <LandingHero
        isLoggedIn={isLoggedIn}
        isDesktop={isDesktop}
        mouseRotateX={mouseRotateX}
        mouseRotateY={mouseRotateY}
        heroRotateX={heroRotateX}
        heroRotateY={heroRotateY}
      />

      <div className="section-divider" />
      <SocialProofSection />
      <div className="section-divider" />
      <ProblemSection />
      <div className="section-divider" />
      {/* R21 — Captain Quiz (IKEA Effect + Commitment) */}
      <LazySection minHeight={400}>
        <CaptainQuiz />
      </LazySection>
      <div className="section-divider" />
      {/* CTA intermédiaire */}
      <div className="text-center py-8 px-4">
        <Link
          to="/auth?mode=register&redirect=onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary-hover font-medium hover:bg-primary/20 transition-colors border border-primary/20"
          data-track="mid_cta_click"
          onClick={() => trackEvent('landing_cta_clicked', { position: 'mid_page', label: 'cree_ta_squad' })}
        >
          Fini les excuses — Crée ta squad maintenant
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <HowItWorksSection demoStep={demoStep} setDemoStep={setDemoStep} />
      <div className="section-divider" />
      <LazySection id="features" minHeight={400}>
        <FeaturesSection />
      </LazySection>
      <div className="section-divider" />
      <LazySection minHeight={300}>
        <ReliabilitySection />
      </LazySection>
      <div className="section-divider" />
      {/* R22 — Ghost Calculator (Loss Aversion + Commitment) */}
      <LazySection minHeight={400}>
        <GhostCalculator />
      </LazySection>
      <div className="section-divider" />
      <LazySection minHeight={400}>
        <ComparisonSection />
      </LazySection>
      <div className="section-divider" />
      <LazySection id="testimonials" minHeight={300}>
        <section aria-label="Témoignages" className="px-4 md:px-6 py-10 md:py-16">
          <div className="max-w-5xl mx-auto">
            <TestimonialCarousel />
          </div>
        </section>
      </LazySection>
      <div className="section-divider" />
      <LazySection id="pricing" minHeight={400}>
        <PricingSection />
      </LazySection>
      <div className="section-divider" />
      <LazySection id="faq" minHeight={300}>
        <FaqSection />
      </LazySection>
      <div className="section-divider" />
      <LazySection minHeight={300}>
        <SeoContentSection />
      </LazySection>
      <div className="section-divider" />
      <LazySection minHeight={300}>
        <CtaSection />
      </LazySection>
      <SocialProofNotification />
      <MobileStickyCTA />
      <LandingFooter />
    </div>
  )
}
