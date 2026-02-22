import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

interface AttendanceData {
  day: number
  hour: number
  count: number
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const HOURS = Array.from({ length: 10 }, (_, i) => i + 14) // 14h - 23h

// Fonction pour obtenir la couleur en fonction de l'intensité
const getHeatmapColor = (value: number, maxValue: number): string => {
  const ratio = value / maxValue

  if (ratio === 0) return 'bg-surface-card'
  if (ratio < 0.25) return 'bg-blue-900'
  if (ratio < 0.5) return 'bg-blue-700'
  if (ratio < 0.75) return 'bg-blue-500'
  return 'bg-blue-400'
}

export default function AttendanceHeatmap({ squadId }: { squadId: string }) {
  const [data, setData] = useState<AttendanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [maxValue, setMaxValue] = useState(1)

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true)

        // Récupérer les sessions du squad avec les RSVPs
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, scheduled_at')
          .eq('squad_id', squadId)
          .gte('scheduled_at', new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString())

        if (sessionsError) {
          console.error('Erreur récupération sessions:', sessionsError)
          setLoading(false)
          return
        }

        if (!sessions || sessions.length === 0) {
          setData([])
          setLoading(false)
          return
        }

        const sessionIds = sessions.map((s) => s.id)

        // Récupérer les RSVPs
        const { data: rsvps, error: rsvpsError } = await supabase
          .from('session_rsvps')
          .select('session_id, response')
          .in('session_id', sessionIds)
          .eq('response', 'present')

        if (rsvpsError) {
          console.error('Erreur récupération RSVPs:', rsvpsError)
          setLoading(false)
          return
        }

        // Construire la matrice heatmap
        const heatmapData: AttendanceData[] = []
        const sessionMap = new Map<string, { id: string; scheduled_at: string }>(
          sessions.map((s: any) => [s.id, s])
        )
        const rsvpMap = new Map<string, number>()

        // Compter les présences par session
        rsvps?.forEach((rsvp) => {
          const count = rsvpMap.get(rsvp.session_id) || 0
          rsvpMap.set(rsvp.session_id, count + 1)
        })

        // Créer les données de heatmap
        const attendanceByDayHour: Record<string, number> = {}
        rsvpMap.forEach((count, sessionId) => {
          const session = sessionMap.get(sessionId)
          if (session) {
            const date = new Date(session.scheduled_at)
            const day = date.getDay()
            const hour = date.getHours()
            const key = `${day}-${hour}`
            attendanceByDayHour[key] = (attendanceByDayHour[key] || 0) + count
          }
        })

        // Convertir en array pour le rendu
        let maxAttendance = 1
        DAYS_FR.forEach((_, dayIdx) => {
          HOURS.forEach((hour) => {
            const key = `${dayIdx}-${hour}`
            const count = attendanceByDayHour[key] || 0
            heatmapData.push({
              day: dayIdx,
              hour,
              count,
            })
            maxAttendance = Math.max(maxAttendance, count)
          })
        })

        setData(heatmapData)
        setMaxValue(maxAttendance)
      } catch (err) {
        console.error('Erreur heatmap:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [squadId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-text-tertiary">
        <p>Pas assez de données pour afficher la heatmap</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max space-y-2">
          {/* En-têtes des heures */}
          <div className="flex gap-1">
            <div className="w-24" /> {/* Espace pour les labels de jours */}
            {HOURS.map((hour) => (
              <div key={hour} className="w-12 text-center text-xs text-text-tertiary font-medium">
                {hour}h
              </div>
            ))}
          </div>

          {/* Grille */}
          {DAYS_FR.map((day, dayIdx) => (
            <div key={dayIdx} className="flex gap-1">
              <div className="w-24 text-sm font-medium text-text-secondary flex items-center">
                {day}
              </div>
              {HOURS.map((hour) => {
                const cellData = data.find((d) => d.day === dayIdx && d.hour === hour)
                const count = cellData?.count || 0
                const color = getHeatmapColor(count, maxValue)

                return (
                  <m.div
                    key={`${dayIdx}-${hour}`}
                    whileHover={{ scale: 1.1 }}
                    className={`w-12 h-12 rounded-lg ${color} border border-border-subtle cursor-pointer transition-all flex items-center justify-center text-xs font-semibold ${count > 0 ? 'text-white' : 'text-text-tertiary'}`}
                    title={`${day} ${hour}h: ${count} présent${count > 1 ? 's' : ''}`}
                  >
                    {count > 0 && count}
                  </m.div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border-subtle">
        <span className="text-xs text-text-secondary font-medium">Légende:</span>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-surface-card border border-border-subtle" />
            <span className="text-xs text-text-tertiary">0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-900" />
            <span className="text-xs text-text-tertiary">Faible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-xs text-text-tertiary">Moyen</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-400" />
            <span className="text-xs text-text-tertiary">Haut</span>
          </div>
        </div>
      </div>
    </div>
  )
}
