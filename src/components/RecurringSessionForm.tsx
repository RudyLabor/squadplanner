/**
 * RecurringSessionForm - Premium feature
 * Form for creating recurring weekly sessions
 * Gated behind squad_leader tier
 */

import { useState } from 'react'
import { Calendar, Clock, Users, RefreshCw, Check } from './icons'
import { Select } from './ui'
import { PremiumGate } from './PremiumGate'
import { showSuccess } from '../lib/toast'
import { useHapticFeedback } from '../hooks'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

interface RecurringSessionFormProps {
  squadId: string
  onCreated: () => void
  onCancel: () => void
}

const DAYS_OF_WEEK = [
  { label: 'L', value: '1' },
  { label: 'M', value: '2' },
  { label: 'M', value: '3' },
  { label: 'J', value: '4' },
  { label: 'V', value: '5' },
  { label: 'S', value: '6' },
  { label: 'D', value: '7' },
]

export function RecurringSessionForm({
  squadId,
  onCreated,
  onCancel,
}: RecurringSessionFormProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [title, setTitle] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [hour, setHour] = useState('20')
  const [minute, setMinute] = useState('00')
  const [duration, setDuration] = useState('120')
  const [threshold, setThreshold] = useState('3')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selectedDays.length === 0) {
      setError('Sélectionne au moins un jour')
      return
    }

    if (!title.trim()) {
      setError('Le titre est requis')
      return
    }

    setIsLoading(true)

    try {
      // Build recurrence rule: "weekly:1,3,5:20:00"
      const daysStr = selectedDays.sort().join(',')
      const timeStr = `${hour}:${minute}`
      const recurrenceRule = `weekly:${daysStr}:${timeStr}`

      // Create session with recurrence rule
      const { error: insertError } = await supabase.from('sessions').insert({
        squad_id: squadId,
        title: title.trim(),
        recurrence_rule: recurrenceRule,
        duration_minutes: parseInt(duration),
        auto_confirm_threshold: parseInt(threshold),
        is_recurring: true,
      })

      if (insertError) {
        throw insertError
      }

      triggerHaptic('success')
      showSuccess('Session récurrente créée ! ✨')
      onCreated()
    } catch (err) {
      triggerHaptic('error')
      const message = err instanceof Error ? err.message : 'Erreur lors de la création'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PremiumGate feature="recurring_sessions">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-base font-medium text-text-secondary mb-1.5">
            Titre
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session ranked, Entraînement, Tryhard..."
            className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-hover text-text-primary placeholder-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/15 transition-input"
          />
        </div>

        {/* Days selector */}
        <div>
          <label className="block text-base font-medium text-text-secondary mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Jours
          </label>
          <div className="flex gap-1.5">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedDays.includes(day.value)
                    ? 'bg-primary text-white'
                    : 'bg-surface-card text-text-secondary hover:bg-border-hover'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time picker */}
        <div>
          <label className="block text-base font-medium text-text-secondary mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Heure
          </label>
          <div className="flex gap-2">
            <Select
              options={Array.from({ length: 24 }, (_, i) => ({
                value: String(i).padStart(2, '0'),
                label: String(i).padStart(2, '0'),
              }))}
              value={hour}
              onChange={(val) => setHour(val as string)}
              placeholder="HH"
            />
            <Select
              options={['00', '15', '30', '45'].map((m) => ({
                value: m,
                label: m,
              }))}
              value={minute}
              onChange={(val) => setMinute(val as string)}
              placeholder="MM"
            />
          </div>
        </div>

        {/* Duration & Threshold */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-base font-medium text-text-secondary mb-1.5">
              Durée
            </label>
            <Select
              options={[
                { value: '60', label: '1h' },
                { value: '90', label: '1h30' },
                { value: '120', label: '2h' },
                { value: '180', label: '3h' },
              ]}
              value={duration}
              onChange={(val) => setDuration(val as string)}
            />
          </div>
          <div>
            <label className="block text-base font-medium text-text-secondary mb-1.5">
              <Users className="w-4 h-4 inline mr-1" />
              Seuil
            </label>
            <Select
              options={[
                { value: '2', label: '2 joueurs' },
                { value: '3', label: '3 joueurs' },
                { value: '4', label: '4 joueurs' },
                { value: '5', label: '5 joueurs' },
                { value: '6', label: '6 joueurs' },
              ]}
              value={threshold}
              onChange={(val) => setThreshold(val as string)}
            />
          </div>
        </div>

        {/* Recurrence info */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <RefreshCw className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            Une session sera créée automatiquement chaque semaine
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-error-10 border border-error">
            <p className="text-error text-base">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl text-md font-medium text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedDays.length === 0}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-md font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Créer la récurrence
              </>
            )}
          </button>
        </div>
      </form>
    </PremiumGate>
  )
}
