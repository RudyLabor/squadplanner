import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { X, Calendar, Clock } from '../../components/icons'
import { Button, Select } from '../../components/ui'
import { useUpdateSessionMutation } from '../../hooks/queries'

interface EditSessionModalProps {
  sessionId: string
  initialTitle: string
  initialScheduledAt: string
  initialDuration: number
  onClose: () => void
}

export function EditSessionModal({
  sessionId,
  initialTitle,
  initialScheduledAt,
  initialDuration,
  onClose,
}: EditSessionModalProps) {
  const initialDate = new Date(initialScheduledAt)
  const [title, setTitle] = useState(initialTitle)
  const [date, setDate] = useState(initialDate.toISOString().split('T')[0])
  const [time, setTime] = useState(
    `${String(initialDate.getHours()).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}`
  )
  const [duration, setDuration] = useState(String(initialDuration))
  const [error, setError] = useState<string | null>(null)
  const updateMutation = useUpdateSessionMutation()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!date || !time) {
      setError('Date et heure requises')
      return
    }

    const scheduledAt = new Date(`${date}T${time}`)
    if (scheduledAt < new Date()) {
      setError('La date doit être dans le futur')
      return
    }

    try {
      await updateMutation.mutateAsync({
        sessionId,
        title: title.trim() || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(duration),
      })
      onClose()
    } catch {
      setError('Erreur lors de la modification')
    }
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <m.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-session-title"
        className="w-full max-w-md rounded-2xl bg-bg-elevated border border-border-subtle p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="edit-session-title" className="text-lg font-bold text-text-primary">
            Modifier la session
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session ranked, Détente, Tryhard..."
              className="w-full h-11 px-4 rounded-xl bg-bg-surface border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-11 px-4 rounded-xl bg-bg-surface border border-border-default text-md text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              <Clock className="w-4 h-4 inline mr-1" />
              Heure
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-bg-surface border border-border-default text-md text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Durée</label>
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

          {error && (
            <div className="p-3 rounded-lg bg-error-10 border border-error">
              <p className="text-error text-base">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </m.div>
    </m.div>
  )
}
