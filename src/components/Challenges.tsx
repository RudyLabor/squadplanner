import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Zap, Calendar, Trophy, Target, Flame,
  Check, Gift, Clock, Award, Sparkles
} from 'lucide-react'
import { Button, Card } from './ui'

// Type definitions
export interface Challenge {
  id: string
  title: string
  description: string
  xp_reward: number
  type: 'daily' | 'weekly' | 'seasonal' | 'achievement'
  icon: string
  requirements: { type: string; count?: number; score?: number }
}

export interface UserChallenge {
  challenge_id: string
  progress: number
  target: number
  completed_at: string | null
  xp_claimed: boolean
}

export interface ChallengesProps {
  challenges: (Challenge & { userProgress?: UserChallenge })[]
  onClaimXP: (challengeId: string) => void
}

// Icon mapping for challenge icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  star: Star,
  zap: Zap,
  calendar: Calendar,
  trophy: Trophy,
  target: Target,
  flame: Flame,
  gift: Gift,
  clock: Clock,
  award: Award,
  sparkles: Sparkles,
}

// Type metadata for styling and labels
const TYPE_CONFIG = {
  daily: {
    label: 'Quotidien',
    color: '#4ade80',
    bgColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  weekly: {
    label: 'Hebdomadaire',
    color: '#5e6dd2',
    bgColor: 'rgba(94, 109, 210, 0.15)',
    borderColor: 'rgba(94, 109, 210, 0.3)',
  },
  seasonal: {
    label: 'Saisonnier',
    color: '#f5a623',
    bgColor: 'rgba(245, 166, 35, 0.15)',
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  achievement: {
    label: 'Accomplissement',
    color: '#8b93ff',
    bgColor: 'rgba(139, 147, 255, 0.15)',
    borderColor: 'rgba(139, 147, 255, 0.3)',
  },
}

type ChallengeType = 'all' | 'daily' | 'weekly' | 'seasonal' | 'achievement'

export function Challenges({ challenges, onClaimXP }: ChallengesProps) {
  const [activeTab, setActiveTab] = useState<ChallengeType>('all')
  const [claimingId, setClaimingId] = useState<string | null>(null)

  // Filter challenges by type
  const filteredChallenges = activeTab === 'all'
    ? challenges
    : challenges.filter(c => c.type === activeTab)

  // Sort: claimable first, then in-progress, then completed
  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    const aClaimable = a.userProgress?.completed_at && !a.userProgress?.xp_claimed
    const bClaimable = b.userProgress?.completed_at && !b.userProgress?.xp_claimed
    const aCompleted = a.userProgress?.xp_claimed
    const bCompleted = b.userProgress?.xp_claimed

    if (aClaimable && !bClaimable) return -1
    if (!aClaimable && bClaimable) return 1
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    return 0
  })

  // Count challenges by type for badges
  const counts = {
    all: challenges.length,
    daily: challenges.filter(c => c.type === 'daily').length,
    weekly: challenges.filter(c => c.type === 'weekly').length,
    seasonal: challenges.filter(c => c.type === 'seasonal').length,
    achievement: challenges.filter(c => c.type === 'achievement').length,
  }

  // Count claimable challenges
  const claimableCount = challenges.filter(
    c => c.userProgress?.completed_at && !c.userProgress?.xp_claimed
  ).length

  const handleClaim = async (challengeId: string) => {
    setClaimingId(challengeId)
    try {
      await onClaimXP(challengeId)
    } finally {
      setClaimingId(null)
    }
  }

  const tabs: { key: ChallengeType; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'daily', label: 'Quotidien' },
    { key: 'weekly', label: 'Hebdo' },
    { key: 'seasonal', label: 'Saison' },
    { key: 'achievement', label: 'Succès' },
  ]

  return (
    <div className="space-y-4">
      {/* Header with claimable badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.15)] flex items-center justify-center">
            <Target className="w-5 h-5 text-[#f5a623]" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-[#f7f8f8]">Challenges</h2>
            <p className="text-[12px] text-[#5e6063]">
              {challenges.length} challenges disponibles
            </p>
          </div>
        </div>
        {claimableCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.3)]"
          >
            <Gift className="w-4 h-4 text-[#4ade80]" />
            <span className="text-[13px] font-medium text-[#4ade80]">
              {claimableCount} à réclamer
            </span>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-interactive ${
              activeTab === tab.key
                ? 'bg-[rgba(255,255,255,0.1)] text-[#f7f8f8] border border-[rgba(255,255,255,0.2)]'
                : 'bg-[rgba(255,255,255,0.02)] text-[#8b8d90] border border-transparent hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                activeTab === tab.key
                  ? 'bg-[rgba(255,255,255,0.15)] text-[#f7f8f8]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#5e6063]'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Challenges list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedChallenges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center">
                <Target className="w-8 h-8 text-[#5e6063]" />
              </div>
              <p className="text-[14px] text-[#5e6063]">
                Aucun challenge dans cette catégorie
              </p>
            </motion.div>
          ) : (
            sortedChallenges.map((challenge, index) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                index={index}
                onClaim={handleClaim}
                isClaiming={claimingId === challenge.id}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Individual challenge card component
interface ChallengeCardProps {
  challenge: Challenge & { userProgress?: UserChallenge }
  index: number
  onClaim: (id: string) => void
  isClaiming: boolean
}

function ChallengeCard({ challenge, index, onClaim, isClaiming }: ChallengeCardProps) {
  const config = TYPE_CONFIG[challenge.type]
  const IconComponent = ICON_MAP[challenge.icon.toLowerCase()] || Target

  const progress = challenge.userProgress?.progress ?? 0
  const target = challenge.userProgress?.target ?? 1
  const progressPercent = Math.min((progress / target) * 100, 100)
  const isCompleted = !!challenge.userProgress?.completed_at
  const isClaimed = !!challenge.userProgress?.xp_claimed
  const canClaim = isCompleted && !isClaimed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`p-4 transition-interactive ${
          isClaimed
            ? 'bg-[rgba(255,255,255,0.01)] opacity-60'
            : canClaim
              ? 'bg-[#1a1a2e] border-[rgba(74,222,128,0.3)] shadow-[0_0_20px_rgba(74,222,128,0.15)]'
              : 'bg-[#1a1a2e] border-[rgba(255,255,255,0.1)]'
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative"
            style={{ backgroundColor: config.bgColor }}
          >
            {isClaimed ? (
              <Check className="w-6 h-6" style={{ color: config.color }} />
            ) : (
              <IconComponent className="w-6 h-6" style={{ color: config.color }} />
            )}
            {canClaim && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ boxShadow: `0 0 15px ${config.color}40` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={`text-[14px] font-semibold ${
                    isClaimed ? 'text-[#5e6063] line-through' : 'text-[#f7f8f8]'
                  }`}>
                    {challenge.title}
                  </h3>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                </div>
                <p className={`text-[12px] ${
                  isClaimed ? 'text-[#3a3a3a]' : 'text-[#8b8d90]'
                }`}>
                  {challenge.description}
                </p>
              </div>

              {/* XP Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0 ${
                isClaimed
                  ? 'bg-[rgba(255,255,255,0.02)]'
                  : 'bg-[rgba(245,166,35,0.15)]'
              }`}>
                <Zap className={`w-3.5 h-3.5 ${
                  isClaimed ? 'text-[#5e6063]' : 'text-[#f5a623]'
                }`} />
                <span className={`text-[12px] font-bold ${
                  isClaimed ? 'text-[#5e6063]' : 'text-[#f5a623]'
                }`}>
                  {challenge.xp_reward} XP
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {!isClaimed && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[#8b8d90]">
                    Progression
                  </span>
                  <span className="text-[#5e6063]">
                    {progress}/{target}
                  </span>
                </div>
                <div className="relative h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                  <motion.div
                    className="absolute h-full rounded-full"
                    style={{
                      background: isCompleted
                        ? `linear-gradient(90deg, ${config.color}, #4ade80)`
                        : config.color,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                  />
                  {isCompleted && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Claim button */}
            {canClaim && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <Button
                  size="sm"
                  onClick={() => onClaim(challenge.id)}
                  isLoading={isClaiming}
                  className="w-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-[#08090a]"
                >
                  <Gift className="w-4 h-4" />
                  Reclamer {challenge.xp_reward} XP
                </Button>
              </motion.div>
            )}

            {/* Claimed indicator */}
            {isClaimed && (
              <div className="mt-3 flex items-center gap-2 text-[12px] text-[#5e6063]">
                <Check className="w-4 h-4 text-[#4ade80]" />
                <span>XP réclamés</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default Challenges
