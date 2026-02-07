import { motion } from 'framer-motion'
import { Star, Zap } from 'lucide-react'
import CountUp from 'react-countup'

// Level configuration - French translations
const LEVEL_CONFIG = [
  { level: 1, title: 'Débutant', xpRequired: 0, color: '#6b7280' },      // gray
  { level: 2, title: 'Régulier', xpRequired: 100, color: '#22c55e' },    // green
  { level: 3, title: 'Vétéran', xpRequired: 300, color: '#06b6d4' },     // cyan
  { level: 4, title: 'Élite', xpRequired: 600, color: '#a855f7' },       // purple
  { level: 5, title: 'Champion', xpRequired: 1000, color: '#f97316' },   // orange
  { level: 6, title: 'Maître', xpRequired: 1500, color: '#ec4899' },     // pink
  { level: 7, title: 'Grand Maître', xpRequired: 2500, color: '#ef4444' }, // red
  { level: 8, title: 'Légende', xpRequired: 4000, color: '#8b5cf6' },    // violet
  { level: 9, title: 'Mythique', xpRequired: 6000, color: '#14b8a6' },   // teal
  { level: 10, title: 'Immortel', xpRequired: 10000, color: '#eab308' }, // gold
]

export interface XPBarProps {
  currentXP: number
  level: number
  showTitle?: boolean
  compact?: boolean
  className?: string
}

function getLevelInfo(level: number) {
  const currentLevel = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)]
  const nextLevel = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)]
  return { currentLevel, nextLevel }
}

function getXPProgress(currentXP: number, level: number) {
  const { currentLevel, nextLevel } = getLevelInfo(level)

  // Max level reached
  if (level >= LEVEL_CONFIG.length) {
    return { xpInLevel: currentXP - currentLevel.xpRequired, xpNeeded: 0, progress: 100 }
  }

  const xpInLevel = currentXP - currentLevel.xpRequired
  const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired
  const progress = Math.min((xpInLevel / xpNeeded) * 100, 100)

  return { xpInLevel, xpNeeded, progress }
}

export function XPBar({ currentXP, level, showTitle = true, compact = false, className = '' }: XPBarProps) {
  const { currentLevel, nextLevel } = getLevelInfo(level)
  const { xpInLevel, xpNeeded, progress } = getXPProgress(currentXP, level)
  const isMaxLevel = level >= LEVEL_CONFIG.length

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: `${currentLevel.color}20`,
            color: currentLevel.color
          }}
        >
          {level}
        </div>
        <div className="flex-1 h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isMaxLevel
                ? `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color})`
                : `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`,
              boxShadow: `0 0 10px ${currentLevel.color}50`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[11px] text-[#8b8d90] tabular-nums">
          {isMaxLevel ? 'MAX' : `${Math.floor(xpInLevel)}/${xpNeeded}`}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-[#1a1a2e] rounded-2xl p-4 ${className}`}>
      {/* Header with level badge and title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Level badge with glow */}
          <motion.div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${currentLevel.color}20`,
              boxShadow: `0 0 20px ${currentLevel.color}30`
            }}
            animate={{
              boxShadow: [
                `0 0 20px ${currentLevel.color}30`,
                `0 0 30px ${currentLevel.color}50`,
                `0 0 20px ${currentLevel.color}30`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span
              className="text-xl font-bold"
              style={{ color: currentLevel.color }}
            >
              {level}
            </span>
            {/* Sparkle effect for high levels */}
            {level >= 7 && (
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Star className="w-4 h-4 fill-current" style={{ color: currentLevel.color }} />
              </motion.div>
            )}
          </motion.div>

          {/* Title and XP */}
          <div>
            {showTitle && (
              <motion.div
                className="text-[16px] font-bold mb-0.5"
                style={{ color: currentLevel.color }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentLevel.title}
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 text-[13px] text-[#8b8d90]">
              <Zap className="w-3.5 h-3.5" style={{ color: currentLevel.color }} />
              <CountUp end={currentXP} duration={1.5} separator="," /> XP
            </div>
          </div>
        </div>

        {/* Next level indicator */}
        {!isMaxLevel && (
          <div className="text-right">
            <div className="text-[11px] text-[#5e6063] uppercase tracking-wide mb-0.5">
              Prochain niveau
            </div>
            <div className="text-[13px] font-medium" style={{ color: nextLevel.color }}>
              {nextLevel.title}
            </div>
          </div>
        )}

        {isMaxLevel && (
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: `${currentLevel.color}20`,
              color: currentLevel.color
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Star className="w-4 h-4 fill-current" />
            <span className="text-[12px] font-bold">MAX LEVEL</span>
          </motion.div>
        )}
      </div>

      {/* XP Progress bar */}
      <div className="relative">
        {/* Background bar */}
        <div className="h-3 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
          {/* Animated fill */}
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: isMaxLevel
                ? `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color})`
                : `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`,
              boxShadow: `0 0 15px ${currentLevel.color}50, inset 0 1px 0 rgba(255,255,255,0.2)`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.div>
        </div>

        {/* XP text below bar */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-[#5e6063]">
            <CountUp end={Math.floor(xpInLevel)} duration={1} /> XP
          </span>
          {!isMaxLevel && (
            <span className="text-[11px] text-[#5e6063]">
              {xpNeeded - Math.floor(xpInLevel)} XP pour le niveau {level + 1}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Export level config for use in other components
export { LEVEL_CONFIG, getLevelInfo, getXPProgress }
