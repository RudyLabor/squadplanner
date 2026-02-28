import { useState, useEffect, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Check, Trophy } from '../icons'
import Confetti from '../LazyConfetti'
import { Card } from '../ui'

const ACHIEVEMENTS = [
  {
    id: 'first_step',
    name: 'Premier pas',
    icon: '',
    description: '1ère session',
    threshold: 1,
    type: 'sessions',
  },
  {
    id: 'team_player',
    name: "Joueur d'équipe",
    icon: '',
    description: '5 sessions',
    threshold: 5,
    type: 'sessions',
  },
  {
    id: 'reliable',
    name: 'Fiable',
    icon: '',
    description: '10 check-ins',
    threshold: 10,
    type: 'checkins',
  },
  {
    id: 'veteran',
    name: 'Vétéran',
    icon: '',
    description: '20 sessions',
    threshold: 20,
    type: 'sessions',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionniste',
    icon: '',
    description: '100% fiabilité',
    threshold: 100,
    type: 'score',
  },
  {
    id: 'legend',
    name: 'Légende',
    icon: '',
    description: '50 sessions',
    threshold: 50,
    type: 'sessions',
  },
]

interface ProfileBadgesProps {
  profile: {
    total_sessions?: number
    total_checkins?: number
    reliability_score?: number
  } | null
  challengesLoaded: boolean
  challengesData?: { badges?: unknown[] }
  SeasonalBadgesComponent: React.ComponentType<any>
}

export function ProfileBadges({
  profile,
  challengesLoaded,
  challengesData,
  SeasonalBadgesComponent,
}: ProfileBadgesProps) {
  const totalSessions = profile?.total_sessions || 0
  const totalCheckins = profile?.total_checkins || 0
  const hasNoActivity = totalSessions === 0 && totalCheckins === 0
  // New player with no sessions → effective score is 0 regardless of DB value
  const reliabilityScore = hasNoActivity ? 0 : (profile?.reliability_score ?? 0)

  const unlockedAchievements = ACHIEVEMENTS.filter((a) => {
    const value =
      a.type === 'sessions'
        ? totalSessions
        : a.type === 'checkins'
          ? totalCheckins
          : reliabilityScore
    return value >= a.threshold
  })

  // Achievement celebration states
  const [showAchievementConfetti, setShowAchievementConfetti] = useState(false)
  const [celebratedAchievement, setCelebratedAchievement] = useState<
    (typeof ACHIEVEMENTS)[0] | null
  >(null)
  const previousUnlockedIdsRef = useRef<string[]>([])

  useEffect(() => {
    const currentUnlockedIds = unlockedAchievements.map((a) => a.id)
    const previousIds = previousUnlockedIdsRef.current

    const newlyUnlocked = unlockedAchievements.filter((a) => !previousIds.includes(a.id))

    if (previousIds.length > 0 && newlyUnlocked.length > 0) {
      const achievement = newlyUnlocked[0]
      setCelebratedAchievement(achievement)
      setShowAchievementConfetti(true)

      setTimeout(() => {
        setShowAchievementConfetti(false)
        setTimeout(() => setCelebratedAchievement(null), 500)
      }, 5000)
    }

    previousUnlockedIdsRef.current = currentUnlockedIds
  }, [unlockedAchievements])

  return (
    <>
      {/* Achievement Celebration Confetti */}
      {showAchievementConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.25}
          colors={[
            'var(--color-success)',
            'var(--color-primary)',
            'var(--color-warning)',
            'var(--color-purple)',
            'var(--color-text-primary)',
          ]}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Achievement Celebration Toast */}
      <AnimatePresence>
        {celebratedAchievement && (
          <m.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary/90 to-purple/90 border border-primary/40 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <m.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="text-4xl"
              >
                {celebratedAchievement.icon}
              </m.div>
              <div>
                <m.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-medium text-white/70 uppercase tracking-wide"
                >
                  Succès débloqué !
                </m.p>
                <m.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-bold text-white"
                >
                  {celebratedAchievement.name}
                </m.p>
                <m.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-base text-white/80"
                >
                  {celebratedAchievement.description}
                </m.p>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Seasonal Badges Section */}
      <Card className="mb-5 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Trophy className="w-4 h-4 text-warning" />
          <h3 className="text-base font-semibold text-text-primary">Badges Saisonniers</h3>
        </div>
        {challengesLoaded ? (
          <SeasonalBadgesComponent initialBadges={challengesData?.badges} />
        ) : (
          <div className="p-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-12 rounded-xl bg-surface-card animate-pulse" />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Achievements section */}
      <Card className="mb-5 p-4 bg-bg-elevated">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Succès</h3>
          <span className="text-sm text-text-quaternary">
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {ACHIEVEMENTS.map((achievement, index) => {
            const isUnlocked = unlockedAchievements.some((a) => a.id === achievement.id)
            return (
              <m.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-3 rounded-xl text-center ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-primary-15 to-purple-10 border border-primary'
                    : 'bg-surface-card border border-transparent'
                }`}
              >
                <m.div
                  className="text-2xl mb-1"
                  animate={isUnlocked ? { scale: [1, 1.04, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {isUnlocked ? achievement.icon : ''}
                </m.div>
                <div
                  className={`text-xs font-medium ${isUnlocked ? 'text-text-primary' : 'text-text-quaternary'}`}
                >
                  {achievement.name}
                </div>
                <div className="text-xs text-text-quaternary">{achievement.description}</div>
                {isUnlocked && (
                  <m.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                      delay: index * 0.1 + 0.3,
                    }}
                  >
                    <Check className="w-3 h-3 text-bg-base" />
                  </m.div>
                )}
              </m.div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
