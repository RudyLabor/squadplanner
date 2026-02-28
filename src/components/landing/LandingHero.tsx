
import { useRef } from 'react'
import { m, type MotionValue } from 'framer-motion'
import { ArrowRight, Sparkles } from '../icons'
import { Link } from 'react-router'
import { springTap } from '../../utils/animations'
import { HeroMockup } from './HeroMockup'

const heroStats = [
  { value: 'Gratuit', label: 'sans piège' },
  { value: '30s', label: 'chrono pour ta squad' },
  { value: '0', label: 'ghosting toléré' },
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

      {/* Floating geometric shapes — subtle depth */}
      <m.div
        className="absolute top-[15%] left-[8%] w-40 h-40 rounded-full opacity-[0.10] blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <m.div
        className="absolute top-[40%] right-[5%] w-32 h-32 rounded-2xl rotate-45 opacity-[0.08] blur-3xl"
        style={{ background: 'linear-gradient(135deg, var(--color-purple) 0%, transparent 70%)' }}
        animate={{ y: [0, 15, 0], rotate: [45, 50, 45] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <m.div
        className="absolute bottom-[20%] left-[15%] w-28 h-28 rounded-full opacity-[0.08] blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-success) 0%, transparent 70%)' }}
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        aria-hidden="true"
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
            Arrête de perdre
            <br />
            <span className="text-gradient-animated">
              tes soirées gaming
            </span>
            <br />
            joue enfin avec ta squad
          </h1>

          <p className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed">
            Tes potes confirment en 2 clics. Plus personne ne ghost.
            <span className="text-text-primary font-medium"> Tu joues ce soir.</span>
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
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-glow-idle"
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
                    className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
                    data-track="hero_cta_click"
                  >
                    Créer ma squad — c'est gratuit
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

          {!isLoggedIn && (
            <p className="text-sm text-text-quaternary -mt-10 mb-6">
              100% gratuit · Pas de carte bancaire · Prêt en 30 secondes
            </p>
          )}

          <div className="flex items-center justify-center gap-8 md:gap-16 mb-8">
            {heroStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-sm md:text-base text-text-quaternary">{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="text-base text-text-quaternary text-center">
            +2{' '}000 gamers organisent déjà leurs sessions — rejoins-les
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
