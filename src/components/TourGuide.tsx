import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Sparkles, Calendar, Users, MessageCircle, Mic } from 'lucide-react'

const TOUR_COMPLETED_KEY = 'sq-tour-completed'

interface TourStep {
  target: string // CSS selector or data-tour attribute
  title: string
  description: string
  icon: React.ElementType
  position: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="squads"]',
    title: 'Tes Squads',
    description: 'Retrouve toutes tes squads ici. Clique pour voir les membres, le chat et les sessions.',
    icon: Users,
    position: 'right',
  },
  {
    target: '[data-tour="sessions"]',
    title: 'Planifier une session',
    description: 'Propose un créneau de jeu et invite ta squad. Le système RSVP force tout le monde à répondre.',
    icon: Calendar,
    position: 'right',
  },
  {
    target: '[data-tour="messages"]',
    title: 'Chat & Messages',
    description: 'Chat squad en temps réel + messages directs. Avec réactions emoji, read receipts et recherche.',
    icon: MessageCircle,
    position: 'right',
  },
  {
    target: '[data-tour="party"]',
    title: 'Party vocale',
    description: 'Lance un salon vocal pour ta squad. Audio adaptatif, reconnexion auto et volume individuel.',
    icon: Mic,
    position: 'right',
  },
  {
    target: '[data-tour="ai-coach"]',
    title: 'Coach IA',
    description: 'Ton assistant perso : suggestions de créneaux, aide à la décision, rappels RSVP intelligents.',
    icon: Sparkles,
    position: 'top',
  },
]

function getTooltipPosition(rect: DOMRect, position: TourStep['position']) {
  const gap = 12
  const tooltipWidth = 300
  const tooltipHeight = 160

  switch (position) {
    case 'right':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.right + gap,
      }
    case 'left':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.left - tooltipWidth - gap,
      }
    case 'bottom':
      return {
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2 - tooltipWidth / 2,
      }
    case 'top':
      return {
        top: rect.top - tooltipHeight - gap,
        left: rect.left + rect.width / 2 - tooltipWidth / 2,
      }
  }
}

export function TourGuide() {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  // Check if tour should be shown (first visit after onboarding)
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY)
    if (completed) return

    // Check if user just came from onboarding (has at least one squad)
    // Show tour with a delay to let the page render
    const timer = setTimeout(() => {
      const firstTarget = document.querySelector(TOUR_STEPS[0].target)
      if (firstTarget) {
        setActive(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Position tooltip relative to target element
  const updatePosition = useCallback(() => {
    if (!active) return

    const step = TOUR_STEPS[currentStep]
    const target = document.querySelector(step.target)

    if (target) {
      const rect = target.getBoundingClientRect()
      setTargetRect(rect)

      const pos = getTooltipPosition(rect, step.position)

      // Clamp to viewport
      const maxLeft = window.innerWidth - 320
      const maxTop = window.innerHeight - 200
      pos.left = Math.max(12, Math.min(pos.left, maxLeft))
      pos.top = Math.max(12, Math.min(pos.top, maxTop))

      setTooltipPos(pos)
    } else {
      // Target not found, skip to next step or end
      if (currentStep < TOUR_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        completeTour()
      }
    }
  }, [active, currentStep])

  useEffect(() => {
    updatePosition()

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition])

  const completeTour = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    setActive(false)
  }

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const skipTour = () => {
    completeTour()
  }

  if (!active || !tooltipPos) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon

  return (
    <>
      {/* Overlay - blocks interaction except with the target */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] pointer-events-auto"
        onClick={skipTour}
      >
        {/* Dark overlay with cutout for target */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 4}
                  y={targetRect.top - 4}
                  width={targetRect.width + 8}
                  height={targetRect.height + 8}
                  rx={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#tour-mask)"
          />
        </svg>

        {/* Highlight ring around target */}
        {targetRect && (
          <motion.div
            className="absolute border-2 border-[#6366f1] rounded-xl pointer-events-none"
            animate={{
              boxShadow: ['0 0 0 0 rgba(99,102,241,0.3)', '0 0 0 8px rgba(99,102,241,0)', '0 0 0 0 rgba(99,102,241,0.3)'],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        )}
      </motion.div>

      {/* Tooltip */}
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
          <div className="bg-[#141416] border border-[rgba(99,102,241,0.2)] rounded-2xl shadow-2xl shadow-[#6366f1]/10 overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#6366f1]" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#f7f8f8]">{step.title}</h4>
                  <p className="text-[11px] text-[#5e6063]">{currentStep + 1} / {TOUR_STEPS.length}</p>
                </div>
              </div>
              <button
                onClick={skipTour}
                className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                aria-label="Fermer le guide"
              >
                <X className="w-4 h-4 text-[#5e6063]" />
              </button>
            </div>

            {/* Description */}
            <div className="px-5 pb-4">
              <p className="text-[13px] text-[#8b8d90] leading-relaxed">{step.description}</p>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-3">
              <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#6366f1] rounded-full"
                  initial={{ width: `${(currentStep / TOUR_STEPS.length) * 100}%` }}
                  animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center justify-between">
              <button
                onClick={skipTour}
                className="text-[12px] text-[#5e6063] hover:text-[#8b8d90] transition-colors"
              >
                Passer le guide
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#8b8d90]" />
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="h-9 px-4 rounded-lg bg-[#6366f1] text-[13px] text-white font-medium hover:bg-[#4f46e5] transition-colors flex items-center gap-1.5"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Terminé !' : 'Suivant'}
                  {currentStep < TOUR_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
