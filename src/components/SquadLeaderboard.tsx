import { motion } from 'framer-motion'
import { Crown, Flame, User, Shield, Zap, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from './ui'
import { getOptimizedAvatarUrl } from '../utils/avatarUrl'

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  xp: number
  level: number
  reliability_score: number
  streak_days: number
}

interface SquadLeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
}

// Level badge colors based on level ranges
const getLevelColor = (level: number): { color: string; bg15: string; bg20: string } => {
  if (level >= 50) return { color: 'var(--color-gold)', bg15: 'var(--color-gold-15)', bg20: 'var(--color-gold-20)' } // Gold - Legend
  if (level >= 30) return { color: 'var(--color-primary-hover)', bg15: 'var(--color-primary-hover-15)', bg20: 'var(--color-primary-hover-30)' } // Purple - Master
  if (level >= 20) return { color: 'var(--color-success)', bg15: 'var(--color-success-15)', bg20: 'var(--color-success-20)' } // Green - Expert
  if (level >= 10) return { color: 'var(--color-primary)', bg15: 'var(--color-primary-15)', bg20: 'var(--color-primary-20)' } // Blue - Confirmed
  return { color: 'var(--color-text-secondary)', bg15: 'var(--color-overlay-light)', bg20: 'var(--color-overlay-medium)' } // Gray - Beginner
}

// Medal colors for podium
const MEDAL_COLORS = {
  1: {
    primary: 'var(--color-gold)',
    secondary: 'var(--color-warning)',
    glow: 'var(--color-gold-30)',
    primary10: 'color-mix(in srgb, var(--color-gold) 10%, transparent)',
    primary20: 'var(--color-gold-20)',
    primary30: 'var(--color-gold-30)',
    primary40: 'color-mix(in srgb, var(--color-gold) 40%, transparent)',
    primary50: 'color-mix(in srgb, var(--color-gold) 50%, transparent)',
    primary80: 'color-mix(in srgb, var(--color-gold) 80%, transparent)',
    secondary20: 'color-mix(in srgb, var(--color-warning) 20%, transparent)',
  }, // Gold
  2: {
    primary: 'var(--color-text-secondary)',
    secondary: 'var(--color-text-quaternary)',
    glow: 'var(--color-overlay-light)',
    primary10: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)',
    primary20: 'color-mix(in srgb, var(--color-text-secondary) 20%, transparent)',
    primary30: 'color-mix(in srgb, var(--color-text-secondary) 30%, transparent)',
    primary40: 'color-mix(in srgb, var(--color-text-secondary) 40%, transparent)',
    primary50: 'color-mix(in srgb, var(--color-text-secondary) 50%, transparent)',
    primary80: 'color-mix(in srgb, var(--color-text-secondary) 80%, transparent)',
    secondary20: 'color-mix(in srgb, var(--color-text-quaternary) 20%, transparent)',
  }, // Silver
  3: {
    primary: 'var(--color-orange)',
    secondary: 'var(--color-warning)',
    glow: 'var(--color-orange-30)',
    primary10: 'color-mix(in srgb, var(--color-orange) 10%, transparent)',
    primary20: 'color-mix(in srgb, var(--color-orange) 20%, transparent)',
    primary30: 'var(--color-orange-30)',
    primary40: 'color-mix(in srgb, var(--color-orange) 40%, transparent)',
    primary50: 'color-mix(in srgb, var(--color-orange) 50%, transparent)',
    primary80: 'color-mix(in srgb, var(--color-orange) 80%, transparent)',
    secondary20: 'color-mix(in srgb, var(--color-warning) 20%, transparent)',
  }, // Bronze
}

