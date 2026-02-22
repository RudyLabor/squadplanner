import { useMemo } from 'react'
import { m } from 'framer-motion'
import { Flame, Gift, Zap } from '../icons'
import { Card } from '../ui'

interface ProfileActivityCardProps {
  streakDays: number
}

export function ProfileActivityCard({ streakDays }: ProfileActivityCardProps) {
  // Next milestone calculation
  const MILESTONES = [
    { days: 7, xp: 100, label: '1 semaine', emoji: '🔥' },
    { days: 14, xp: 200, label: '2 semaines', emoji: '💪' },
    { days: 30, xp: 500, label: '1 mois', emoji: '🏆' },
    { days: 100, xp: 1000, label: '100 jours', emoji: '👑' },
  ]
  const nextMilestone = useMemo(() => {
    const next = MILESTONES.find((m) => m.days > streakDays)
    if (next) {
      return {
        ...next,
        daysRemaining: next.days - streakDays,
        progress: (streakDays / next.days) * 100,
      }
    }
    const nextSeven = Math.ceil((streakDays + 1) / 7) * 7
    return {
      days: nextSeven,
      xp: 50,
      label: `${nextSeven} jours`,
      emoji: '⭐',
      daysRemaining: nextSeven - streakDays,
      progress: ((streakDays % 7) / 7) * 100,
    }
  }, [streakDays])

  // Last 7 days
  const last7Days = useMemo(() => {
    const days: { label: string; isActive: boolean; isToday: boolean }[] = []
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dow = d.getDay()
      days.push({
        label: labels[dow === 0 ? 6 : dow - 1],
        isActive: i < streakDays,
        isToday: i === 0,
      })
    }
    return days
  }, [streakDays])

  return (
    <section className="mb-5" aria-label="Activité">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-warning" />
        <h3 className="text-base font-semibold text-text-primary uppercase tracking-wide">
          Activité
        </h3>
      </div>
      <Card className="p-4">
        {/* Streak count */}
        <div className="flex items-center gap-3 mb-4">
          <m.div
            className="w-12 h-12 rounded-xl bg-warning/12 flex items-center justify-center"
            animate={streakDays >= 7 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-2xl">🔥</span>
          </m.div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary">{streakDays}</span>
              <span className="text-sm text-text-tertiary">
                {streakDays <= 1 ? 'jour' : 'jours'}
              </span>
            </div>
            <p className="text-xs text-text-quaternary">Série en cours</p>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/12">
              <Zap className="w-3 h-3 text-success" />
              <span className="text-xs font-medium text-success">Actif</span>
            </div>
          )}
        </div>

        {/* Next milestone progress */}
        <div className="p-3 rounded-xl bg-surface-card mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-text-tertiary">Prochain palier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-text-primary">
                {nextMilestone.emoji} {nextMilestone.label}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/12 text-success">
                +{nextMilestone.xp} XP
              </span>
            </div>
          </div>
          <div className="relative h-1.5 bg-border-subtle rounded-full overflow-hidden">
            <m.div
              className="absolute h-full rounded-full bg-gradient-to-r from-warning to-warning/70"
              initial={{ width: 0 }}
              animate={{ width: `${nextMilestone.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-text-quaternary mt-1 text-right">
            Encore {nextMilestone.daysRemaining} jour{nextMilestone.daysRemaining > 1 ? 's' : ''}
          </p>
        </div>

        {/* Mini 7-day calendar */}
        <div className="flex gap-2 justify-between">
          {last7Days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-text-quaternary">{day.label}</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  day.isToday ? 'ring-1.5 ring-warning ring-offset-1 ring-offset-bg-base' : ''
                } ${day.isActive ? 'bg-warning/20' : 'bg-surface-card'}`}
              >
                {day.isActive ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-border-subtle" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
