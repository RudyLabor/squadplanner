import { memo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Shield, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGlobalLeaderboardQuery } from '../../hooks/queries'
import type { GlobalLeaderboardEntry } from '../../types/database'

const PODIUM_COLORS = [
  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: '🥇' },
  { bg: 'bg-slate-300/10', border: 'border-slate-300/20', text: 'text-slate-300', icon: '🥈' },
  { bg: 'bg-amber-700/10', border: 'border-amber-700/20', text: 'text-amber-600', icon: '🥉' },
]

interface Props {
  game?: string
  region?: string
  limit?: number
}

export const GlobalLeaderboard = memo(function GlobalLeaderboard({ game, region, limit = 50 }: Props) {
  const { data: entries, isLoading } = useGlobalLeaderboardQuery(game, region, limit)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-overlay-faint animate-pulse" />
        ))}
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
        <p className="text-sm text-text-tertiary">Pas encore de classement</p>
        <p className="text-xs text-text-tertiary mt-1">Les joueurs avec 3+ sessions apparaitront ici</p>
      </div>
    )
  }

  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="space-y-3">
      {/* Podium */}
      <div className="grid grid-cols-3 gap-2">
        {podium.map((entry, i) => (
          <PodiumCard key={entry.user_id} entry={entry} index={i} />
        ))}
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-1">
        {rest.map(entry => (
          <LeaderboardRow key={entry.user_id} entry={entry} />
        ))}
      </div>
    </div>
  )
})

const PodiumCard = memo(function PodiumCard({ entry, index }: { entry: GlobalLeaderboardEntry; index: number }) {
  const style = PODIUM_COLORS[index]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/u/${entry.username}`}
        className={`block rounded-xl border ${style.border} ${style.bg} p-3 text-center hover:brightness-110 transition-all`}
      >
        <span className="text-lg">{style.icon}</span>
        {entry.avatar_url ? (
          <img src={entry.avatar_url} alt="" className="w-10 h-10 rounded-full mx-auto mt-1 border-2 border-border-subtle" loading="lazy" decoding="async" />
        ) : (
          <div className={`w-10 h-10 rounded-full mx-auto mt-1 ${style.bg} flex items-center justify-center border-2 border-border-subtle`}>
            <span className={`text-sm font-bold ${style.text}`}>{entry.username.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <p className="text-xs font-semibold text-text-primary mt-1.5 truncate">{entry.username}</p>
        <p className={`text-xs font-bold ${style.text}`}>{entry.xp.toLocaleString()} XP</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <Star className="w-3 h-3 text-indigo-400" />
          <span className="text-xs text-text-tertiary">Nv.{entry.level}</span>
        </div>
      </Link>
    </motion.div>
  )
})

const LeaderboardRow = memo(function LeaderboardRow({ entry }: { entry: GlobalLeaderboardEntry }) {
  return (
    <Link
      to={`/u/${entry.username}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-overlay-faint transition-colors"
    >
      <span className="w-6 text-center text-xs font-bold text-text-tertiary">#{entry.rank}</span>

      {entry.avatar_url ? (
        <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full" loading="lazy" decoding="async" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-400">{entry.username.charAt(0).toUpperCase()}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{entry.username}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-400">Nv.{entry.level}</span>
          <span className="text-xs text-text-tertiary">{entry.xp.toLocaleString()} XP</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="text-xs text-text-secondary">{Math.round(entry.reliability_score)}%</span>
        </div>
        {entry.streak_days > 0 && (
          <div className="flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-text-secondary">{entry.streak_days}</span>
          </div>
        )}
      </div>
    </Link>
  )
})
