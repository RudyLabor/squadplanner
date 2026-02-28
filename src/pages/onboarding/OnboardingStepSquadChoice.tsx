import { m, type Variants } from 'framer-motion'
import { Users, UserPlus, ArrowRight } from '../../components/icons'
interface OnboardingStepSquadChoiceProps {
  slideVariants: Variants
  isNavigating: boolean
  onCreateSquad: () => void
  onJoinSquad: () => void
}

export function OnboardingStepSquadChoice({
  slideVariants,
  isNavigating,
  onCreateSquad,
  onJoinSquad,
}: OnboardingStepSquadChoiceProps) {
  return (
    <m.div key="squad-choice" variants={slideVariants} initial="enter" animate="center" exit="exit">
      <div className="h-10 mb-6" />

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-text-primary mb-2">Ta premi&egrave;re squad</h2>
        <p className="text-text-secondary">Une squad = tes potes + un salon vocal + un planning</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onCreateSquad}
          disabled={isNavigating}
          data-testid="create-squad-button"
          className="w-full p-6 rounded-2xl bg-surface-card border border-border-default hover:border-primary hover:scale-[1.02] active:scale-[0.99] transition-interactive text-left group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-10 flex items-center justify-center shrink-0 group-hover:bg-primary-15 transition-colors">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Cr&eacute;er une squad
              </h3>
              <p className="text-md text-text-secondary">
                Tu invites tes amis avec un code. En 10 secondes, tout le monde est dedans.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>
        </button>

        <button
          onClick={onJoinSquad}
          disabled={isNavigating}
          data-testid="join-squad-button"
          className="w-full p-6 rounded-2xl bg-surface-card border border-border-default hover:border-success hover:scale-[1.02] active:scale-[0.99] transition-interactive text-left group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-success-10 flex items-center justify-center shrink-0 group-hover:bg-success-15 transition-colors">
              <UserPlus className="w-7 h-7 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-1">Rejoindre une squad</h3>
              <p className="text-md text-text-secondary">
                Un ami t'a donné un code ? Entre-le ici pour la rejoindre direct.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-success transition-colors shrink-0 mt-1" />
          </div>
        </button>
      </div>
    </m.div>
  )
}
