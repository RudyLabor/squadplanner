import { memo, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { useAIStore } from '../hooks/useAI'

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const HOURS = [18, 19, 20, 21, 22, 23]

interface Props {
  squadId: string
  onSelectSlot?: (dayOfWeek: number, hour: number) => void
}

function getHeatColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/40 text-emerald-300'
  if (score >= 60) return 'bg-emerald-500/20 text-emerald-400/80'
  if (score >= 40) return 'bg-amber-500/15 text-amber-400/70'
  if (score > 0) return 'bg-rose-500/10 text-rose-400/60'
  return 'bg-white/3 text-text-tertiary/50'
}

export const AICrossAvailability = memo(function AICrossAvailability({ squadId, onSelectSlot }: Props) {
  const { slotSuggestions, hasSlotHistory, fetchSlotSuggestions } = useAIStore()

  useEffect(() => {
    if (squadId) {
      fetchSlotSuggestions(squadId)
    }
  }, [squadId, fetchSlotSuggestions])

  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {}

    for (const slot of slotSuggestions) {
      const key = `${slot.day_of_week}-${slot.hour}`
      data[key] = slot.reliability_score
    }

    return data
  }, [slotSuggestions])

  if (!hasSlotHistory || slotSuggestions.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-surface-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="w-4.5 h-4.5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-text-primary">Creneaux optimaux</h3>
      </div>

      <p className="text-xs text-text-tertiary mb-3">
        Base sur l'historique de ta squad. Plus c'est vert, plus la presence est elevee.
      </p>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Header row */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="text-xs text-text-tertiary" />
            {DAYS.map(day => (
              <div key={day} className="text-xs text-text-tertiary text-center font-medium">{day}</div>
            ))}
          </div>

          {/* Data rows */}
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-xs text-text-tertiary flex items-center justify-end pr-1">{hour}h</div>
              {DAYS.map((_, dayIdx) => {
                const key = `${dayIdx}-${hour}`
                const score = heatmapData[key] || 0
                const colorClass = getHeatColor(score)

                return (
                  <button
                    key={key}
                    onClick={() => onSelectSlot?.(dayIdx, hour)}
                    className={`h-7 rounded text-xs font-medium transition-all hover:ring-1 hover:ring-indigo-500/50 ${colorClass}`}
                    title={score > 0 ? `${score}% de presence` : 'Pas de donnees'}
                  >
                    {score > 0 ? `${score}%` : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
        <span className="text-xs text-text-tertiary">Legende :</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500/40" />
          <span className="text-xs text-text-tertiary">80%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500/20" />
          <span className="text-xs text-text-tertiary">60%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/15" />
          <span className="text-xs text-text-tertiary">40%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-rose-500/10" />
          <span className="text-xs text-text-tertiary">&lt;40%</span>
        </div>
      </div>
    </motion.div>
  )
})
