import { m, AnimatePresence } from 'framer-motion'
import { useGamificationStore } from '../stores/useGamificationStore'
import { useEffect, useRef } from 'react'
import { Button } from './ui/Button'

/**
 * Full-screen level up celebration modal.
 * Shows when user reaches a new level with confetti + animation.
 */
export function LevelUpModal() {
  const pendingLevelUp = useGamificationStore((s) => s.pendingLevelUp)
  const dismissLevelUp = useGamificationStore((s) => s.dismissLevelUp)
  const getLevelTitle = useGamificationStore((s) => s.getLevelTitle)
  const confettiRef = useRef(false)

  // Trigger confetti when level up appears
  useEffect(() => {
    if (pendingLevelUp && !confettiRef.current) {
      confettiRef.current = true
      import('canvas-confetti').then((mod) => {
        const confetti = mod.default
        // First burst
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        // Second burst slightly delayed
        setTimeout(() => {
          confetti({ particleCount: 50, spread: 100, origin: { y: 0.5 } })
        }, 200)
      })
    } else if (!pendingLevelUp) {
      confettiRef.current = false
    }
  }, [pendingLevelUp])

  return (
    <AnimatePresence>
      {pendingLevelUp && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={dismissLevelUp}
        >
          <m.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative bg-bg-elevated border border-border-default rounded-3xl p-8 max-w-sm mx-4 text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

            {/* Level number */}
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              className="relative w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center"
            >
              <span className="text-4xl font-bold text-white">{pendingLevelUp.to}</span>
            </m.div>

            <m.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative text-2xl font-bold text-text-primary mb-1"
            >
              Niveau {pendingLevelUp.to} !
            </m.h2>

            <m.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative text-primary font-semibold mb-3"
            >
              {getLevelTitle()}
            </m.p>

            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative text-sm text-text-secondary mb-6"
            >
              Continue comme ça, tu progresses vite !
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative"
            >
              <Button onClick={dismissLevelUp} variant="primary" fullWidth>
                Continuer
              </Button>
            </m.div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Achievement unlock toast — smaller, shown as a toast notification.
 */
export function AchievementToast() {
  const pendingAchievement = useGamificationStore((s) => s.pendingAchievement)
  const dismissAchievement = useGamificationStore((s) => s.dismissAchievement)

  useEffect(() => {
    if (pendingAchievement) {
      const timer = setTimeout(dismissAchievement, 5000)
      return () => clearTimeout(timer)
    }
  }, [pendingAchievement, dismissAchievement])

  return (
    <AnimatePresence>
      {pendingAchievement && (
        <m.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-4 left-1/2 z-[101] bg-bg-elevated border border-primary/30 rounded-2xl p-4 shadow-lg shadow-primary/10 flex items-center gap-3 max-w-sm cursor-pointer"
          onClick={dismissAchievement}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
            {pendingAchievement.icon}
          </div>
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wide">
              Achievement débloqué !
            </p>
            <p className="text-sm font-bold text-text-primary">{pendingAchievement.name}</p>
            <p className="text-xs text-text-tertiary">{pendingAchievement.description}</p>
          </div>
          <div className="text-xs text-primary font-bold ml-auto">
            +{pendingAchievement.xpBonus} XP
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
