import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { demoSteps, stepComponents, PhoneFrame } from './DemoSteps'

// Re-export for consumers
export { demoSteps } from './DemoSteps'

interface AnimatedDemoProps {
  currentStep?: number
  onStepChange?: (step: number) => void
}

export function AnimatedDemo({ currentStep: controlledStep, onStepChange }: AnimatedDemoProps) {
  const [internalStep, setInternalStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  const currentStep = controlledStep ?? internalStep
  const autoAdvanceRef = useRef(false)
  const setCurrentStep = useCallback((step: number) => {
    if (onStepChange) onStepChange(step)
    else setInternalStep(step)
  }, [onStepChange])

  // Detect manual step changes (from parent stepper clicks) and pause auto-advance
  const prevStepRef = useRef(currentStep)
  useEffect(() => {
    if (prevStepRef.current !== currentStep && !autoAdvanceRef.current) {
      // Manual change detected — pause auto-advance for 5s
      setIsPaused(true)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => setIsPaused(false), 5000)
    }
    prevStepRef.current = currentStep
    autoAdvanceRef.current = false
  }, [currentStep])

  // Auto-advance steps (paused when user interacts)
  useEffect(() => {
    if (!isInView || isPaused) return
    const timer = setInterval(() => {
      autoAdvanceRef.current = true
      const next = (currentStep + 1) % demoSteps.length
      setCurrentStep(next)
    }, demoSteps[currentStep].duration)
    return () => clearInterval(timer)
  }, [isInView, isPaused, currentStep, setCurrentStep])

  const step = demoSteps[currentStep]
  const StepComponent = stepComponents[step.id]

  return (
    <div ref={ref} className="shrink-0">
      <PhoneFrame>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </PhoneFrame>
    </div>
  )
}
