import { useState, useEffect, useRef, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Play } from '../icons'
import { demoSteps, stepComponents } from './DemoSteps'

// ─── HERO PHONE FRAME — animated demo visible above the fold ────────
export function HeroMockup() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoAdvanceRef = useRef(false)

  // Auto-advance through demo steps
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      autoAdvanceRef.current = true
      setCurrentStep(prev => (prev + 1) % demoSteps.length)
    }, demoSteps[currentStep].duration)
    return () => clearInterval(timer)
  }, [isPaused, currentStep])

  const handleStepClick = useCallback((index: number) => {
    setCurrentStep(index)
    setIsPaused(true)
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = setTimeout(() => setIsPaused(false), 5000)
  }, [])

  const step = demoSteps[currentStep]
  const StepComponent = stepComponents[step.id]

  return (
    <div className="relative mx-auto hero-phone-float" style={{ width: 280 }}>
      {/* "Voir la demo" badge */}
      <m.div
        className="flex items-center justify-center gap-1.5 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <m.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Play className="w-3 h-3 text-primary fill-primary" />
          </m.div>
          <span className="text-xs font-medium text-primary">Voir la demo</span>
        </div>
      </m.div>

      {/* Glow behind phone */}
      <m.div
        className="absolute -inset-8 rounded-[3rem]"
        style={{
          background: 'radial-gradient(ellipse at center, var(--color-primary-12) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Phone body */}
      <div className="relative bg-gradient-to-b from-overlay-medium to-white/[0.04] rounded-[2.5rem] p-[1px] shadow-2xl shadow-primary/20">
        <div className="bg-bg-elevated rounded-[2.5rem] p-2.5">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-bg-elevated rounded-b-2xl z-20">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/10" />
          </div>

          {/* Screen */}
          <div className="bg-bg-base rounded-[2rem] overflow-hidden relative" style={{ height: 480 }}>
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-1.5 pb-1">
              <span className="text-xs text-text-secondary font-medium">21:00</span>
              <div className="flex items-center gap-1">
                <div className="flex items-end gap-[1px]">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-[2px] rounded-sm ${i <= 3 ? 'bg-white' : 'bg-text-tertiary'}`} style={{ height: 2 + i * 2 }} />
                  ))}
                </div>
                <div className="w-5 h-2.5 rounded-[2px] border border-text-tertiary ml-1">
                  <div className="w-3.5 h-1.5 bg-success rounded-[1px] m-[1px]" />
                </div>
              </div>
            </div>

            {/* Animated demo step content */}
            <AnimatePresence mode="wait">
              <m.div
                key={step.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="h-full pt-6"
              >
                <StepComponent />
              </m.div>
            </AnimatePresence>

            {/* Screen reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-10 rounded-[2rem]" />
          </div>
        </div>
      </div>

      {/* Step indicator dots with label + progress bar */}
      <div className="flex flex-col items-center gap-2 mt-4">
        {/* Dots */}
        <div className="flex items-center justify-center gap-1">
          {demoSteps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStepClick(i)}
              className="flex items-center justify-center gap-1.5 group min-w-[44px] min-h-[44px]"
              aria-label={`Etape ${i + 1}: ${s.title}`}
            >
              <m.div
                className="h-1 rounded-full"
                animate={{
                  width: i === currentStep ? 24 : 6,
                  backgroundColor: i === currentStep ? 'var(--color-primary)' : 'var(--color-overlay-medium)',
                }}
                transition={{ duration: 0.3 }}
              />
              {i === currentStep && (
                <m.span
                  className="text-xs text-primary font-medium"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {s.title}
                </m.span>
              )}
            </button>
          ))}
        </div>

        {/* Step progress bar (auto-advance indicator) */}
        <div className="w-32 h-0.5 rounded-full bg-border-subtle overflow-hidden">
          <m.div
            className="h-full bg-primary rounded-full"
            key={`hero-progress-${currentStep}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: demoSteps[currentStep].duration / 1000,
              ease: 'linear',
            }}
          />
        </div>
      </div>
    </div>
  )
}
