import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'

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
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 5 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[71] w-[300px] pointer-events-auto"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-bg-surface border border-primary rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-md font-semibold text-text-primary">{title}</h4>
                <p className="text-sm text-text-tertiary">{currentStep + 1} / {totalSteps}</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors"
              aria-label="Fermer le guide"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>

          {/* Description */}
          <div className="px-5 pb-4">
            <p className="text-base text-text-secondary leading-relaxed">{description}</p>
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-3">
            <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: `${(currentStep / totalSteps) * 100}%` }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Passer le guide
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={onPrev}
                  className="w-9 h-9 rounded-lg bg-border-subtle flex items-center justify-center hover:bg-border-hover transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-text-secondary" />
                </button>
              )}
              <button
                onClick={onNext}
                className="h-9 px-4 rounded-lg bg-primary text-base text-white font-medium hover:bg-primary transition-colors flex items-center gap-1.5"
              >
                {currentStep === totalSteps - 1 ? 'Termine !' : 'Suivant'}
                {currentStep < totalSteps - 1 && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
