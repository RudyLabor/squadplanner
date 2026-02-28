import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Target, Gift } from './icons'
import { ChallengeCard } from './challenges/ChallengeCard'

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

type ChallengeType = 'all' | 'daily' | 'weekly' | 'seasonal' | 'achievement'

export function Challenges({ challenges, onClaimXP }: ChallengesProps) {
  const [activeTab, setActiveTab] = useState<ChallengeType>('all')
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const filteredChallenges =
    activeTab === 'all' ? challenges : challenges.filter((c) => c.type === activeTab)

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

  const counts = {
    all: challenges.length,
    daily: challenges.filter((c) => c.type === 'daily').length,
    weekly: challenges.filter((c) => c.type === 'weekly').length,
    seasonal: challenges.filter((c) => c.type === 'seasonal').length,
    achievement: challenges.filter((c) => c.type === 'achievement').length,
  }

  const claimableCount = challenges.filter(
    (c) => c.userProgress?.completed_at && !c.userProgress?.xp_claimed
  ).length

  const handleClaim = async (challengeId: string) => {
    setClaimingId(challengeId)
    try {
      await onClaimXP(challengeId)
    } finally {
      setClaimingId(null)
    }
  }

  const allTabs: { key: ChallengeType; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'daily', label: 'Quotidien' },
    { key: 'weekly', label: 'Hebdo' },
    { key: 'seasonal', label: 'Saison' },
    { key: 'achievement', label: 'Succès' },
  ]

  const tabs = allTabs.filter((tab) => tab.key === 'all' || counts[tab.key] > 0)

  return (
    <div className="space-y-4">
      {/* Header with claimable badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-15 flex items-center justify-center">
            <Target className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Challenges</h2>
            <p className="text-sm text-text-tertiary">{challenges.length} challenges disponibles</p>
          </div>
        </div>
        {claimableCount > 0 && (
          <m.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-15 border border-success"
          >
            <Gift className="w-4 h-4 text-success" />
            <span className="text-base font-medium text-success">{claimableCount} à réclamer</span>
          </m.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium whitespace-nowrap transition-interactive ${
              activeTab === tab.key
                ? 'bg-border-hover text-text-primary border border-border-hover'
                : 'bg-surface-card text-text-secondary border border-transparent hover:bg-border-subtle'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-sm ${
                  activeTab === tab.key
                    ? 'bg-overlay-medium text-text-primary'
                    : 'bg-border-subtle text-text-tertiary'
                }`}
              >
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
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-card flex items-center justify-center">
                <Target className="w-8 h-8 text-text-tertiary" />
              </div>
              <p className="text-base text-text-tertiary">Aucun challenge dans cette catégorie</p>
            </m.div>
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

export default Challenges
