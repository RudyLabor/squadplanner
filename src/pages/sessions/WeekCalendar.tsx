
import { useMemo } from 'react'
import { m } from 'framer-motion'
import { ChevronLeft, ChevronRight } from '../../components/icons'

interface WeekCalendarProps {
  sessions: Array<{
    id: string
    scheduled_at: string
    title?: string | null
    my_rsvp?: 'present' | 'absent' | 'maybe' | null
  }>
  weekOffset?: number
  onWeekChange?: (offset: number) => void
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = [
  'jan',
  'fév',
  'mar',
  'avr',
  'mai',
  'juin',
  'juil',
  'août',
  'sep',
  'oct',
  'nov',
  'déc',
]

function getWeekDays(offset: number): Date[] {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Monday = 0, Sunday = 6
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function WeekCalendar({ sessions, weekOffset = 0, onWeekChange }: WeekCalendarProps) {
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const today = useMemo(() => new Date(), [])

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, typeof sessions>()
    for (const session of sessions) {
      const date = new Date(session.scheduled_at)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(session)
    }
    return map
  }, [sessions])

  const weekLabel = useMemo(() => {
    const start = days[0]
    const end = days[6]
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${MONTHS_FR[start.getMonth()]} ${start.getFullYear()}`
    }
    return `${start.getDate()} ${MONTHS_FR[start.getMonth()]} - ${end.getDate()} ${MONTHS_FR[end.getMonth()]}`
  }, [days])

  return (
    <section aria-label="Calendrier de la semaine" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary">Cette semaine</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onWeekChange?.(weekOffset - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover transition-colors"
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="w-4 h-4 text-text-tertiary" />
          </button>
          <span className="text-sm text-text-secondary min-w-[140px] text-center">{weekLabel}</span>
          <button
            onClick={() => onWeekChange?.(weekOffset + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover transition-colors"
            aria-label="Semaine suivante"
          >
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
          const daySessions = sessionsByDay.get(key) || []
          const isToday = isSameDay(day, today)
          const isPast = day < today && !isToday

          return (
            <m.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className={`flex flex-col items-center p-2 rounded-xl border transition-colors ${
                isToday
                  ? 'border-primary/30 bg-primary/5'
                  : daySessions.length > 0
                    ? 'border-border-hover bg-surface-card'
                    : 'border-transparent'
              } ${isPast ? 'opacity-50' : ''}`}
            >
              <span
                className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-text-tertiary'}`}
              >
                {DAYS_FR[i]}
              </span>
              <span
                className={`text-lg font-bold leading-none mb-1 ${
                  isToday ? 'text-primary' : 'text-text-primary'
                }`}
              >
                {day.getDate()}
              </span>
              <div className="flex gap-0.5 mt-0.5 min-h-[8px]">
                {daySessions.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      s.my_rsvp === 'present'
                        ? 'bg-success'
                        : s.my_rsvp === 'absent'
                          ? 'bg-error'
                          : s.my_rsvp === 'maybe'
                            ? 'bg-warning'
                            : 'bg-primary'
                    }`}
                    title={s.title || 'Session'}
                  />
                ))}
                {daySessions.length > 3 && (
                  <span className="text-xs text-text-quaternary leading-none">
                    +{daySessions.length - 3}
                  </span>
                )}
              </div>
            </m.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-text-quaternary">En attente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-text-quaternary">Confirmée</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-xs text-text-quaternary">Peut-être</span>
        </div>
      </div>
    </section>
  )
}
