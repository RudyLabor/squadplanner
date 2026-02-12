import { m } from 'framer-motion'
import { Star, Zap } from './icons'
import { AnimatedCounter } from './ui/AnimatedCounter'
import { HelpTooltip } from './ui'

// Level configuration - French translations
// Colors use CSS variable references for design system consistency
const LEVEL_CONFIG = [
  { level: 1, title: 'Débutant', xpRequired: 0, color: 'var(--color-text-quaternary)' }, // gray
  { level: 2, title: 'Régulier', xpRequired: 100, color: 'var(--color-success)' }, // green
  { level: 3, title: 'Vétéran', xpRequired: 300, color: 'var(--color-secondary)' }, // cyan
  { level: 4, title: 'Élite', xpRequired: 600, color: 'var(--color-purple)' }, // purple
  { level: 5, title: 'Champion', xpRequired: 1000, color: 'var(--color-orange)' }, // orange
  { level: 6, title: 'Maître', xpRequired: 1500, color: 'var(--color-pink)' }, // pink
  { level: 7, title: 'Grand Maître', xpRequired: 2500, color: 'var(--color-error)' }, // red
  { level: 8, title: 'Légende', xpRequired: 4000, color: 'var(--color-primary)' }, // violet
  { level: 9, title: 'Mythique', xpRequired: 6000, color: 'var(--color-cyan)' }, // teal
  { level: 10, title: 'Immortel', xpRequired: 10000, color: 'var(--color-warning)' }, // gold
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

export function XPBar({
  currentXP,
  level,
  showTitle = true,
  compact = false,
  className = '',
}: XPBarProps) {
  const { currentLevel, nextLevel } = getLevelInfo(level)
  const { xpInLevel, xpNeeded, progress } = getXPProgress(currentXP, level)
  const isMaxLevel = level >= LEVEL_CONFIG.length

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: `color-mix(in srgb, ${currentLevel.color} 12%, transparent)`,
            color: currentLevel.color,
          }}
        >
          {level}
        </div>
        <div
          className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.floor(xpInLevel)}
          aria-valuemin={0}
          aria-valuemax={isMaxLevel ? Math.floor(xpInLevel) : xpNeeded}
          aria-label={`Niveau ${level} - ${currentLevel.title} : ${isMaxLevel ? 'Niveau maximum atteint' : `${Math.floor(xpInLevel)} XP sur ${xpNeeded}`}`}
        >
          <m.div
            className="h-full rounded-full"
            style={{
              background: isMaxLevel
                ? `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color})`
                : `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`,
              boxShadow: `0 0 10px color-mix(in srgb, ${currentLevel.color} 31%, transparent)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm text-text-secondary tabular-nums">
          {isMaxLevel ? 'MAX' : `${Math.floor(xpInLevel)}/${xpNeeded}`}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-surface-dark rounded-2xl p-4 ${className}`}>
      {/* Header with level badge and title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Level badge with glow */}
          <m.div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `color-mix(in srgb, ${currentLevel.color} 12%, transparent)`,
              boxShadow: `0 0 20px color-mix(in srgb, ${currentLevel.color} 19%, transparent)`,
            }}
            animate={{
              boxShadow: [
                `0 0 20px color-mix(in srgb, ${currentLevel.color} 19%, transparent)`,
                `0 0 30px color-mix(in srgb, ${currentLevel.color} 31%, transparent)`,
                `0 0 20px color-mix(in srgb, ${currentLevel.color} 19%, transparent)`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xl font-bold" style={{ color: currentLevel.color }}>
              {level}
            </span>
            {/* Sparkle effect for high levels */}
            {level >= 7 && (
              <m.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Star className="w-4 h-4 fill-current" style={{ color: currentLevel.color }} />
              </m.div>
            )}
          </m.div>

          {/* Title and XP */}
          <div>
            {showTitle && (
              <m.div
                className="text-lg font-bold mb-0.5"
                style={{ color: currentLevel.color }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentLevel.title}
              </m.div>
            )}
            <HelpTooltip
              content="Gagne de l'XP en participant aux sessions, en confirmant ta présence et en étant fiable."
              position="bottom"
            >
              <div className="flex items-center gap-1.5 text-base text-text-secondary">
                <Zap className="w-3.5 h-3.5" style={{ color: currentLevel.color }} />
                <AnimatedCounter end={currentXP} duration={1.5} separator="," /> XP
              </div>
            </HelpTooltip>
          </div>
        </div>

        {/* Next level indicator */}
        {!isMaxLevel && (
          <div className="text-right">
            <div className="text-sm text-text-tertiary uppercase tracking-wide mb-0.5">
              Prochain niveau
            </div>
            <div className="text-base font-medium" style={{ color: nextLevel.color }}>
              {nextLevel.title}
            </div>
          </div>
        )}

        {isMaxLevel && (
          <m.div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${currentLevel.color} 12%, transparent)`,
              color: currentLevel.color,
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold">MAX LEVEL</span>
          </m.div>
        )}
      </div>

      {/* XP Progress bar */}
      <div className="relative">
        {/* Background bar */}
        <div
          className="h-3 bg-border-subtle rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.floor(xpInLevel)}
          aria-valuemin={0}
          aria-valuemax={isMaxLevel ? Math.floor(xpInLevel) : xpNeeded}
          aria-label={`Niveau ${level} - ${currentLevel.title} : ${isMaxLevel ? 'Niveau maximum atteint' : `${Math.floor(xpInLevel)} XP sur ${xpNeeded}`}`}
        >
          {/* Animated fill */}
          <m.div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: isMaxLevel
                ? `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color})`
                : `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`,
              boxShadow: `0 0 15px color-mix(in srgb, ${currentLevel.color} 31%, transparent), inset 0 1px 0 var(--color-overlay-heavy)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {/* Shine effect */}
            <m.div
              className="absolute inset-0 w-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--color-overlay-shine) 50%, transparent 100%)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </m.div>
        </div>

        {/* XP text below bar */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-text-tertiary">
            <AnimatedCounter end={Math.floor(xpInLevel)} duration={1} /> XP
          </span>
          {!isMaxLevel && (
            <span className="text-sm text-text-tertiary">
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
