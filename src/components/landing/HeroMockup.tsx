import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { screens } from './MockupScreens'

// ─── PHONE FRAME ────────────────────────────────────────
export function HeroMockup() {
  const [currentScreen, setCurrentScreen] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreen(prev => (prev + 1) % screens.length)
    }, screens[currentScreen].duration)
    return () => clearInterval(timer)
  }, [currentScreen])

  const screen = screens[currentScreen]
  const ScreenComponent = screen.component

  return (
    <div className="relative mx-auto hero-phone-float" style={{ width: 280 }}>
      {/* Glow behind phone */}
      <motion.div
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

            {/* Screen content with transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={screen.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="h-full pt-6"
              >
                <ScreenComponent />
              </motion.div>
            </AnimatePresence>

            {/* Screen reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-10 rounded-[2rem]" />
          </div>
        </div>
      </div>

      {/* Screen indicator dots */}
      <div className="flex items-center justify-center gap-1 mt-4">
        {screens.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentScreen(i)}
            className="flex items-center justify-center gap-1.5 group min-w-[44px] min-h-[44px]"
            aria-label={`Ecran ${s.label}`}
          >
            <motion.div
              className="h-1 rounded-full"
              animate={{
                width: i === currentScreen ? 24 : 6,
                backgroundColor: i === currentScreen ? 'var(--color-primary)' : 'var(--color-overlay-medium)',
              }}
              transition={{ duration: 0.3 }}
            />
            {i === currentScreen && (
              <motion.span
                className="text-xs text-primary font-medium"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {s.label}
              </motion.span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
