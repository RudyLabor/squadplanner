"use client";

import { m, useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion'
import { useRef, useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '../hooks'
import { CustomCursor } from '../components/landing/CustomCursor'
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
import { FaqSection, faqs } from '../components/landing/FaqSection'
import { CtaSection } from '../components/landing/CtaSection'
import { LandingFooter } from '../components/landing/LandingFooter'

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

  return (
    <div className={`min-h-screen bg-bg-base landing-page landing-noise ${isDesktop ? 'landing-custom-cursor' : ''}`}>
      <CustomCursor />
      <m.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />

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
