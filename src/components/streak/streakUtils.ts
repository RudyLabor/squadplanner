// Milestone rewards configuration
export const MILESTONES = [
  { days: 7, xp: 100, label: '1 semaine', emoji: '🔥' },
  { days: 14, xp: 200, label: '2 semaines', emoji: '💪' },
  { days: 30, xp: 500, label: '1 mois', emoji: '🏆' },
  { days: 100, xp: 1000, label: '100 jours', emoji: '👑' },
]

// Calculate XP for any streak day
export const calculateXPReward = (days: number): number => {
  const milestone = MILESTONES.find(m => m.days === days)
  if (milestone) return milestone.xp
  if (days > 100 && days % 7 === 0) return 50
  return 0
}

// Get next milestone for a given streak
export const getNextMilestone = (currentStreak: number) => {
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
export const getFlameIntensity = (streak: number): number => {
  if (streak >= 100) return 4
  if (streak >= 30) return 3
  if (streak >= 14) return 2
  if (streak >= 7) return 1
  return 0
}

// Get flame color based on intensity
export const getFlameColors = (intensity: number) => {
  const colors = [
    { primary: 'var(--color-orange)', secondary: 'var(--color-orange)', glow: 'var(--color-orange-30)' },
    { primary: 'var(--color-warning)', secondary: 'var(--color-warning)', glow: 'var(--color-warning-30)' },
    { primary: 'var(--color-error)', secondary: 'var(--color-error)', glow: 'var(--color-error-20)' },
    { primary: 'var(--color-pink)', secondary: 'var(--color-pink)', glow: 'var(--color-pink-30)' },
    { primary: 'var(--color-purple)', secondary: 'var(--color-purple)', glow: 'var(--color-purple-20)' },
  ]
  return colors[Math.min(intensity, colors.length - 1)]
}

// Resolve CSS variable values at runtime for canvas-based libraries (e.g. Confetti)
export const resolveCSSColor = (varName: string): string => {
  if (typeof document === 'undefined') return '#888'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#888'
}
