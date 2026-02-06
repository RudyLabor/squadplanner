import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Gift, Sparkles, Check, Zap } from 'lucide-react'
import Confetti from 'react-confetti'
import { Card } from './ui'

// Milestone rewards configuration
const MILESTONES = [
  { days: 7, xp: 100, label: '1 semaine', emoji: '🔥' },
  { days: 14, xp: 200, label: '2 semaines', emoji: '💪' },
  { days: 30, xp: 500, label: '1 mois', emoji: '🏆' },
  { days: 100, xp: 1000, label: '100 jours', emoji: '👑' },
]

// Calculate XP for any streak day
const calculateXPReward = (days: number): number => {
  // Check major milestones first
  const milestone = MILESTONES.find(m => m.days === days)
  if (milestone) return milestone.xp

  // Every 7 days after 100 gives +50 XP
  if (days > 100 && days % 7 === 0) return 50

  return 0
}

// Get next milestone for a given streak
const getNextMilestone = (currentStreak: number) => {
  // Find next major milestone
  const nextMajor = MILESTONES.find(m => m.days > currentStreak)

  if (nextMajor) {
    return {
      days: nextMajor.days,
      xp: nextMajor.xp,
      label: nextMajor.label,
      emoji: nextMajor.emoji,
      daysRemaining: nextMajor.days - currentStreak,
      progress: (currentStreak / nextMajor.days) * 100,
    }
  }

  // After 100, next milestone is every 7 days
  const nextSevenDayMark = Math.ceil((currentStreak + 1) / 7) * 7
  return {
    days: nextSevenDayMark,
    xp: 50,
    label: `${nextSevenDayMark} jours`,
    emoji: '⭐',
    daysRemaining: nextSevenDayMark - currentStreak,
    progress: ((currentStreak % 7) / 7) * 100,
  }
}

// Get flame intensity based on streak (0-4)
const getFlameIntensity = (streak: number): number => {
  if (streak >= 100) return 4
  if (streak >= 30) return 3
  if (streak >= 14) return 2
  if (streak >= 7) return 1
  return 0
}

// Get flame color based on intensity
const getFlameColors = (intensity: number) => {
  const colors = [
    { primary: '#f97316', secondary: '#fb923c', glow: 'rgba(249, 115, 22, 0.3)' }, // Orange (default)
    { primary: '#f59e0b', secondary: '#fbbf24', glow: 'rgba(245, 158, 11, 0.4)' }, // Amber
    { primary: '#ef4444', secondary: '#f87171', glow: 'rgba(239, 68, 68, 0.5)' }, // Red
    { primary: '#ec4899', secondary: '#f472b6', glow: 'rgba(236, 72, 153, 0.5)' }, // Pink
    { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139, 92, 246, 0.6)' }, // Purple (legendary)
  ]
  return colors[Math.min(intensity, colors.length - 1)]
}

interface StreakCounterProps {
  streakDays: number
  lastActiveDate: string | null
  onCheckIn?: () => void
}

