import { useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { Clock, Star } from '../icons'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

interface BestSlot {
  day: number
  hour: number
  score: number
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function BestSlotsCard({ squadId }: { squadId: string }) {
  const [bestSlots, setBestSlots] = useState<BestSlot[]>([])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    // Guard against re-fetching on re-mount (PremiumGate blur mode)
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchBestSlots = async () => {
      try {
        setLoading(true)

        // Récupérer les sessions avec RSVPs pour calculer les meilleurs créneaux
        const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000)

        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, scheduled_at')
          .eq('squad_id', squadId)
          .gte('scheduled_at', twelveWeeksAgo.toISOString())

        if (sessionsError) {
          console.error('Erreur récupération sessions best slots:', sessionsError)
          setLoading(false)
          return
        }

        if (!sessions || sessions.length === 0) {
          setBestSlots([])
          setLoading(false)
          return
        }

        // Récupérer les RSVPs "present" pour ces sessions
        const sessionIds = sessions.map((s) => s.id)
        const { data: rsvps, error: rsvpsError } = await supabase
          .from('session_rsvps')
          .select('session_id')
          .in('session_id', sessionIds)
          .eq('response', 'present')

        if (rsvpsError) {
          console.error('Erreur récupération RSVPs best slots:', rsvpsError)
          setLoading(false)
          return
        }

        // Compter les présences par créneau (jour + heure)
        const rsvpCountBySession = new Map<string, number>()
        rsvps?.forEach((r) => {
          rsvpCountBySession.set(r.session_id, (rsvpCountBySession.get(r.session_id) || 0) + 1)
        })

        const slotScores = new Map<string, number>()
        sessions.forEach((session) => {
          const date = new Date(session.scheduled_at)
          const day = date.getDay()
          const hour = date.getHours()
          const key = `${day}-${hour}`
          const rsvpCount = rsvpCountBySession.get(session.id) || 0
          slotScores.set(key, (slotScores.get(key) || 0) + rsvpCount)
        })

        // Convertir en tableau et trier par score
        const slots: BestSlot[] = []
        slotScores.forEach((score, key) => {
          const [day, hour] = key.split('-').map(Number)
          if (score > 0) {
            slots.push({ day, hour, score })
          }
        })

        const sorted = slots.sort((a, b) => b.score - a.score).slice(0, 3)
        setBestSlots(sorted)
      } catch (err) {
        console.error('Erreur best slots:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBestSlots()
  }, [squadId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (bestSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-text-tertiary space-y-2">
        <Clock className="w-8 h-8" />
        <p>Pas assez de données pour déterminer les meilleurs créneaux</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bestSlots.map((slot, idx) => {
        const dayName = DAYS_FR[slot.day] || 'Unknown'
        const timeStr = `${slot.hour}h`
        const rank = idx + 1

        return (
          <m.div
            key={`${slot.day}-${slot.hour}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative overflow-hidden rounded-xl border border-border-subtle bg-gradient-to-r from-primary-10 to-transparent p-4"
          >
            {/* Rang badge */}
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-primary-15 border border-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{rank}</span>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-primary-20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-text-primary">{dayName}</h3>
                  <span className="text-base font-bold text-primary">{timeStr}</span>
                </div>
                <p className="text-sm text-text-secondary">Score : {slot.score} points</p>
              </div>

              {/* Star icon pour le top 1 */}
              {rank === 1 && (
                <m.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="flex-shrink-0"
                >
                  <Star className="w-5 h-5 text-warning fill-warning" />
                </m.div>
              )}
            </div>

            {/* Progress bar pour le score */}
            <div className="mt-3 h-1.5 bg-surface-card rounded-full overflow-hidden">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((slot.score / 100) * 100, 100)}%` }}
                transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                className="h-full bg-gradient-to-r from-primary to-primary-80 rounded-full"
              />
            </div>
          </m.div>
        )
      })}

      {/* Conseil */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-3 rounded-lg bg-primary-10 border border-primary-20 text-sm text-text-secondary"
      >
        <p>💡 Planifie tes sessions aux meilleurs créneaux pour maximiser la participation !</p>
      </m.div>
    </div>
  )
}
