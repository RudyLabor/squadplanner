'use client'

import { useState, memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Clock } from './icons'
import { useCustomStatus, STATUS_PRESETS, STATUS_DURATIONS } from '../hooks/useCustomStatus'

interface CustomStatusPickerProps {
  isOpen: boolean
  onClose: () => void
}

export const CustomStatusPicker = memo(function CustomStatusPicker({
  isOpen,
  onClose,
}: CustomStatusPickerProps) {
  const { currentStatus, setStatus, clearStatus, isUpdating } = useCustomStatus()
  const [emoji, setEmoji] = useState(currentStatus?.emoji || '')
  const [text, setText] = useState(currentStatus?.text || '')
  const [duration, setDuration] = useState<number | null>(null)

  const handlePreset = (preset: (typeof STATUS_PRESETS)[number]) => {
    setEmoji(preset.emoji)
    setText(preset.text)
  }

  const handleSave = () => {
    if (!text.trim()) {
      clearStatus()
    } else {
      setStatus({
        statusText: text.trim(),
        statusEmoji: emoji || null,
        durationMinutes: duration,
      })
    }
    onClose()
  }

  const handleClear = () => {
    clearStatus()
    setEmoji('')
    setText('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-bg-elevated border border-border-default rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <h3 className="text-lg font-semibold text-text-primary">Définir un statut</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Input */}
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-bg-surface rounded-xl border border-border-default focus-within:border-primary transition-colors">
                <button
                  onClick={() => setEmoji(emoji ? '' : '😊')}
                  className="text-2xl hover:scale-110 transition-transform"
                  aria-label="Choisir un emoji"
                >
                  {emoji || '😊'}
                </button>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Quel est ton statut ?"
                  maxLength={50}
                  className="flex-1 bg-transparent text-text-primary placeholder-text-quaternary outline-none text-md"
                  autoFocus
                />
                {text && (
                  <button
                    onClick={() => {
                      setText('')
                      setEmoji('')
                    }}
                    className="p-1 rounded text-text-quaternary hover:text-text-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Presets */}
              <div>
                <p className="text-sm text-text-tertiary mb-2">Suggestions</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_PRESETS.map((preset) => (
                    <button
                      key={preset.text}
                      onClick={() => handlePreset(preset)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        text === preset.text
                          ? 'bg-primary-15 border border-primary/30 text-primary'
                          : 'bg-bg-surface border border-border-default text-text-secondary hover:bg-bg-hover'
                      }`}
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-sm text-text-tertiary mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Durée
                </p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_DURATIONS.map((d) => (
                    <button
                      key={d.label}
                      onClick={() => setDuration(d.minutes)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        duration === d.minutes
                          ? 'bg-primary-15 border border-primary/30 text-primary'
                          : 'bg-bg-surface border border-border-default text-text-secondary hover:bg-bg-hover'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-border-default">
              {currentStatus?.isActive && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors"
                >
                  Supprimer le statut
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
})

// Inline status badge for profile/sidebar
export function StatusBadge({
  emoji,
  text,
  className = '',
}: {
  emoji?: string | null
  text?: string | null
  className?: string
}) {
  if (!text) return null

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm text-text-tertiary truncate ${className}`}
    >
      {emoji && <span className="text-base">{emoji}</span>}
      <span className="truncate">{text}</span>
    </span>
  )
}
