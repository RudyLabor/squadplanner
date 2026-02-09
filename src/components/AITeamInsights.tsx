import { memo, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, AlertTriangle, TrendingDown, Heart, Lightbulb, Shield } from 'lucide-react'
import { useAIStore } from '../hooks/useAI'

interface Props {
  squadId: string
}

const TEAM_BUILDING_TIPS = [
  'Organisez une session detendue sans objectif de performance — juste pour le fun.',
  'Essayez un nouveau jeu ensemble pour casser la routine.',
  'Faites une session plus courte (1h) pour ceux qui ont moins de temps.',
  'Proposez un horaire different — certains membres sont peut-etre plus dispo le week-end.',
  'Felicitez publiquement les joueurs les plus fiables dans le chat.',
]

export const AITeamInsights = memo(function AITeamInsights({ squadId }: Props) {
  const { reliabilityReport, fetchReliabilityReport } = useAIStore()

  useEffect(() => {
    if (squadId) {
      fetchReliabilityReport(squadId)
    }
  }, [squadId, fetchReliabilityReport])

  const insights = useMemo(() => {
    if (!reliabilityReport) return null

    const decliningPlayers = reliabilityReport.players.filter(p => p.trend === 'declining')
    const noshowPlayers = reliabilityReport.players.filter(p => p.stats.noshow_count >= 3)
    const avgReliability = reliabilityReport.avg_reliability
    const isHealthy = avgReliability >= 80 && decliningPlayers.length === 0

    return {
      decliningPlayers,
      noshowPlayers,
      avgReliability,
      isHealthy,
      randomTip: TEAM_BUILDING_TIPS[Math.floor(Math.random() * TEAM_BUILDING_TIPS.length)],
    }
  }, [reliabilityReport])

  if (!insights) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-surface-card p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Users className="w-4.5 h-4.5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-text-primary">Sante de l'equipe</h3>
      </div>

      {/* Health indicator */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          insights.isHealthy ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}>
          {insights.isHealthy ? (
            <Heart className="w-5 h-5 text-emerald-400" />
          ) : (
            <Shield className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            Fiabilite moyenne : {Math.round(insights.avgReliability)}%
          </p>
          <p className="text-xs text-text-tertiary">
            {insights.isHealthy
              ? 'Votre equipe est en pleine forme !'
              : 'Quelques points d\'attention a surveiller'}
          </p>
        </div>
      </div>

      {/* Conflict resolution: declining players */}
      {insights.decliningPlayers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-xs font-medium text-amber-400">Joueurs en baisse</p>
          </div>
          {insights.decliningPlayers.map(player => (
            <div key={player.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-amber-400">
                    {player.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-text-primary">{player.username}</span>
              </div>
              <span className="text-xs text-amber-400">{Math.round(player.reliability_score)}%</span>
            </div>
          ))}
          <p className="text-xs text-text-tertiary pl-5">
            Essayez de leur envoyer un message pour comprendre leurs contraintes.
          </p>
        </div>
      )}

      {/* No-show alert */}
      {insights.noshowPlayers.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-rose-400">Absences repetees</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {insights.noshowPlayers.map(p => p.username).join(', ')} {insights.noshowPlayers.length === 1 ? 'a' : 'ont'} 3+ absences.
              Ajustez les horaires ou discutez-en en prive.
            </p>
          </div>
        </div>
      )}

      {/* Team building tip */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
        <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-indigo-400">Conseil team building</p>
          <p className="text-xs text-text-secondary mt-0.5">{insights.randomTip}</p>
        </div>
      </div>
    </motion.div>
  )
})
