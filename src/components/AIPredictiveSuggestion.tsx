import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CalendarPlus, TrendingUp } from 'lucide-react'
import { useAIPredictionsQuery } from '../hooks/queries'

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface Props {
  squadId: string | undefined
  onCreateSession?: (dayOfWeek: number, hour: number) => void
}

export const AIPredictiveSuggestion = memo(function AIPredictiveSuggestion({ squadId, onCreateSession }: Props) {
  const { data: predictions, isLoading } = useAIPredictionsQuery(squadId)

  const topPrediction = useMemo(() => {
    if (!predictions || predictions.length === 0) return null
    return predictions[0]
  }, [predictions])

  if (isLoading || !topPrediction) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-indigo-400 mb-1">Suggestion IA</p>
          <p className="text-sm text-text-primary leading-relaxed">
            Ta squad joue souvent le <span className="font-semibold text-indigo-300">{DAY_NAMES_FULL[topPrediction.day_of_week]}</span> a <span className="font-semibold text-indigo-300">{topPrediction.hour}h</span>.
            {topPrediction.session_count >= 3 && (
              <span className="text-text-secondary"> ({topPrediction.session_count} sessions, {Math.round(topPrediction.avg_attendance)}% de presence)</span>
            )}
          </p>

          {predictions && predictions.length > 1 && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {predictions.slice(0, 3).map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/5 text-text-secondary">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  {DAY_NAMES[p.day_of_week]} {p.hour}h
                </span>
              ))}
            </div>
          )}

          {onCreateSession && (
            <button
              onClick={() => onCreateSession(topPrediction.day_of_week, topPrediction.hour)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Proposer une session
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
})
