import { m } from 'framer-motion'
import { Flame, User, Shield, Zap } from '../icons'
import { Link } from 'react-router'
import { getOptimizedAvatarUrl } from '../../utils/avatarUrl'
import { getLevelColor, type LeaderboardEntry } from './leaderboardConfig'

interface LeaderboardListItemProps {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  index: number
}

export function LeaderboardListItem({ entry, isCurrentUser, index }: LeaderboardListItemProps) {
  const levelColor = getLevelColor(entry.level ?? 1)

  return (
    <Link to={`/profile/${entry.user_id}`}>
      <m.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.6 + index * 0.08, ease: 'easeOut' }}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:scale-[1.01] hover:shadow-glow-primary-sm ${isCurrentUser ? 'bg-primary-15 border border-primary/30' : 'bg-surface-card hover:bg-border-subtle'}`}
      >
        <div className="w-8 h-8 rounded-lg bg-border-subtle flex items-center justify-center">
          <span className="text-md font-bold text-text-secondary">{entry.rank ?? index + 4}</span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary-hover/10 flex items-center justify-center overflow-hidden">
          {entry.avatar_url ? (
            <img
              src={getOptimizedAvatarUrl(entry.avatar_url, 40) || entry.avatar_url}
              alt={entry.username}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <User className="w-5 h-5 text-text-secondary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-md font-medium text-text-primary truncate">{entry.username}</span>
            {isCurrentUser && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/30 text-primary-hover">
                Toi
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: levelColor.bg15, color: levelColor.color }}
            >
              Niv. {entry.level ?? 1}
            </span>
            <span className="flex items-center gap-0.5">
              <Shield className="w-3 h-3 text-success" />
              {entry.reliability_score ?? 100}%
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-base">
            <Zap className="w-3 h-3 text-primary-hover" />
            <span className="font-medium text-text-primary">
              {(entry.xp ?? 0).toLocaleString()}
            </span>
          </div>
          {(entry.streak_days ?? 0) > 0 && (
            <div className="flex items-center justify-end gap-0.5 text-sm text-gold">
              <Flame className="w-3 h-3" />
              {entry.streak_days}j
            </div>
          )}
        </div>
      </m.div>
    </Link>
  )
}
