'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { LogOut } from '../components/icons'
import { ProfileSkeleton } from '../components/ui'
import { useAuthStore, usePremiumStore } from '../hooks'
import { useAICoachQuery, useChallengesQuery, useClaimChallengeXPMutation } from '../hooks/queries'
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal'
import { XPBar } from '../components/XPBar'
import { LevelUpCelebration } from '../components/LevelUpCelebration'
import { Challenges } from '../components/Challenges'
import type { Challenge, UserChallenge } from '../components/Challenges'
import { SeasonalBadges } from '../components/SeasonalBadges'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import { ProfileStats } from '../components/profile/ProfileStats'
import { ProfileBadges } from '../components/profile/ProfileBadges'
import { ProfileHistory } from '../components/profile/ProfileHistory'
import { showSuccess, showError } from '../lib/toast'

type ChallengeWithProgress = Challenge & { userProgress?: UserChallenge }

export function Profile() {
  const { user, profile, signOut, updateProfile, isLoading, isInitialized, refreshProfile } =
    useAuthStore()
  const { hasPremium, canAccessFeature, fetchPremiumStatus } = usePremiumStore()

  // React Query hooks
  const { data: aiCoachTip } = useAICoachQuery(user?.id, 'profile')
  const { data: challengesData, isSuccess: challengesLoaded } = useChallengesQuery()
  const claimXPMutation = useClaimChallengeXPMutation()

  // Transform challenges data - deduplicate by ID
  const challenges: ChallengeWithProgress[] = useMemo(() => {
    const seenIds = new Set<string>()
    return (challengesData?.challenges || [])
      .filter((challenge) => {
        if (seenIds.has(challenge.id)) return false
        seenIds.add(challenge.id)
        return true
      })
      .map((challenge) => {
        const userProgress = challengesData?.userChallenges?.find(
          (uc) => uc.challenge_id === challenge.id
        )
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description || '',
          xp_reward: challenge.xp_reward,
          type: (challenge.type || 'daily') as 'daily' | 'weekly' | 'seasonal' | 'achievement',
          icon: challenge.icon || 'star',
          requirements: challenge.requirements || { type: 'sessions', count: 1 },
          userProgress: userProgress
            ? {
                challenge_id: userProgress.challenge_id,
                progress: userProgress.progress,
                target: userProgress.target || challenge.requirements?.count || 1,
                completed_at: userProgress.completed_at,
                xp_claimed: userProgress.xp_claimed,
              }
            : undefined,
        }
      })
  }, [challengesData])

  const [showPremiumModal, setShowPremiumModal] = useState(false)

  // Gamification states
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState<number | null>(null)
  const previousLevelRef = useRef<number | null>(null)

  // Fetch premium status on mount
  useEffect(() => {
    if (user?.id) {
      fetchPremiumStatus()
    }
  }, [user?.id, fetchPremiumStatus])

  // Detect level up
  useEffect(() => {
    const currentLevel = profile?.level || 1
    const previousLevel = previousLevelRef.current

    if (previousLevel !== null && currentLevel > previousLevel) {
      setNewLevel(currentLevel)
      setShowLevelUp(true)
    }

    previousLevelRef.current = currentLevel
  }, [profile?.level])

  const handleClaimXP = async (challengeId: string) => {
    if (!user?.id) return

    const challenge = challenges.find((c) => c.id === challengeId)
    if (!challenge) return

    try {
      const xpReward = await claimXPMutation.mutateAsync(challengeId)
      if (refreshProfile) await refreshProfile()
      showSuccess(`+${xpReward} XP réclamés !`)
    } catch (error) {
      console.error('Error claiming XP:', error)
      showError('Erreur lors de la réclamation des XP')
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const profileReady = !!profile && isInitialized

  // Loading state with skeleton
  if (!isInitialized || (isLoading && !profile)) {
    return (
      <div className="min-h-0 bg-bg-base pb-6">
        <div className="relative">
          <div className="absolute inset-0 h-48 bg-gradient-to-b from-primary-15 to-transparent" />
          <div className="relative px-4 md:px-6 lg:px-8 pt-8 pb-4 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
            <ProfileSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Profil">
      {/* Level Up Celebration */}
      {showLevelUp && newLevel && (
        <LevelUpCelebration
          newLevel={newLevel}
          onComplete={() => {
            setShowLevelUp(false)
            setNewLevel(null)
          }}
        />
      )}

      {/* Header: Avatar, name, bio, edit */}
      <ProfileHeader
        user={user}
        profile={profile}
        isLoading={isLoading}
        updateProfile={updateProfile}
      />

      <div className="px-4 md:px-6 lg:px-8 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* XP Bar — Uses profile.xp from the profiles table.
            NOTE: Squad-level XP (e.g. squad_members.xp) is computed per-squad and may differ
            from the global profile.xp. If they're out of sync, the server-side trigger
            (on challenge claim / session RSVP) may need to update both. */}
        {!profileReady ? (
          <div className="mb-5 h-[52px] rounded-xl bg-surface-card animate-pulse" />
        ) : (
          <XPBar currentXP={profile?.xp || 0} level={profile?.level || 1} className="mb-5" />
        )}

        {/* Reliability score + Stats grid */}
        <ProfileStats profile={profile} profileReady={profileReady} />

        {/* Challenges Section - moved up for visibility */}
        {challenges.length > 0 && (
          <section className="mb-5" aria-label="Défis">
            <Challenges challenges={challenges} onClaimXP={handleClaimXP} />
          </section>
        )}

        {/* Activity, AI Coach, Call History, Premium sections */}
        <ProfileHistory
          profile={profile}
          hasPremium={hasPremium}
          canAccessFeature={canAccessFeature}
          aiCoachTip={aiCoachTip}
        />

        {/* Badges: Seasonal + Achievements */}
        <ProfileBadges
          profile={profile}
          challengesLoaded={challengesLoaded}
          challengesData={challengesData}
          SeasonalBadgesComponent={SeasonalBadges}
        />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 text-md text-error hover:text-error/70 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>

      {/* Modal Premium */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="Compte Premium"
      />
    </main>
  )
}