export function StreakCounter({ streakDays, lastActiveDate, onCheckIn }: StreakCounterProps) {
  const [showMilestoneConfetti, setShowMilestoneConfetti] = useState(false)
  const [celebratedMilestone, setCelebratedMilestone] = useState<typeof MILESTONES[0] | null>(null)

  const intensity = getFlameIntensity(streakDays)
  const flameColors = getFlameColors(intensity)
  const nextMilestone = useMemo(() => getNextMilestone(streakDays), [streakDays])

  // Check if today has been checked in
  const today = new Date().toISOString().split('T')[0]
  const hasCheckedInToday = lastActiveDate === today

  // Generate last 7 days for mini calendar
  const last7Days = useMemo(() => {
    const days: { date: string; dayOfWeek: string; isActive: boolean; isToday: boolean }[] = []
    const todayDate = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'short' }).charAt(0).toUpperCase()

      // Simple activity calculation based on streak
      // If streak is X days, mark last X days as active (up to 7)
      const daysAgo = i
      const isActive = daysAgo < streakDays
      const isToday = i === 0

      days.push({ date: dateStr, dayOfWeek, isActive, isToday })
    }
    return days
  }, [streakDays])

  // Detect milestone achievements
  useEffect(() => {
    const milestone = MILESTONES.find(m => m.days === streakDays)
    if (milestone) {
      setCelebratedMilestone(milestone)
      setShowMilestoneConfetti(true)

      // Auto-hide after 5 seconds
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
      {/* Milestone Celebration Confetti */}
      {showMilestoneConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
          colors={['#f97316', '#fbbf24', '#ef4444', '#ec4899', '#8b5cf6', '#4ade80']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Milestone Celebration Toast */}
      <AnimatePresence>
        {celebratedMilestone && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#f97316]/90 to-[#fbbf24]/90 border border-[#f97316]/50 backdrop-blur-xl shadow-[0_0_40px_rgba(249,115,22,0.5)]"
          >
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="text-4xl"
              >
                {celebratedMilestone.emoji}
              </motion.div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[12px] font-medium text-white/70 uppercase tracking-wide"
                >
                  Objectif atteint !
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[18px] font-bold text-white"
                >
                  Série de {celebratedMilestone.days} jours !
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[13px] text-white/90 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  +{celebratedMilestone.xp} XP gagnés !
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className={`overflow-hidden bg-[#1a1a2e] ${intensity >= 2 ? 'ring-2 ring-offset-2 ring-offset-[#08090a] ring-orange-500' : ''}`}>
        {/* Gradient top bar */}
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(to right, ${flameColors.primary}, ${flameColors.secondary})`
          }}
        />

        <div className="p-5">
          {/* Main streak display */}
          <div className="flex items-center gap-4 mb-5">
            {/* Animated Fire */}
            <div className="relative">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: `${flameColors.primary}15` }}
                animate={intensity >= 1 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Fire emoji with animation */}
                <motion.span
                  className="text-4xl relative z-10"
                  animate={{
                    y: intensity >= 1 ? [0, -3, 0] : 0,
                    scale: intensity >= 2 ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5 + (0.5 / (intensity + 1)),
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  🔥
                </motion.span>

                {/* Glow effect for high streaks */}
                {intensity >= 2 && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at center, ${flameColors.glow}, transparent)`
                    }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}

                {/* Particle effects for legendary streaks */}
                {intensity >= 3 && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
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
              </motion.div>

              {/* Sparkles for legendary */}
              {intensity >= 4 && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 180, 360], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: flameColors.secondary }} />
                </motion.div>
              )}
            </div>

            {/* Streak number and label */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <motion.span
                  className="text-4xl font-bold text-[#f7f8f8]"
                  key={streakDays}
                  initial={{ scale: 1.3, color: flameColors.primary }}
                  animate={{ scale: 1, color: '#f7f8f8' }}
                  transition={{ duration: 0.3 }}
                >
                  {streakDays}
                </motion.span>
                <span className="text-[15px] text-[#8b8d90]">
                  {streakDays === 1 ? 'jour' : 'jours'}
                </span>
              </div>
              <p className="text-[13px] text-[#5e6063]">Série en cours</p>

              {/* Today's XP reward if any */}
              {currentXPReward > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 mt-1"
                >
                  <Zap className="w-3 h-3" style={{ color: flameColors.primary }} />
                  <span className="text-[12px] font-medium" style={{ color: flameColors.primary }}>
                    +{currentXPReward} XP aujourd'hui !
                  </span>
                </motion.div>
              )}
            </div>

            {/* Check-in button */}
            {onCheckIn && (
              <motion.button
                onClick={onCheckIn}
                disabled={hasCheckedInToday}
                className={`px-4 py-2.5 rounded-xl font-medium text-[13px] transition-all ${
                  hasCheckedInToday
                    ? 'bg-[#4ade80]/20 text-[#4ade80] cursor-default'
                    : 'bg-gradient-to-r text-white hover:opacity-90 active:scale-95'
                }`}
                style={!hasCheckedInToday ? {
                  background: `linear-gradient(135deg, ${flameColors.primary}, ${flameColors.secondary})`
                } : undefined}
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
              </motion.button>
            )}
          </div>

          {/* Next milestone progress */}
          <div className="mb-5 p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#8b93ff]" />
                <span className="text-[13px] text-[#8b8d90]">Prochain objectif</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[#f7f8f8]">
                  {nextMilestone.emoji} {nextMilestone.label}
                </span>
                <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#4ade80]/20 text-[#4ade80]">
                  +{nextMilestone.xp} XP
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
              <motion.div
                className="absolute h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${flameColors.primary}, ${flameColors.secondary})`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${nextMilestone.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            <p className="text-[11px] text-[#5e6063] mt-1.5 text-right">
              Encore {nextMilestone.daysRemaining} {nextMilestone.daysRemaining === 1 ? 'jour' : 'jours'}
            </p>
          </div>

          {/* Mini calendar - Last 7 days */}
          <div>
            <p className="text-[12px] text-[#5e6063] mb-2 uppercase tracking-wide">7 derniers jours</p>
            <div className="flex gap-2 justify-between">
              {last7Days.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-[#5e6063]">{day.dayOfWeek}</span>
                  <motion.div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      day.isToday
                        ? 'ring-2 ring-offset-1 ring-offset-[#1a1a2e]'
                        : ''
                    }`}
                    style={{
                      backgroundColor: day.isActive
                        ? `${flameColors.primary}30`
                        : 'rgba(255,255,255,0.03)',
                      ['--tw-ring-color' as string]: day.isToday ? flameColors.primary : undefined,
                    }}
                    initial={day.isActive ? { scale: 0.8 } : {}}
                    animate={day.isActive ? { scale: 1 } : {}}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {day.isActive ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: flameColors.primary }}
                      />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak tips for low streaks */}
          {streakDays < 7 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-[rgba(139,147,255,0.08)] border border-[rgba(139,147,255,0.15)]"
            >
              <p className="text-[12px] text-[#8b93ff]">
                {streakDays === 0
                  ? "Lance ta série aujourd'hui ! Pointe chaque jour pour gagner des XP."
                  : `Plus que ${7 - streakDays} jours pour ton premier objectif ! Continue comme ça !`}
              </p>
            </motion.div>
          )}

          {/* Legendary status for 100+ */}
          {streakDays >= 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[rgba(139,92,246,0.15)] to-[rgba(236,72,153,0.15)] border border-[rgba(139,92,246,0.25)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <div>
                  <p className="text-[13px] font-medium text-[#f7f8f8]">Statut Légendaire !</p>
                  <p className="text-[11px] text-[#a78bfa]">
                    Tu as atteint une série de 100+ jours. Tu es inarrêtable !
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </>
  )
}
