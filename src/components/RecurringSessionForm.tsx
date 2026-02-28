/**
 * RecurringSessionForm - Premium feature for Squad Leaders
 * Form for creating recurring weekly gaming sessions
 * Gated behind squad_leader tier
 */

import { useState } from 'react'
import { m } from 'framer-motion'
import { Calendar, Clock, Repeat, Check, X, ChevronDown, Gamepad2, Users } from './icons'
import { Button } from './ui'
import { PremiumGate } from './PremiumGate'
import { showSuccess, showError } from '../lib/toast'
import { useHapticFeedback, useAuthStore } from '../hooks'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

interface RecurringSessionFormProps {
  squadId: string
  squadName?: string
  onCreated?: () => void
  onCancel?: () => void
}

// Popular games list
const POPULAR_GAMES = [
  'Valorant',
  'League of Legends',
  'CS2',
  'Fortnite',
  'Rocket League',
  'Apex Legends',
  'Overwatch 2',
  'Lost Ark',
  'FFXIV',
  'Dota 2',
  'Autre',
]

// Days of week with proper French labels
const DAYS_OF_WEEK = [
  { label: 'Lundi', value: 0 },
  { label: 'Mardi', value: 1 },
  { label: 'Mercredi', value: 2 },
  { label: 'Jeudi', value: 3 },
  { label: 'Vendredi', value: 4 },
  { label: 'Samedi', value: 5 },
  { label: 'Dimanche', value: 6 },
]

// Duration options
const DURATION_OPTIONS = [
  { label: '1h', minutes: 60 },
  { label: '1h30', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
]

/**
 * Compute the next occurrence of a recurring session
 * @param days Array of day numbers (0=Monday, 6=Sunday)
 * @param hour Hour in 24h format
 * @param minute Minute
 * @returns ISO date string for the next occurrence
 */
function computeNextOccurrence(days: number[], hour: number, minute: number): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1 // Convert JS day (0=Sunday) to our format (0=Monday)

  let daysUntilNext = 7 // Default: next week same day
  const sortedDays = days.sort((a, b) => a - b)

  // Find the next occurrence within the sorted days
  for (const dayOfWeek of sortedDays) {
    const daysFromNow = dayOfWeek - currentDayOfWeek
    if (daysFromNow > 0) {
      daysUntilNext = daysFromNow
      break
    }
  }

  // If no future day found today, check if today is in the list and if time has passed
  if (daysUntilNext === 7 && sortedDays.includes(currentDayOfWeek)) {
    const scheduledTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hour,
      minute
    )
    if (scheduledTime > now) {
      daysUntilNext = 0
    }
  }

  const nextOccurrence = new Date(today)
  nextOccurrence.setDate(nextOccurrence.getDate() + daysUntilNext)
  nextOccurrence.setHours(hour, minute, 0, 0)

  return nextOccurrence.toISOString()
}

