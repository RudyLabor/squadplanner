import { m } from 'framer-motion'
import { Users, Calendar, MessageCircle, Target } from '../icons'
import { AnimatedDemo, demoSteps } from './AnimatedDemo'

const steps = [
  {
    step: '1',
    title: 'Crée ta Squad',
    description: 'Donne un nom, choisis ton jeu — en 30 secondes, c\'est fait. Ta squad a direct sa party vocale et son chat.',
    icon: Users,
  },
  {
    step: '2',
    title: 'Invite tes potes',
    description: 'Partage le code — un lien, c\'est tout. Ils rejoignent en 10 secondes. Tout le monde au même endroit.',
    icon: MessageCircle,
  },
  {
    step: '3',
    title: 'Tout le monde confirme',
    description: 'Propose un créneau. Chacun répond OUI ou NON — plus de « on verra ».',
    icon: Calendar,
  },
  {
    step: '4',
    title: 'Vous jouez.',
    description: 'Le soir arrive, tout le monde est là. Vous jouez. Semaine après semaine, ta squad ne rate plus une session.',
    icon: Target,
  },
]

interface HowItWorksSectionProps {
  demoStep: number
  setDemoStep: (step: number) => void
}

export function HowItWorksSection({ demoStep, setDemoStep }: HowItWorksSectionProps) {
  return (
    <section
      id="how-it-works"
      aria-label="Comment ça marche"
      className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-primary/[0.015]"
    >
      <div className="max-w-5xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Comment ça marche
          </h2>
          <p className="text-text-tertiary text-lg">
            De {'« '}j'ai pas de squad{' »'} à {'« '}on joue ce soir{' »'} en 30 secondes
          </p>
        </m.div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <AnimatedDemo currentStep={demoStep} onStepChange={setDemoStep} />

          <div className="flex-1 w-full">
            {/* Desktop horizontal stepper */}
            <div className="hidden lg:block mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-5 left-[5%] right-[5%] h-0.5 bg-border-subtle" />
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
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                          isActive
                            ? 'bg-primary-bg text-white scale-110'
                            : isPast
                              ? 'bg-primary/20 text-primary'
                              : 'bg-bg-elevated border border-border-subtle text-text-quaternary'
                        }`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-xs font-medium transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}
                      >
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
                  <m.button
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
                    <div
                      className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isActive ? '' : 'opacity-50'
                      }`}
                      style={{
                        backgroundColor: `${demoSteps[i]?.color || 'var(--color-primary)'}15`,
                      }}
                    >
                      <StepIcon
                        className="w-5 h-5"
                        style={{ color: demoSteps[i]?.color || 'var(--color-primary)' }}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-md font-semibold transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}
                      >
                        {step.title}
                      </h3>
                      {isActive && (
                        <m.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-md text-text-tertiary mt-1"
                        >
                          {step.description}
                        </m.p>
                      )}
                    </div>
                    {isActive && (
                      <m.div
                        className="hidden lg:block h-0.5 bg-primary-bg rounded-full ml-auto self-center"
                        initial={{ width: 0 }}
                        animate={{ width: 40 }}
                        transition={{
                          duration: (demoSteps[i]?.duration || 3000) / 1000,
                          ease: 'linear',
                        }}
                        key={`progress-${demoStep}`}
                      />
                    )}
                  </m.button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
