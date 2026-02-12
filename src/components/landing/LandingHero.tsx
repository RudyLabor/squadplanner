'use client'

import { useRef } from 'react'
import { m, type MotionValue } from 'framer-motion'
import { ArrowRight, Sparkles } from '../icons'
import { Link } from 'react-router'
import { springTap } from '../../utils/animations'
import { HeroMockup } from './HeroMockup'

const heroStats = [
  { value: '100%', label: 'gratuit pour commencer' },
  { value: '30s', label: 'pour créer ta squad' },
  { value: '0', label: 'excuse pour ne pas jouer' },
]

interface LandingHeroProps {
  isLoggedIn: boolean
  isDesktop: boolean
  mouseRotateX: MotionValue<number>
  mouseRotateY: MotionValue<number>
  heroRotateX: MotionValue<number>
  heroRotateY: MotionValue<number>
}

export function LandingHero({
  isLoggedIn,
  isDesktop,
  mouseRotateX,
  mouseRotateY,
  heroRotateX,
  heroRotateY,
}: LandingHeroProps) {
  const heroRef = useRef(null)

  return (
    <main
      ref={heroRef}
      id="main-content"
      aria-label="Accueil"
      className="relative overflow-hidden pt-20 noise-overlay"
    >
      <div className="absolute inset-0 mesh-gradient-hero" />
      <m.div
        className="absolute top-0 right-0 w-full max-w-full h-[600px] hero-gradient-pulse"
        style={{
          background:
            'radial-gradient(circle at 80% 0%, var(--color-primary-12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative px-4 md:px-6 py-12 md:py-20 max-w-5xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-primary/12 mb-8">
            <Sparkles className="w-4 h-4 text-purple" aria-hidden="true" />
            <span className="text-base text-purple font-medium">
              Rassemble ta squad et jouez ensemble
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight">
            Transforme
            <br />
            <span className="text-gradient-animated">
              {'\u00ab\u00a0'}on verra{'\u00a0\u00bb'}
            </span>
            <br />
            en {'\u00ab\u00a0'}on y est{'\u00a0\u00bb'}
          </h1>

          <p className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed">
            Squad Planner fait que tes sessions ont vraiment lieu.
            <span className="text-text-primary font-medium"> Ta squad t'attend.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isLoggedIn ? (
              <m.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="inline-flex"
              >
                <Link
                  to="/home"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-glow-idle"
                  data-track="hero_cta_click"
                >
                  Accéder à mes squads
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
            ) : (
              <>
                <m.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  {...springTap}
                  className="w-full sm:w-auto"
                >
                  <Link
                    to="/auth?mode=register&redirect=onboarding"
                    className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
                    data-track="hero_cta_click"
                  >
                    Créer ma squad gratuitement
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </m.div>
                <m.a
                  href="#how-it-works"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
                  whileHover={{ scale: 1.02, y: -2 }}
                  {...springTap}
                  data-track="hero_secondary_cta_click"
                >
                  Comment ça marche
                </m.a>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 md:gap-16 mb-8">
            {heroStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-sm md:text-base text-text-quaternary">{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="text-base text-text-quaternary text-center">
            Lancement 2026 — Rejoins les premiers gamers qui testent Squad Planner
          </p>

          {!isLoggedIn && (
            <Link
              to="/auth"
              className="block mt-4 text-md text-text-quaternary hover:text-text-tertiary transition-colors"
            >
              Déjà un compte ? Se connecter
            </Link>
          )}
        </div>

        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 md:mt-16"
        >
          <m.div
            style={{
              rotateX: isDesktop ? mouseRotateX : heroRotateX,
              rotateY: isDesktop ? mouseRotateY : heroRotateY,
              perspective: 1200,
              transformStyle: 'preserve-3d',
            }}
          >
            <HeroMockup />
          </m.div>
        </m.div>
      </div>
    </main>
  )
}
