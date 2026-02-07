/**
 * CreateSessionModal - PHASE 3.1
 * Global modal for creating sessions from anywhere in the app
 * Opens directly if user has 1 squad, or shows squad selector if multiple
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Users, Loader2, ChevronDown } from 'lucide-react'
import { create } from 'zustand'
import { useSquadsStore, useSessionsStore } from '../hooks'
import { toast } from 'sonner'

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
      setError(createError.message)
    } else {
      toast.success('Session créée ! Tes potes vont être notifiés.')
      close()
    }
  }

  if (!isOpen) return null

  const selectedSquad = squads.find(s => s.id === selectedSquadId)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 sm:inset-x-auto"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-session-title"
              className="bg-[#0f1012] border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
                <h2 id="create-session-title" className="text-[18px] font-semibold text-[#f7f8f8]">
                  Nouvelle session
                </h2>
                <button
                  onClick={close}
                  className="p-2 rounded-lg text-[#8b8d90] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Squad selector - only if multiple squads */}
                {squads.length > 1 && (
                  <div>
                    <label className="block text-[13px] font-medium text-[#a1a1a6] mb-1.5">
                      Squad
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSquadId}
                        onChange={(e) => setSelectedSquadId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Sélectionner un squad</option>
                        {squads.map((squad) => (
                          <option key={squad.id} value={squad.id}>
                            {squad.name} ({squad.game})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8d90] pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Squad info badge if single squad */}
                {squads.length === 1 && selectedSquad && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)]">
                    <Users className="w-5 h-5 text-[#6366f1]" />
                    <div>
                      <div className="text-[14px] font-medium text-[#f7f8f8]">{selectedSquad.name}</div>
                      <div className="text-[12px] text-[#8b8d90]">{selectedSquad.game}</div>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[13px] font-medium text-[#a1a1a6] mb-1.5">
                    Titre (optionnel)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Session ranked, Détente, Tryhard..."
                    className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#5e6063] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#a1a1a6] mb-1.5">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#a1a1a6] mb-1.5">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Heure
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input"
                    />
                  </div>
                </div>

                {/* Duration & Threshold */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#a1a1a6] mb-1.5">
                      Durée
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input"
                    >
                      <option value="60">1 heure</option>
                      <option value="120">2 heures</option>
                      <option value="180">3 heures</option>
                      <option value="240">4 heures</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#a1a1a6] mb-1">
                      Confirmation automatique
                    </label>
                    <p className="text-[11px] text-[#5e6063] mb-1.5">
                      La session sera confirmée quand ce nombre de joueurs aura répondu "Présent"
                    </p>
                    <select
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input"
                    >
                      <option value="2">2 joueurs</option>
                      <option value="3">3 joueurs</option>
                      <option value="4">4 joueurs</option>
                      <option value="5">5 joueurs</option>
                      <option value="6">6 joueurs</option>
                    </select>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                    <p className="text-[#f87171] text-[13px]">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 px-4 py-3 rounded-xl text-[14px] font-medium text-[#8b8d90] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !selectedSquadId}
                    className="flex-1 px-4 py-3 rounded-xl bg-[#6366f1] text-white text-[14px] font-semibold hover:bg-[#818cf8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Créer la session'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
