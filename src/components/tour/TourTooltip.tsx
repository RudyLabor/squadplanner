import { m, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Sparkles } from '../icons'
interface TourTooltipProps {
  currentStep: number
  totalSteps: number
  title: string
  description: string
  icon: React.ElementType
  tooltipPos: { top: number; left: number }
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

export function TourTooltip({
  currentStep,
  totalSteps,
  title,
  description,
  icon: Icon,
  tooltipPos,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[71] w-[320px] pointer-events-auto"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-bg-surface border-2 border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden backdrop-blur-sm relative">
          {/* Animated gradient background */}
          <m.div
            className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-success/5 pointer-events-none"
            animate={{
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Decorative sparkle */}
          {currentStep === 0 && (
            <m.div
              className="absolute -top-2 -right-2 text-warning"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-6 h-6" />
            </m.div>
          )}

          <div className="relative">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <m.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Icon className="w-6 h-6 text-primary" />
                </m.div>
                <div>
                  <h4 className="text-base font-bold text-text-primary">{title}</h4>
                  <p className="text-sm text-text-tertiary font-medium">{currentStep + 1} / {totalSteps}</p>
                </div>
              </div>
              <button
                onClick={onSkip}
                className="p-1.5 rounded-lg hover:bg-overlay-subtle transition-colors"
                aria-label="Fermer le guide"
              >
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </div>

            {/* Description */}
            <div className="px-5 pb-4">
              <p className="text-base text-text-secondary leading-relaxed">{description}</p>
            </div>

            {/* Progress dots */}
            <div className="px-5 pb-4 flex items-center justify-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <m.div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? 'w-8 bg-primary'
                      : i < currentStep
                        ? 'w-1.5 bg-success'
                        : 'w-1.5 bg-border-subtle'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: i === currentStep ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center justify-between">
              <button
                onClick={onSkip}
                className="text-sm text-text-tertiary hover:text-text-secondary transition-colors font-medium"
              >
                Passer
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <m.button
                    onClick={onPrev}
                    className="w-10 h-10 rounded-lg bg-overlay-subtle flex items-center justify-center hover:bg-overlay-hover transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-4 h-4 text-text-secondary" />
                  </m.button>
                )}
                <m.button
                  onClick={onNext}
                  className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-base text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow-primary-sm)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      C'est parti !
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </m.button>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}
