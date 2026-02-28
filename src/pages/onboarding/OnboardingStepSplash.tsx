import { m, type Variants } from 'framer-motion'
import { ArrowRight } from '../../components/icons'
import { Button } from '../../components/ui'
import { SquadPlannerIcon } from '../../components/SquadPlannerLogo'

interface OnboardingStepSplashProps {
  slideVariants: Variants
  isNavigating: boolean
  onStart: () => void
  onSkip: () => void
}

export function OnboardingStepSplash({
  slideVariants,
  isNavigating,
  onStart,
  onSkip,
}: OnboardingStepSplashProps) {
  return (
    <m.div
      key="splash"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="text-center"
    >
      {/* Logo */}
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-center"
      >
        <SquadPlannerIcon size={80} />
      </m.div>

      {/* Proposition de valeur */}
      <m.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-bold text-text-primary mb-4 leading-tight"
      >
        Arrête de dire
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple">
          « on verra »
        </span>
      </m.h1>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-text-secondary mb-10"
      >
        Plus de « on verra demain ». Ta squad s'organise ici.
      </m.p>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={onStart}
          disabled={isNavigating}
          data-testid="start-onboarding-button"
          className="w-full h-14 text-lg"
        >
          C'est parti
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </m.div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-base text-text-tertiary mt-6"
      >
        Configure ta squad en moins de 60 secondes
      </m.p>

      <m.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onSkip}
        className="text-sm text-text-quaternary hover:text-text-tertiary transition-colors mt-3"
      >
        Passer pour l'instant
      </m.button>
    </m.div>
  )
}
