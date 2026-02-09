import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Sparkles, Trophy } from 'lucide-react'
import { celebrateLevelUp } from '../utils/celebrations'
import { LEVEL_CONFIG, getLevelInfo } from './XPBar'

export interface LevelUpCelebrationProps {
  newLevel: number
  onComplete?: () => void
  autoDismiss?: boolean
  dismissDelay?: number
}

export function LevelUpCelebration({
  newLevel,
  onComplete,
  autoDismiss = true,
  dismissDelay = 3000
}: LevelUpCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { currentLevel } = getLevelInfo(newLevel)

  // Trigger V3 enhanced confetti on mount
  useEffect(() => {
    celebrateLevelUp([currentLevel.color, 'var(--color-primary-hover)'])
  }, [currentLevel.color])

  // Auto-dismiss after delay
  useEffect(() => {
    if (!autoDismiss) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onComplete?.()
      }, 500) // Wait for exit animation
    }, dismissDelay)

    return () => clearTimeout(timer)
  }, [autoDismiss, dismissDelay, onComplete])

  const handleClick = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete?.()
    }, 500)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClick}
          role="status"
          aria-live="polite"
          aria-label={`Niveau ${newLevel} atteint : ${currentLevel.title}`}
        >
          {/* Radial glow background */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${currentLevel.color}30 0%, transparent 70%)`
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Main content container */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
          >
            {/* Floating stars background */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${-30 + (i * 10)}%`,
                  left: `${10 + (i * 15)}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 180, 360],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              >
                <Star
                  className="w-6 h-6 fill-current"
                  style={{ color: currentLevel.color }}
                />
              </motion.div>
            ))}

            {/* "LEVEL UP" text */}
            <motion.div
              className="text-md font-bold uppercase tracking-[0.3em] mb-4"
              style={{ color: currentLevel.color }}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                LEVEL UP
                <Sparkles className="w-5 h-5" />
              </span>
            </motion.div>

            {/* Big level number */}
            <motion.div
              className="relative mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: 0.3
              }}
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: `0 0 60px ${currentLevel.color}80, 0 0 100px ${currentLevel.color}50`
                }}
                animate={{
                  boxShadow: [
                    `0 0 60px ${currentLevel.color}80, 0 0 100px ${currentLevel.color}50`,
                    `0 0 80px ${currentLevel.color}90, 0 0 120px ${currentLevel.color}60`,
                    `0 0 60px ${currentLevel.color}80, 0 0 100px ${currentLevel.color}50`
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />

              {/* Level badge */}
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${currentLevel.color}40, ${currentLevel.color}20)`,
                  border: `3px solid ${currentLevel.color}`
                }}
              >
                <motion.span
                  className="text-6xl font-extrabold"
                  style={{ color: currentLevel.color }}
                  animate={{
                    textShadow: [
                      `0 0 20px ${currentLevel.color}`,
                      `0 0 40px ${currentLevel.color}`,
                      `0 0 20px ${currentLevel.color}`
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {newLevel}
                </motion.span>
              </div>

              {/* Trophy icon for high levels */}
              {newLevel >= 5 && (
                <motion.div
                  className="absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: currentLevel.color,
                    boxShadow: `0 0 20px ${currentLevel.color}`
                  }}
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Trophy className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </motion.div>

            {/* New title reveal */}
            <motion.div
              className="text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                className="text-sm text-text-secondary uppercase tracking-wide mb-2"
              >
                New Rank Achieved
              </motion.div>
              <motion.h2
                className="text-3xl font-extrabold mb-2"
                style={{
                  color: currentLevel.color,
                  textShadow: `0 0 30px ${currentLevel.color}60`
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  textShadow: [
                    `0 0 30px ${currentLevel.color}60`,
                    `0 0 50px ${currentLevel.color}80`,
                    `0 0 30px ${currentLevel.color}60`
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {currentLevel.title}
              </motion.h2>

              {/* Subtitle based on level */}
              <motion.p
                className="text-md text-text-tertiary max-w-[250px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {newLevel >= 10
                  ? "You've reached the pinnacle of greatness!"
                  : newLevel >= 7
                    ? "Your legend grows stronger!"
                    : newLevel >= 4
                      ? "You're becoming a force to be reckoned with!"
                      : "Keep climbing the ranks!"
                }
              </motion.p>
            </motion.div>

            {/* Tap to continue hint */}
            <motion.div
              className="absolute -bottom-16 text-sm text-text-tertiary"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            >
              Tap anywhere to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Export for convenience
export { LEVEL_CONFIG }
