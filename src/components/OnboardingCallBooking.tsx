import { useState, useMemo } from 'react'
import { m } from 'framer-motion'
import { Calendar, Clock, Phone, Loader2, CheckCircle, X } from './icons'
import { Card, Button } from './ui'
import { SectionHeader } from '../pages/settings/SettingsComponents'
import { useOnboardingCall } from '../hooks/useOnboardingCall'

// Available time slots (Paris timezone)
const TIME_SLOTS = ['10:00', '11:00', '14:00', '15:00', '16:00'] as const

/**
 * Generate weekday dates for the next 7 business days from today.
 * Returns an array of { value: 'YYYY-MM-DD', label: 'Lun 3 mars' } objects.
 */
function getNextWeekdays(count: number): { value: string; label: string }[] {
  const days: { value: string; label: string }[] = []
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const monthNames = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ]

  const cursor = new Date()
  cursor.setDate(cursor.getDate() + 1) // Start from tomorrow

  while (days.length < count) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      // weekdays only
      const yyyy = cursor.getFullYear()
      const mm = String(cursor.getMonth() + 1).padStart(2, '0')
      const dd = String(cursor.getDate()).padStart(2, '0')
      days.push({
        value: `${yyyy}-${mm}-${dd}`,
        label: `${dayNames[dow]} ${cursor.getDate()} ${monthNames[cursor.getMonth()]}`,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function formatCallDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function OnboardingCallBooking() {
  const { call, isLoading, bookCall, isBooking, cancelCall, isCancelling } = useOnboardingCall()

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [topic, setTopic] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const weekdays = useMemo(() => getNextWeekdays(7), [])

  const canSubmit = selectedDate && selectedTime && !isBooking

  const handleBook = async () => {
    if (!canSubmit) return
    await bookCall({ date: selectedDate, time: selectedTime, topic: topic.trim() })
  }

  const handleCancel = async () => {
    if (!call) return
    await cancelCall(call.id)
    setShowCancelConfirm(false)
  }

  if (isLoading) {
    return (
      <Card className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
        <SectionHeader icon={Phone} title="Onboarding assisté" />
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm text-text-tertiary">Chargement...</span>
        </div>
      </Card>
    )
  }

  // Already booked — show booking details
  if (call) {
    return (
      <Card className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
        <SectionHeader icon={Phone} title="Onboarding assisté" />

        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-success-5 border border-success/20 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-15 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-md font-semibold text-text-primary">Appel réservé</h3>
              <p className="text-sm text-text-secondary mt-1">
                Tu recevras un email avec le lien de visio avant l'appel.
              </p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <Calendar className="w-4 h-4 text-text-tertiary" />
                  <span>{formatCallDate(call.scheduled_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  <span>{call.scheduled_time} (heure de Paris) — 30 min</span>
                </div>
                {call.topic && (
                  <div className="flex items-start gap-2 text-sm text-text-primary">
                    <Phone className="w-4 h-4 text-text-tertiary mt-0.5" />
                    <span>{call.topic}</span>
                  </div>
                )}
              </div>

              {/* Cancel / Reschedule */}
              <div className="mt-4 flex gap-2">
                {showCancelConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-tertiary">Annuler l'appel ?</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleCancel}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Confirmer'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Non
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-error hover:text-error-hover"
                  >
                    <X className="w-4 h-4" />
                    Annuler l'appel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </m.div>
      </Card>
    )
  }

  // Booking form
  return (
    <Card className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
      <SectionHeader icon={Phone} title="Onboarding assisté" />

      <p className="text-sm text-text-secondary mb-4">
        Réserve un appel de 30 min avec nous pour configurer ta squad parfaitement.
      </p>

      <div className="space-y-4">
        {/* Date picker */}
        <div>
          <label className="flex items-center gap-2 text-base text-text-tertiary mb-2">
            <Calendar className="w-4 h-4" />
            Choisis une date
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {weekdays.map((day) => (
              <button
                key={day.value}
                onClick={() => setSelectedDate(day.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedDate === day.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-card hover:bg-surface-card-hover text-text-primary'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time slot picker */}
        <div>
          <label className="flex items-center gap-2 text-base text-text-tertiary mb-2">
            <Clock className="w-4 h-4" />
            Choisis un créneau (heure de Paris)
          </label>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedTime === slot
                    ? 'bg-primary text-white'
                    : 'bg-surface-card hover:bg-surface-card-hover text-text-primary'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Topic textarea */}
        <div>
          <label className="flex items-center gap-2 text-base text-text-tertiary mb-2">
            <Phone className="w-4 h-4" />
            De quoi veux-tu parler ?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Configuration de ma squad, aide avec les features premium..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary text-sm placeholder:text-text-quaternary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        {/* Submit */}
        <Button onClick={handleBook} disabled={!canSubmit} className="w-full">
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Réservation en cours...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Réserver mon appel de 30 min
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

export default OnboardingCallBooking
