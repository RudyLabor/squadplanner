
import { useState, useEffect, useMemo } from 'react'
import { m } from 'framer-motion'
import { Flame, Gift, Sparkles, Check, Zap } from './icons'
import { Card } from './ui'
import { colorMix } from '~/utils/colorMix'
import {
  MILESTONES,
  calculateXPReward,
  getNextMilestone,
  getFlameIntensity,
  getFlameColors,
} from './streak/streakUtils'
import { StreakMilestoneToast } from './streak/StreakMilestoneToast'
import { StreakHeatmap } from './streak/StreakHeatmap'

interface StreakCounterProps {
  streakDays: number
  lastActiveDate: string | null
  onCheckIn?: () => void
}

export function StreakCounter({ streakDays, lastActiveDate, onCheckIn }: StreakCounterProps) {
  const [showMilestoneConfetti, setShowMilestoneConfetti] = useState(false)
  const [celebratedMilestone, setCelebratedMilestone] = useState<(typeof MILESTONES)[0] | null>(
    null
  )

  const intensity = getFlameIntensity(streakDays)
  const flameColors = getFlameColors(intensity)
  const nextMilestone = useMemo(() => getNextMilestone(streakDays), [streakDays])

  const today = new Date().toISOString().split('T')[0]
  const hasCheckedInToday = lastActiveDate === today

  // Detect milestone achievements
  useEffect(() => {
    const milestone = MILESTONES.find((m) => m.days === streakDays)
    if (milestone) {
      setCelebratedMilestone(milestone)
      setShowMilestoneConfetti(true)

      const timeout = setTimeout(() => {
        setShowMilestoneConfetti(false)
        setTimeout(() => setCelebratedMilestone(null), 500)
      }, 5000)

      return () => clearTimeout(timeout)
    }
  }, [streakDays])

  const currentXPReward = calculateXPReward(streakDays)

  return (
    <>
      <StreakMilestoneToast showConfetti={showMilestoneConfetti} milestone={celebratedMilestone} />

      <Card
        className={`overflow-hidden bg-surface-dark ${intensity >= 2 ? 'ring-2 ring-offset-2 ring-offset-bg-base ring-orange-500' : ''}`}
        aria-label={`Serie de ${streakDays} ${streakDays === 1 ? 'jour' : 'jours'}`}
      >
        {/* Gradient top bar */}
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(to right, ${flameColors.primary}, ${flameColors.secondary})`,
          }}
        />

        <div className="p-5">
          {/* Main streak display */}
          <div className="flex items-center gap-4 mb-5">
            {/* Animated Fire */}
            <div className="relative">
              <m.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: colorMix(flameColors.primary, 8),
                }}
                animate={intensity >= 1 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <m.span
                  className="text-4xl relative z-10"
                  animate={{
                    y: intensity >= 1 ? [0, -3, 0] : 0,
                    scale: intensity >= 2 ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5 + 0.5 / (intensity + 1),
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  🔥
                </m.span>

                {intensity >= 2 && (
                  <m.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at center, ${flameColors.glow}, transparent)`,
                    }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}

                {intensity >= 3 && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <m.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: flameColors.secondary }}
                        animate={{
                          y: [-20, -40],
                          x: [0, (i - 1) * 15],
                          opacity: [1, 0],
                          scale: [1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: 'easeOut',
                        }}
                      />
                    ))}
                  </>
                )}
              </m.div>

              {intensity >= 4 && (
                <m.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 180, 360], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: flameColors.secondary }} />
                </m.div>
              )}
            </div>

            {/* Streak number and label */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <m.span
                  className="text-4xl font-bold text-text-primary"
                  key={streakDays}
                  initial={{ scale: 1.3, color: flameColors.primary }}
                  animate={{ scale: 1, color: 'var(--color-text-primary)' }}
                  transition={{ duration: 0.3 }}
                >
                  {streakDays}
                </m.span>
                <span className="text-md text-text-secondary">
                  {streakDays === 1 ? 'jour' : 'jours'}
                </span>
              </div>
              <p className="text-base text-text-tertiary">Série en cours</p>

              {currentXPReward > 0 && (
                <m.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 mt-1"
                >
                  <Zap className="w-3 h-3" style={{ color: flameColors.primary }} />
                  <span className="text-sm font-medium" style={{ color: flameColors.primary }}>
                    +{currentXPReward} XP aujourd'hui !
                  </span>
                </m.div>
              )}
            </div>

            {/* Check-in button */}
            {onCheckIn && (
              <m.button
                onClick={onCheckIn}
                disabled={hasCheckedInToday}
                className={`px-4 py-2.5 rounded-xl font-medium text-base transition-interactive ${
                  hasCheckedInToday
                    ? 'bg-success/20 text-success cursor-default'
                    : 'bg-gradient-to-r text-white hover:opacity-90 active:scale-95'
                }`}
                style={
                  !hasCheckedInToday
                    ? {
                        background: `linear-gradient(135deg, ${flameColors.primary}, ${flameColors.secondary})`,
                      }
                    : undefined
                }
                whileHover={!hasCheckedInToday ? { scale: 1.02 } : undefined}
                whileTap={!hasCheckedInToday ? { scale: 0.98 } : undefined}
              >
                {hasCheckedInToday ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Fait
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    Pointer
                  </span>
                )}
              </m.button>
            )}
          </div>

          {/* Next milestone progress */}
          <div className="mb-5 p-3 rounded-xl bg-surface-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary-hover" />
                <span className="text-base text-text-secondary">Prochain objectif</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-text-primary">
                  {nextMilestone.emoji} {nextMilestone.label}
                </span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-success/20 text-success">
                  +{nextMilestone.xp} XP
                </span>
              </div>
            </div>
            <div className="relative h-2 bg-border-subtle rounded-full overflow-hidden">
              <m.div
                className="absolute h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${flameColors.primary}, ${flameColors.secondary})`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${nextMilestone.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-sm text-text-tertiary mt-1.5 text-right">
              Encore {nextMilestone.daysRemaining}{' '}
              {nextMilestone.daysRemaining === 1 ? 'jour' : 'jours'}
            </p>
          </div>

          <StreakHeatmap streakDays={streakDays} flameColors={flameColors} />

          {/* Streak tips for low streaks */}
          {streakDays < 7 && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-primary-hover/[0.08] border border-primary-hover/15"
            >
              <p className="text-sm text-primary-hover">
                {streakDays === 0
                  ? "Lance ta série aujourd'hui ! Pointe chaque jour pour gagner des XP."
                  : `Plus que ${7 - streakDays} jours pour ton premier objectif ! Continue comme ça !`}
              </p>
            </m.div>
          )}

          {/* Legendary status for 100+ */}
          {streakDays >= 100 && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple/15 to-pink/15 border border-purple/25"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <div>
                  <p className="text-base font-medium text-text-primary">Statut Légendaire !</p>
                  <p className="text-sm text-purple">
                    Tu as atteint une série de 100+ jours. Tu es inarrêtable !
                  </p>
                </div>
              </div>
            </m.div>
          )}
        </div>
      </Card>
    </>
  )
}
