import { m } from 'framer-motion'
import { Crown, Flame, User, Shield, Zap } from '../icons'
import { Link } from 'react-router'
import { Card } from '../ui'
import { getOptimizedAvatarUrl } from '../../utils/avatarUrl'
import { getLevelColor, MEDAL_COLORS, type LeaderboardEntry } from './leaderboardConfig'

interface PodiumCardProps {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  index: number
}

export function PodiumCard({ entry, isCurrentUser, index }: PodiumCardProps) {
  const medal = MEDAL_COLORS[(entry.rank ?? 1) as keyof typeof MEDAL_COLORS]
  const isFirst = (entry.rank ?? 1) === 1
  const levelColor = getLevelColor(entry.level ?? 1)

  return (
    <m.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className={`relative flex flex-col items-center ${isFirst ? 'order-1' : entry.rank === 2 ? 'order-2' : 'order-3'}`}
    >
      <div className={`relative w-full ${isFirst ? 'pt-0' : entry.rank === 2 ? 'pt-8' : 'pt-12'}`}>
        <Link to={`/profile/${entry.user_id}`} className="block">
          <Card
            className={`relative p-4 text-center overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-glow-primary-sm ${isFirst ? 'bg-gradient-to-b from-[var(--color-gold-15)] to-bg-surface' : 'bg-bg-surface'} ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-base' : ''}`}
          >
            {isFirst && (
              <m.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center top, ${medal.glow}, transparent 70%)`,
                }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {isFirst && (
              <m.div
                className="absolute -top-3 left-1/2 -translate-x-1/2"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              >
                <Crown className="w-8 h-8" style={{ color: medal.primary }} fill={medal.primary} />
              </m.div>
            )}

            <m.div
              className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: medal.primary20,
                color: medal.primary,
                boxShadow: `0 0 10px ${medal.glow}`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {entry.rank}
            </m.div>

            <m.div
              className={`relative mx-auto mb-3 rounded-xl overflow-hidden flex items-center justify-center ${isFirst ? 'w-20 h-20' : 'w-16 h-16'}`}
              style={{
                background: `linear-gradient(135deg, ${medal.primary30}, ${medal.secondary20})`,
                border: `2px solid ${medal.primary40}`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {entry.avatar_url ? (
                <img
                  src={
                    getOptimizedAvatarUrl(entry.avatar_url, isFirst ? 80 : 64) || entry.avatar_url
                  }
                  alt={entry.username}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <User className={`${isFirst ? 'w-10 h-10' : 'w-8 h-8'} text-text-secondary`} />
              )}
            </m.div>

            <h3
              className={`font-bold text-text-primary truncate mb-1 ${isFirst ? 'text-lg' : 'text-md'}`}
            >
              {entry.username}
            </h3>

            <div className="flex items-center justify-center gap-1 mb-2">
              <span
                className="px-2 py-0.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: levelColor.bg20, color: levelColor.color }}
              >
                Niv. {entry.level ?? 1}
              </span>
              {(entry.streak_days ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-sm text-gold">
                  <Flame className="w-3 h-3" />
                  {entry.streak_days}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-1 text-sm text-text-secondary mb-1">
              <Zap className="w-3 h-3 text-primary-hover" />
              <span className="font-medium text-text-primary">
                {(entry.xp ?? 0).toLocaleString()}
              </span>
              <span>XP</span>
            </div>

            <div className="flex items-center justify-center gap-1 text-sm text-text-tertiary">
              <Shield className="w-3 h-3 text-success" />
              <span>{entry.reliability_score ?? 100}%</span>
            </div>
          </Card>
        </Link>

        <div
          className={`mt-2 rounded-t-lg flex items-center justify-center ${isFirst ? 'h-16' : entry.rank === 2 ? 'h-12' : 'h-8'}`}
          style={{
            background: `linear-gradient(to bottom, ${medal.primary30}, ${medal.primary10})`,
            borderTop: `2px solid ${medal.primary50}`,
          }}
        >
          <span className="text-xl font-extrabold" style={{ color: medal.primary80 }}>
            {entry.rank}
          </span>
        </div>
      </div>
    </m.div>
  )
}
