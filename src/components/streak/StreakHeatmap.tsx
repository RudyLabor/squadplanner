
import { useMemo } from 'react'
import { m } from 'framer-motion'
import { colorMix } from '~/utils/colorMix'

interface StreakHeatmapProps {
  streakDays: number
  flameColors: { primary: string; secondary: string; glow: string }
}

export function StreakHeatmap({ streakDays, flameColors }: StreakHeatmapProps) {
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  const { heatmapGrid, weeklyStats } = useMemo(() => {
    const dow = new Date().getDay()
    const normalizedDow = dow === 0 ? 6 : dow - 1
    type Cell = { daysAgo: number; isActive: boolean; isToday: boolean; intensity: number }
    const grid: Cell[][] = []
    const weekTotals = [0, 0, 0, 0]

    for (let week = 0; week < 4; week++) {
      const row: Cell[] = []
      for (let day = 0; day < 7; day++) {
        const daysAgo = (3 - week) * 7 + (normalizedDow - day)
        if (daysAgo < 0) {
          row.push({ daysAgo: -1, isActive: false, isToday: false, intensity: 0 })
          continue
        }
        const isActive = daysAgo < streakDays
        const isToday = daysAgo === 0
        const cellIntensity = !isActive ? 0 : isToday ? 3 : daysAgo <= 2 ? 2 : 1
        row.push({ daysAgo, isActive, isToday, intensity: cellIntensity })
        if (isActive) weekTotals[week]++
      }
      grid.push(row)
    }
    return { heatmapGrid: grid, weeklyStats: weekTotals }
  }, [streakDays])

  return (
    <>
      {/* 28-day Activity Heatmap */}
      <div>
        <p className="text-sm text-text-tertiary mb-2 uppercase tracking-wide">28 derniers jours</p>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map((label, i) => (
            <span key={i} className="text-xs text-text-tertiary text-center font-medium">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {heatmapGrid.map((week, wi) =>
            week.map((cell, di) => {
              if (cell.daysAgo < 0) {
                return <div key={`${wi}-${di}`} className="aspect-square rounded-md" />
              }
              const bgColor =
                cell.intensity === 3
                  ? flameColors.primary
                  : cell.intensity === 2
                    ? colorMix(flameColors.primary, 60)
                    : cell.intensity === 1
                      ? colorMix(flameColors.primary, 25)
                      : 'var(--color-overlay-faint)'
              return (
                <m.div
                  key={`${wi}-${di}`}
                  className={`aspect-square rounded-md ${cell.isToday ? 'ring-2 ring-offset-1 ring-offset-surface-dark' : ''}`}
                  style={{
                    backgroundColor: bgColor,
                    ['--tw-ring-color' as string]: cell.isToday ? flameColors.primary : undefined,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (wi * 7 + di) * 0.015, duration: 0.2 }}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Weekly Activity Bars */}
      <div className="mt-4">
        <p className="text-sm text-text-tertiary mb-2 uppercase tracking-wide">
          4 dernières semaines
        </p>
        <div className="flex items-end gap-2 h-12">
          {weeklyStats.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative h-10 flex items-end">
                <m.div
                  className="w-full rounded-t-md"
                  style={{
                    background: `linear-gradient(to top, ${flameColors.primary}, ${flameColors.secondary})`,
                    opacity: count === 0 ? 0.15 : 1,
                  }}
                  initial={{ height: 0 }}
                  animate={{
                    height: `${Math.max((count / Math.max(...weeklyStats, 1)) * 100, 8)}%`,
                  }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs text-text-tertiary">S{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
