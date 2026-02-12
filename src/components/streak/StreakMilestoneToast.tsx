import { m, AnimatePresence } from 'framer-motion'
import { Zap } from '../icons'
import Confetti from '../LazyConfetti'
import { resolveCSSColor } from './streakUtils'

interface MilestoneData {
  days: number
  xp: number
  label: string
  emoji: string
}

interface StreakMilestoneToastProps {
  showConfetti: boolean
  milestone: MilestoneData | null
}

export function StreakMilestoneToast({ showConfetti, milestone }: StreakMilestoneToastProps) {
  return (
    <>
      {/* Milestone Celebration Confetti */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
          colors={[
            resolveCSSColor('--color-orange'),
            resolveCSSColor('--color-warning'),
            resolveCSSColor('--color-error'),
            resolveCSSColor('--color-pink'),
            resolveCSSColor('--color-purple'),
            resolveCSSColor('--color-success'),
          ]}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Milestone Celebration Toast */}
      <AnimatePresence>
        {milestone && (
          <m.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500/90 to-warning/90 border border-orange-500/50 backdrop-blur-xl shadow-glow-warning"
          >
            <div className="flex items-center gap-4">
              <m.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="text-4xl"
              >
                {milestone.emoji}
              </m.div>
              <div>
                <m.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-medium text-white/70 uppercase tracking-wide"
                >
                  Objectif atteint !
                </m.p>
                <m.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-bold text-white"
                >
                  Série de {milestone.days} jours !
                </m.p>
                <m.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-base text-white/90 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />+{milestone.xp} XP gagnés !
                </m.p>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
