
/**
 * Phase 4.1.2 — Create Poll Modal
 * Create a new poll with question + options
 */
import { useState, memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, BarChart3, Loader2 } from './icons'
interface CreatePollModalProps {
  isOpen: boolean
  onClose: () => void
  onCreatePoll: (question: string, options: string[]) => void
}

export const CreatePollModal = memo(function CreatePollModal({
  isOpen,
  onClose,
  onCreatePoll,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const handleAddOption = () => {
    if (options.length >= 6) return
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const isValid = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onCreatePoll(
        question.trim(),
        options.filter((o) => o.trim())
      )
      // Reset
      setQuestion('')
      setOptions(['', ''])
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setQuestion('')
    setOptions(['', ''])
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
          onClick={handleClose}
        >
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-poll-title"
            className="w-full max-w-md bg-surface-dark border border-border-hover rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-hover" />
                <h2 id="create-poll-title" className="text-lg font-semibold text-text-primary">
                  Créer un sondage
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-border-subtle text-text-tertiary transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Question */}
              <div>
                <label className="text-base text-text-tertiary font-medium mb-2 block">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pose ta question..."
                  className="w-full h-12 px-4 bg-border-subtle border border-border-hover rounded-xl text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
                  maxLength={200}
                  autoFocus
                />
              </div>

              {/* Options */}
              <div>
                <label className="text-base text-text-tertiary font-medium mb-2 block">
                  Options
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-text-quaternary font-medium w-5 text-center flex-shrink-0">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 h-10 px-3 bg-border-subtle border border-border-hover rounded-lg text-base text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
                        maxLength={100}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-1.5 rounded-lg text-text-quaternary hover:text-red-400 hover:bg-error-10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2 flex items-center gap-1.5 text-base text-primary-hover hover:text-primary-hover transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter une option
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border-default">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-base font-medium text-text-tertiary hover:bg-border-subtle transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="px-5 py-2.5 rounded-xl text-base font-semibold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer le sondage'}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
})
