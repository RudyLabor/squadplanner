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
const getLevelColor = (level: number): string => {
  if (level >= 50) return '#f5a623' // Gold - Legend
  if (level >= 30) return '#8b93ff' // Purple - Master
  if (level >= 20) return '#4ade80' // Green - Expert
  if (level >= 10) return '#5e6dd2' // Blue - Confirmed
  return '#8b8d90' // Gray - Beginner
}

// Medal colors for podium
const MEDAL_COLORS = {
  1: { primary: '#f5a623', secondary: '#fcd34d', glow: 'rgba(245, 166, 35, 0.4)' }, // Gold
  2: { primary: '#c0c0c0', secondary: '#e5e7eb', glow: 'rgba(192, 192, 192, 0.3)' }, // Silver
  3: { primary: '#cd7f32', secondary: '#d4a574', glow: 'rgba(205, 127, 50, 0.3)' }, // Bronze
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
  const medal = MEDAL_COLORS[entry.rank as keyof typeof MEDAL_COLORS]
  const isFirst = entry.rank === 1
  const levelColor = getLevelColor(entry.level)

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
              ${isFirst ? 'bg-gradient-to-b from-[rgba(245,166,35,0.15)] to-bg-surface' : 'bg-bg-surface'}
              ${isCurrentUser ? 'ring-2 ring-[#5e6dd2] ring-offset-2 ring-offset-[#08090a]' : ''}
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
            className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
            style={{
              backgroundColor: `${medal.primary}20`,
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
              background: `linear-gradient(135deg, ${medal.primary}30, ${medal.secondary}20)`,
              border: `2px solid ${medal.primary}40`,
            }}
            whileHover={{ scale: 1.05 }}
          >
            {entry.avatar_url ? (
              <img
                src={getOptimizedAvatarUrl(entry.avatar_url, isFirst ? 80 : 64) || entry.avatar_url}
                alt={entry.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User
                className={`${isFirst ? 'w-10 h-10' : 'w-8 h-8'} text-text-secondary`}
              />
            )}
          </motion.div>

          {/* Username */}
          <h3
            className={`font-bold text-text-primary truncate mb-1 ${isFirst ? 'text-[16px]' : 'text-[14px]'}`}
          >
            {entry.username}
          </h3>

          {/* Level badge */}
          <div className="flex items-center justify-center gap-1 mb-2">
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: `${levelColor}20`,
                color: levelColor,
              }}
            >
              Niv. {entry.level}
            </span>
            {entry.streak_days > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-[#f5a623]">
                <Flame className="w-3 h-3" />
                {entry.streak_days}
              </span>
            )}
          </div>

          {/* XP */}
          <div className="flex items-center justify-center gap-1 text-[12px] text-text-secondary mb-1">
            <Zap className="w-3 h-3 text-[#8b93ff]" />
            <span className="font-medium text-text-primary">
              {entry.xp.toLocaleString()}
            </span>
            <span>XP</span>
          </div>

          {/* Reliability score */}
          <div className="flex items-center justify-center gap-1 text-[11px] text-text-tertiary">
            <Shield className="w-3 h-3 text-[#4ade80]" />
            <span>{entry.reliability_score}%</span>
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
            background: `linear-gradient(to bottom, ${medal.primary}30, ${medal.primary}10)`,
            borderTop: `2px solid ${medal.primary}50`,
          }}
        >
          <span
            className="text-[24px] font-black"
            style={{ color: `${medal.primary}80` }}
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
  const levelColor = getLevelColor(entry.level)

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
            ? 'bg-[rgba(94,109,210,0.15)] border border-[rgba(94,109,210,0.3)]'
            : 'bg-surface-card hover:bg-border-subtle'
          }
        `}
      >
      {/* Rank */}
      <div className="w-8 h-8 rounded-lg bg-border-subtle flex items-center justify-center">
        <span className="text-[14px] font-bold text-text-secondary">{entry.rank}</span>
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5e6dd2]/20 to-[#8b93ff]/10 flex items-center justify-center overflow-hidden">
        {entry.avatar_url ? (
          <img
            src={getOptimizedAvatarUrl(entry.avatar_url, 40) || entry.avatar_url}
            alt={entry.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-text-secondary" />
        )}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-text-primary truncate">
            {entry.username}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(94,109,210,0.3)] text-[#8b93ff]">
              Toi
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `${levelColor}15`,
              color: levelColor,
            }}
          >
            Niv. {entry.level}
          </span>
          <span className="flex items-center gap-0.5">
            <Shield className="w-3 h-3 text-[#4ade80]" />
            {entry.reliability_score}%
          </span>
        </div>
      </div>

      {/* XP and streak */}
      <div className="text-right">
        <div className="flex items-center gap-1 text-[13px]">
          <Zap className="w-3 h-3 text-[#8b93ff]" />
          <span className="font-medium text-text-primary">
            {entry.xp.toLocaleString()}
          </span>
        </div>
        {entry.streak_days > 0 && (
          <div className="flex items-center justify-end gap-0.5 text-[11px] text-[#f5a623]">
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
  const sortedEntries = [...entries].sort((a, b) => a.rank - b.rank)

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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-[#f5a623]" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-text-primary">Classement Squad</h2>
          <p className="text-[12px] text-text-tertiary">Top joueurs cette semaine</p>
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
          <p className="text-[14px] text-text-secondary">Aucun classement disponible</p>
          <p className="text-[12px] text-text-tertiary">
            Participe a des sessions pour apparaitre ici !
          </p>
        </motion.div>
      )}
    </div>
  )
}
