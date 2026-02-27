import { useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

interface WeeklyData {
  week: number
  count: number
  date: string
}

export default function SessionTrends({ squadId }: { squadId: string }) {
  const [data, setData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(true)
  const [maxValue, setMaxValue] = useState(1)
  const hasFetched = useRef(false)

  useEffect(() => {
    // Guard against re-fetching on re-mount (PremiumGate blur mode)
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchSessionTrends = async () => {
      try {
        setLoading(true)

        // Récupérer les sessions des 12 dernières semaines
        const today = new Date()
        const twelveWeeksAgo = new Date(today.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)

        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, scheduled_at')
          .eq('squad_id', squadId)
          .gte('scheduled_at', twelveWeeksAgo.toISOString())
          .order('scheduled_at', { ascending: true })

        if (sessionsError) {
          console.error('Erreur récupération sessions:', sessionsError)
          setLoading(false)
          return
        }

        // Grouper par semaine
        const weeklyCount: Record<number, number> = {}
        const weeklyDates: Record<number, string> = {}

        sessions?.forEach((session) => {
          const sessionDate = new Date(session.scheduled_at)
          const weekStart = new Date(sessionDate)
          weekStart.setDate(sessionDate.getDate() - sessionDate.getDay())
          const weekNum = Math.floor(
            (sessionDate.getTime() - twelveWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000)
          )

          weeklyCount[weekNum] = (weeklyCount[weekNum] || 0) + 1
          if (!weeklyDates[weekNum]) {
            weeklyDates[weekNum] = weekStart.toLocaleDateString('fr-FR', {
              month: 'short',
              day: 'numeric',
            })
          }
        })

        // Créer le tableau complet avec les semaines manquantes
        const trendData: WeeklyData[] = []
        let maxCount = 1

        for (let i = 0; i < 12; i++) {
          const count = weeklyCount[i] || 0
          const date = weeklyDates[i] || `Sem ${i + 1}`
          trendData.push({
            week: i,
            count,
            date,
          })
          maxCount = Math.max(maxCount, count)
        }

        setData(trendData)
        setMaxValue(maxCount)
      } catch (err) {
        console.error('Erreur trends:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessionTrends()
  }, [squadId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Graphique */}
      <div className="overflow-x-auto">
        <div className="min-w-[500px] space-y-4">
        {/* Axe Y (labels) */}
        <div className="flex gap-4">
          <div className="flex flex-col justify-between text-xs text-text-tertiary font-medium w-8">
            <span>{maxValue}</span>
            <span>{Math.ceil(maxValue / 2)}</span>
            <span>0</span>
          </div>

          {/* Barres du graphique */}
          <div className="flex-1 flex items-end gap-2 h-64 px-2">
            {data.map((item, idx) => {
              const heightPercent = (item.count / maxValue) * 100

              return (
                <m.div
                  key={item.week}
                  className="flex-1 flex flex-col items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {/* Barre avec remplissage graduel */}
                  <m.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: idx * 0.05 + 0.1, duration: 0.4 }}
                    className="w-full bg-gradient-to-t from-primary to-primary-50 rounded-t-lg hover:from-primary-80 transition-all cursor-pointer group relative"
                    title={`Semaine ${item.week + 1}: ${item.count} session${item.count !== 1 ? 's' : ''}`}
                  >
                    {/* Tooltip */}
                    {item.count > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-text-primary bg-surface-card border border-border-subtle rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {item.count}
                      </div>
                    )}
                  </m.div>

                  {/* Label semaine */}
                  <span className="text-xs text-text-tertiary mt-1 text-center">{item.date}</span>
                </m.div>
              )
            })}
          </div>
        </div>

        {/* Ligne de base */}
        <div className="flex gap-4">
          <div className="w-8" />
          <div className="flex-1 border-t border-border-subtle" />
        </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-border-subtle">
        <div className="bg-surface-card rounded-lg p-3 text-center border border-border-subtle">
          <div className="text-xs text-text-tertiary mb-1">Total</div>
          <div className="text-lg font-bold text-primary">
            {data.reduce((sum, d) => sum + d.count, 0)}
          </div>
        </div>
        <div className="bg-surface-card rounded-lg p-3 text-center border border-border-subtle">
          <div className="text-xs text-text-tertiary mb-1">Moyenne</div>
          <div className="text-lg font-bold text-primary">
            {Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length)}
          </div>
        </div>
        <div className="bg-surface-card rounded-lg p-3 text-center border border-border-subtle">
          <div className="text-xs text-text-tertiary mb-1">Pic</div>
          <div className="text-lg font-bold text-primary">
            {Math.max(...data.map((d) => d.count))}
          </div>
        </div>
      </div>
    </div>
  )
}
