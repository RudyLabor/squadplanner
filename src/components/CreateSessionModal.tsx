"use client";

/**
 * CreateSessionModal - PHASE 3.1
 * Global modal for creating sessions from anywhere in the app
 * Opens directly if user has 1 squad, or shows squad selector if multiple
 */

import { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Users,
  Loader2,
} from './icons'
import { create } from 'zustand'
import { ResponsiveModal, Select } from './ui'
import { useSquadsStore, useSessionsStore, useHapticFeedback } from '../hooks'
import { showSuccess } from '../lib/toast'

// Store for managing the modal state globally
interface CreateSessionModalStore {
  isOpen: boolean
  preselectedSquadId: string | null
  open: (squadId?: string) => void
  close: () => void
}

export const useCreateSessionModal = create<CreateSessionModalStore>((set) => ({
  isOpen: false,
  preselectedSquadId: null,
  open: (squadId?: string) => set({ isOpen: true, preselectedSquadId: squadId || null }),
  close: () => set({ isOpen: false, preselectedSquadId: null }),
}))

export function CreateSessionModal() {
  const { isOpen, preselectedSquadId, close } = useCreateSessionModal()
  const { squads } = useSquadsStore()
  const { createSession, isLoading } = useSessionsStore()
  const { triggerHaptic } = useHapticFeedback()

  // Form state
  const [selectedSquadId, setSelectedSquadId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('120')
  const [threshold, setThreshold] = useState('3')
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setTitle('')
      setDate('')
      setTime('')
      setDuration('120')
      setThreshold('3')

      // Auto-select squad if only one or preselected
      if (preselectedSquadId) {
        setSelectedSquadId(preselectedSquadId)
      } else if (squads.length === 1) {
        setSelectedSquadId(squads[0].id)
      } else {
        setSelectedSquadId('')
      }
    }
  }, [isOpen, preselectedSquadId, squads])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedSquadId) {
      setError('Sélectionne un squad')
      return
    }

    if (!date || !time) {
      setError('Date et heure requises')
      return
    }

    const scheduledAt = new Date(`${date}T${time}`)
    if (scheduledAt < new Date()) {
      setError('La date doit être dans le futur')
      return
    }

    const { error: createError } = await createSession({
      squad_id: selectedSquadId,
      title: title || undefined,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: parseInt(duration),
      auto_confirm_threshold: parseInt(threshold),
    })

    if (createError) {
      triggerHaptic('error')
      setError(createError.message)
    } else {
      triggerHaptic('success')
      showSuccess('Session créée ! Tes potes vont être notifiés.')
      close()
    }
  }

  const selectedSquad = squads.find(s => s.id === selectedSquadId)

  return (
    <ResponsiveModal open={isOpen} onClose={close} title="Nouvelle session" size="sm">
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Squad selector - only if multiple squads */}
        {squads.length > 1 && (
          <div>
            <label className="block text-base font-medium text-text-secondary mb-1.5">
              Squad
            </label>
            <Select
                options={squads.map((squad) => ({
                  value: squad.id,
                  label: `${squad.name} (${squad.game})`,
                }))}
                value={selectedSquadId}
                onChange={(val) => setSelectedSquadId(val as string)}
                placeholder="Sélectionner un squad"
              />
          </div>
        )}

        {/* Squad info badge if single squad */}
        {squads.length === 1 && selectedSquad && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-10 border border-primary">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <div className="text-md font-medium text-text-primary">{selectedSquad.name}</div>
              <div className="text-sm text-text-secondary">{selectedSquad.game}</div>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-base font-medium text-text-secondary mb-1.5">
            Titre (optionnel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session ranked, Détente, Tryhard..."
            className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-hover text-text-primary placeholder-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/15 transition-input"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-base font-medium text-text-secondary mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-hover text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/15 transition-input"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-text-secondary mb-1.5">
              <Clock className="w-4 h-4 inline mr-1" />
              Heure
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-hover text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/15 transition-input"
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
                { value: '60', label: '1 heure' },
                { value: '120', label: '2 heures' },
                { value: '180', label: '3 heures' },
                { value: '240', label: '4 heures' },
              ]}
              value={duration}
              onChange={(val) => setDuration(val as string)}
            />
          </div>
          <div>
            <label className="block text-base font-medium text-text-secondary mb-1">
              Confirmation automatique
            </label>
            <p className="text-sm text-text-tertiary mb-1.5">
              La session sera confirmée quand ce nombre de joueurs aura répondu "Présent"
            </p>
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
            onClick={close}
            className="flex-1 px-4 py-3 rounded-xl text-md font-medium text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || !selectedSquadId}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-md font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Créer la session'
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  )
}
