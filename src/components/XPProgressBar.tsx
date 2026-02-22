import { m } from 'framer-motion'
import { useGamificationStore } from '../stores/useGamificationStore'
import { Star } from './icons'

/**
 * Compact XP progress bar shown in sidebar/profile.
 */
export function XPProgressBar({ compact = false }: { compact?: boolean }) {
  const level = useGamificationStore((s) => s.level)
  const xp = useGamificationStore((s) => s.xp)
  const getProgress = useGamificationStore((s) => s.getProgress)
  const getLevelTitle = useGamificationStore((s) => s.getLevelTitle)

  const { percent, current, needed } = getProgress()

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{level}</span>
        </div>
        <div className="flex-1 h-1.5 bg-bg-active rounded-full overflow-hidden">
          <m.div
            className="h-full bg-gradient-to-r from-primary to-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple flex items-center justify-center">
            <span className="text-sm font-bold text-white">{level}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{getLevelTitle()}</p>
            <p className="text-xs text-text-tertiary">{xp.toLocaleString()} XP total</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <Star className="w-3 h-3 text-primary" />
          <span>
            {current}/{needed} XP
          </span>
        </div>
      </div>
      <div className="h-2 bg-bg-active rounded-full overflow-hidden">
        <m.div
          className="h-full bg-gradient-to-r from-primary via-purple to-primary rounded-full"
          style={{ backgroundSize: '200% 100%' }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  )
}

export default XPProgressBar