// Podium card component
function PodiumCard({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  index: number
}) {
  const medal = MEDAL_COLORS[(entry.rank ?? 1) as keyof typeof MEDAL_COLORS]
  const isFirst = (entry.rank ?? 1) === 1
  const levelColor = getLevelColor(entry.level ?? 1)

  return (
    <motion.div
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
      {/* Podium platform */}
      <div
        className={`relative w-full ${isFirst ? 'pt-0' : entry.rank === 2 ? 'pt-8' : 'pt-12'}`}
      >
        {/* Card - Clickable to user profile */}
        <Link to={`/profile/${entry.user_id}`} className="block">
          <Card
            className={`
              relative p-4 text-center overflow-hidden cursor-pointer
              transition-all duration-200 hover:scale-[1.02] hover:shadow-glow-primary-sm
              ${isFirst ? 'bg-gradient-to-b from-[var(--color-gold-15)] to-bg-surface' : 'bg-bg-surface'}
              ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-base' : ''}
            `}
          >
          {/* Glow effect for first place */}
          {isFirst && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center top, ${medal.glow}, transparent 70%)`,
              }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Crown for 1st place */}
          {isFirst && (
            <motion.div
              className="absolute -top-3 left-1/2 -translate-x-1/2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
              <Crown
                className="w-8 h-8"
                style={{ color: medal.primary }}
                fill={medal.primary}
              />
            </motion.div>
          )}

          {/* Rank badge */}
          <motion.div
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
          </motion.div>

          {/* Avatar */}
          <motion.div
            className={`
              relative mx-auto mb-3 rounded-xl overflow-hidden flex items-center justify-center
              ${isFirst ? 'w-20 h-20' : 'w-16 h-16'}
            `}
            style={{
              background: `linear-gradient(135deg, ${medal.primary30}, ${medal.secondary20})`,
              border: `2px solid ${medal.primary40}`,
            }}
            whileHover={{ scale: 1.05 }}
          >
            {entry.avatar_url ? (
              <img
                src={getOptimizedAvatarUrl(entry.avatar_url, isFirst ? 80 : 64) || entry.avatar_url}
                alt={entry.username}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <User
                className={`${isFirst ? 'w-10 h-10' : 'w-8 h-8'} text-text-secondary`}
              />
            )}
          </motion.div>

          {/* Username */}
          <h3
            className={`font-bold text-text-primary truncate mb-1 ${isFirst ? 'text-lg' : 'text-md'}`}
          >
            {entry.username}
          </h3>

          {/* Level badge */}
          <div className="flex items-center justify-center gap-1 mb-2">
            <span
              className="px-2 py-0.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: levelColor.bg20,
                color: levelColor.color,
              }}
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

          {/* XP */}
          <div className="flex items-center justify-center gap-1 text-sm text-text-secondary mb-1">
            <Zap className="w-3 h-3 text-primary-hover" />
            <span className="font-medium text-text-primary">
              {(entry.xp ?? 0).toLocaleString()}
            </span>
            <span>XP</span>
          </div>

          {/* Reliability score */}
          <div className="flex items-center justify-center gap-1 text-sm text-text-tertiary">
            <Shield className="w-3 h-3 text-success" />
            <span>{entry.reliability_score ?? 100}%</span>
          </div>
        </Card>
        </Link>

        {/* Podium base */}
        <div
          className={`
            mt-2 rounded-t-lg flex items-center justify-center
            ${isFirst ? 'h-16' : entry.rank === 2 ? 'h-12' : 'h-8'}
          `}
          style={{
            background: `linear-gradient(to bottom, ${medal.primary30}, ${medal.primary10})`,
            borderTop: `2px solid ${medal.primary50}`,
          }}
        >
          <span
            className="text-xl font-extrabold"
            style={{ color: medal.primary80 }}
          >
            {entry.rank}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// List item for ranks 4-10
function LeaderboardListItem({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  index: number
}) {
  const levelColor = getLevelColor(entry.level ?? 1)

  return (
    <Link to={`/profile/${entry.user_id}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.3,
          delay: 0.6 + index * 0.08,
          ease: 'easeOut',
        }}
        className={`
          flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer
          hover:scale-[1.01] hover:shadow-glow-primary-sm
          ${isCurrentUser
            ? 'bg-primary-15 border border-primary/30'
            : 'bg-surface-card hover:bg-border-subtle'
          }
        `}
      >
      {/* Rank */}
      <div className="w-8 h-8 rounded-lg bg-border-subtle flex items-center justify-center">
        <span className="text-md font-bold text-text-secondary">{entry.rank ?? index + 4}</span>
      </div>

      {/* Avatar */}
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

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-md font-medium text-text-primary truncate">
            {entry.username}
          </span>
          {isCurrentUser && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/30 text-primary-hover">
              Toi
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: levelColor.bg15,
              color: levelColor.color,
            }}
          >
            Niv. {entry.level ?? 1}
          </span>
          <span className="flex items-center gap-0.5">
            <Shield className="w-3 h-3 text-success" />
            {entry.reliability_score ?? 100}%
          </span>
        </div>
      </div>

      {/* XP and streak */}
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
    </motion.div>
    </Link>
  )
}

export function SquadLeaderboard({ entries, currentUserId }: SquadLeaderboardProps) {
  // Sort entries by rank
  const sortedEntries = [...entries].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  // Split into podium (top 3) and list (4-10)
  const podiumEntries = sortedEntries.filter((e) => e.rank <= 3)
  const listEntries = sortedEntries.filter((e) => e.rank > 3 && e.rank <= 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">Classement Squad</h2>
          <p className="text-sm text-text-tertiary">Top joueurs cette semaine</p>
        </div>
      </motion.div>

      {/* Podium - Top 3 */}
      {podiumEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {podiumEntries.map((entry, index) => (
            <PodiumCard
              key={entry.user_id}
              entry={entry}
              isCurrentUser={entry.user_id === currentUserId}
              index={index}
            />
          ))}
        </div>
      )}

      {/* List - Ranks 4-10 */}
      {listEntries.length > 0 && (
        <Card className="p-2 bg-bg-surface">
          <div className="space-y-2">
            {listEntries.map((entry, index) => (
              <LeaderboardListItem
                key={entry.user_id}
                entry={entry}
                isCurrentUser={entry.user_id === currentUserId}
                index={index}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Trophy className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-md text-text-secondary">Aucun classement disponible</p>
          <p className="text-sm text-text-tertiary">
            Participe a des sessions pour apparaitre ici !
          </p>
        </motion.div>
      )}
    </div>
  )
}
