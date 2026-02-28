import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { Trophy, Star, TrendingUp } from './icons'
import { useGamificationStore } from '../stores/useGamificationStore'

interface LeaderboardEntry {
  rank: number
  username: string
  avatar?: string
  xpThisWeek: number
  trend: 'up' | 'down' | 'same'
}

/**
 * PHASE 5: Weekly Leaderboard Component
 * Shows current user's stats and gamification progress.
 * In production, this would fetch from a Supabase leaderboard query.
 * For now, displays current user's stats with mock context around them.
 *
 * BUG FIX #1 & #2: Wait for Zustand persist store to rehydrate from localStorage
 * before rendering. This prevents hydration mismatch (#418) and ensures WeeklyLeaderboard
 * shows correct XP instead of 0 XP.
 */
export function WeeklyLeaderboard({ compact = false }: { compact?: boolean }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const xp = useGamificationStore((s) => s.xp)
  const level = useGamificationStore((s) => s.level)
  const getLevelTitle = useGamificationStore((s) => s.getLevelTitle)
  const getProgress = useGamificationStore((s) => s.getProgress)
  const storeIsHydrated = useGamificationStore((s) => (s as any)._isHydrated)
  const { percent } = getProgress()

  // Only render after Zustand store has rehydrated from localStorage
  useEffect(() => {
    setIsHydrated(storeIsHydrated)
  }, [storeIsHydrated])

  // Loading state: show skeleton until store hydrates
  if (!isHydrated) {
    if (compact) {
      return (
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-xs font-semibold text-text-secondary">Classement</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-hover animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-bg-hover rounded animate-pulse" />
              <div className="h-3 bg-bg-hover rounded animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-warning" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Classement hebdo</h3>
              <p className="text-xs text-text-tertiary">Ta progression cette semaine</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 mb-3">
          <div className="h-6 bg-bg-hover rounded animate-pulse mb-3" />
          <div className="h-2 bg-bg-hover rounded-full" />
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-warning" />
          <span className="text-xs font-semibold text-text-secondary">Classement</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
            <span className="text-sm font-bold text-warning">#1</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">Toi</p>
            <p className="text-xs text-text-tertiary">{xp} XP cette semaine</p>
          </div>
          <TrendingUp className="w-4 h-4 text-success" />
        </div>
      </div>
    )
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border-subtle bg-bg-elevated p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Classement hebdo</h3>
            <p className="text-xs text-text-tertiary">Ta progression cette semaine</p>
          </div>
        </div>
      </div>

      {/* Current user stats */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-primary">
              Niveau {level} — {getLevelTitle()}
            </span>
          </div>
          <span className="text-xs text-primary-hover font-bold">{xp} XP</span>
        </div>
        <div className="h-2 bg-bg-active rounded-full overflow-hidden">
          <m.div
            className="h-full bg-gradient-to-r from-primary to-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      {/* Tips */}
      <p className="text-xs text-text-quaternary text-center">
        Participe aux sessions et envoie des messages pour gagner de l'XP !
      </p>
    </m.div>
  )
}

export default WeeklyLeaderboard