export function RecurringSessionForm({
  squadId,
  squadName,
  onCreated,
  onCancel,
}: RecurringSessionFormProps) {
  const { triggerHaptic } = useHapticFeedback()
  const { user } = useAuthStore()

  // Form state
  const [title, setTitle] = useState('')
  const [game, setGame] = useState('')
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [timeValue, setTimeValue] = useState('21:00')
  const [duration, setDuration] = useState(120)
  const [minPlayers, setMinPlayers] = useState('2')
  const [maxPlayers, setMaxPlayers] = useState('10')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toggle day selection
  const toggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue]
    )
  }

  // Select game
  const selectGame = (gameName: string) => {
    setGame(gameName)
    setGameDropdownOpen(false)
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Le titre est requis')
      return false
    }

    if (!game) {
      setError('Sélectionne un jeu')
      return false
    }

    if (selectedDays.length === 0) {
      setError('Sélectionne au moins un jour')
      return false
    }

    const minVal = parseInt(minPlayers)
    const maxVal = parseInt(maxPlayers)

    if (isNaN(minVal) || isNaN(maxVal)) {
      setError('Le nombre de joueurs doit être valide')
      return false
    }

    if (minVal < 2 || maxVal < minVal) {
      setError('Minimum 2 joueurs, max >= min')
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      triggerHaptic('error')
      return
    }

    if (!user?.id) {
      setError('Tu dois être connecté')
      triggerHaptic('error')
      return
    }

    setIsLoading(true)

    try {
      // Build recurrence rule: "weekly:0,2,4:21:00"
      const daysStr = selectedDays.sort().join(',')
      const [parsedHour, parsedMinute] = timeValue.split(':')
      const recurrenceRule = `weekly:${daysStr}:${parsedHour}:${parsedMinute}`

      // Compute next occurrence
      const nextOccurrence = computeNextOccurrence(selectedDays, parseInt(parsedHour), parseInt(parsedMinute))

      // Insert into recurring_sessions table
      const { error: insertError } = await supabase.from('recurring_sessions').insert({
        squad_id: squadId,
        created_by: user.id,
        title: title.trim(),
        game,
        recurrence_rule: recurrenceRule,
        duration_minutes: duration,
        min_players: parseInt(minPlayers),
        max_players: parseInt(maxPlayers),
        is_active: true,
        next_occurrence: nextOccurrence,
      })

      if (insertError) {
        throw insertError
      }

      triggerHaptic('success')
      showSuccess(`Session récurrente créée ! 🎮`)

      // Reset form
      setTitle('')
      setGame('')
      setSelectedDays([])
      setTimeValue('21:00')
      setDuration(120)
      setMinPlayers('2')
      setMaxPlayers('10')

      if (onCreated) {
        onCreated()
      }
    } catch (err) {
      triggerHaptic('error')
      const message = err instanceof Error ? err.message : 'Erreur lors de la création'
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PremiumGate feature="recurring_sessions" fallback="blur" squadId={squadId}>
      <m.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        {/* Squad info badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-elevated border border-border-subtle">
          <Gamepad2 className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <div className="text-sm text-text-tertiary">Squad Leader de</div>
            <div className="text-md font-semibold text-text-primary">{squadName}</div>
          </div>
        </div>

        {/* Title input */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ranked Valorant du mardi, Entraînement, Tryhard..."
            className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary placeholder-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Game selector dropdown */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            <Gamepad2 className="w-4 h-4 inline mr-1.5" />
            Jeu
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setGameDropdownOpen(!gameDropdownOpen)}
              className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary flex items-center justify-between hover:border-border-hover transition-colors"
            >
              <span className={game ? 'text-text-primary' : 'text-text-tertiary'}>
                {game || 'Sélectionner un jeu'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-text-tertiary transition-transform ${
                  gameDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {gameDropdownOpen && (
              <m.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-bg-elevated border border-border-subtle shadow-lg z-50"
              >
                <div className="max-h-60 overflow-y-auto">
                  {POPULAR_GAMES.map((gameName) => (
                    <button
                      key={gameName}
                      type="button"
                      onClick={() => selectGame(gameName)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface-card transition-colors border-b border-border-subtle last:border-b-0 ${
                        game === gameName
                          ? 'bg-primary-10 text-primary font-medium'
                          : 'text-text-primary'
                      }`}
                    >
                      {gameName}
                    </button>
                  ))}
                </div>
              </m.div>
            )}
          </div>
        </div>

        {/* Days of week selector */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-3">
            <Calendar className="w-4 h-4 inline mr-1.5" />
            Jours
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map((day) => (
              <m.button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`py-2 px-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedDays.includes(day.value)
                    ? 'bg-primary-bg text-white shadow-md'
                    : 'bg-surface-card text-text-tertiary hover:bg-border-subtle'
                }`}
              >
                {day.label.substring(0, 1)}
              </m.button>
            ))}
          </div>
          {selectedDays.length > 0 && (
            <div className="text-xs text-text-secondary mt-2">
              {selectedDays
                .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
                .join(', ')}
            </div>
          )}
        </div>

        {/* Time picker */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            <Clock className="w-4 h-4 inline mr-1.5" />
            Heure
          </label>
          <input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            <Clock className="w-4 h-4 inline mr-1.5" />
            Durée
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <m.button
                key={opt.minutes}
                type="button"
                onClick={() => setDuration(opt.minutes)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  duration === opt.minutes
                    ? 'bg-primary-bg text-white shadow-md'
                    : 'bg-surface-card text-text-tertiary hover:bg-border-subtle'
                }`}
              >
                {opt.label}
              </m.button>
            ))}
          </div>
        </div>

        {/* Min/Max players */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              <Users className="w-4 h-4 inline mr-1.5" />
              Min
            </label>
            <input
              type="number"
              min="2"
              max="20"
              value={minPlayers}
              onChange={(e) => setMinPlayers(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              <Users className="w-4 h-4 inline mr-1.5" />
              Max
            </label>
            <input
              type="number"
              min="2"
              max="20"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>
        </div>

        {/* Recurrence info badge */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/25"
        >
          <Repeat className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            Une nouvelle session sera créée automatiquement chaque semaine à {timeValue}
          </p>
        </m.div>

        {/* Error message */}
        {error && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 rounded-lg bg-error/10 border border-error/30"
          >
            <p className="text-sm text-error font-medium">{error}</p>
          </m.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="flex-1"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading || selectedDays.length === 0}
            className="flex-1 bg-primary-bg hover:bg-primary-bg-hover text-white"
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
          </Button>
        </div>
      </m.form>
    </PremiumGate>
  )
}

export default RecurringSessionForm
