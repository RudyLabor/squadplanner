/**
 * Phase 4.1.2 — Create Poll Modal
 * Create a new poll with question + options
 */
import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, BarChart3 } from 'lucide-react'

interface CreatePollModalProps {
  isOpen: boolean
  onClose: () => void
  onCreatePoll: (question: string, options: string[]) => void
}

export const CreatePollModal = memo(function CreatePollModal({ isOpen, onClose, onCreatePoll }: CreatePollModalProps) {
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

  const isValid = question.trim().length > 0 && options.filter(o => o.trim()).length >= 2

  const handleSubmit = () => {
    if (!isValid) return
    onCreatePoll(question.trim(), options.filter(o => o.trim()))
    // Reset
    setQuestion('')
    setOptions(['', ''])
    onClose()
  }

  const handleClose = () => {
    setQuestion('')
    setOptions(['', ''])
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface-dark border border-border-hover rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-hover" />
                <h2 className="text-[16px] font-semibold text-text-primary">Creer un sondage</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-border-subtle text-text-tertiary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Question */}
              <div>
                <label className="text-[13px] text-text-tertiary font-medium mb-2 block">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pose ta question..."
                  className="w-full h-12 px-4 bg-border-subtle border border-border-hover rounded-xl text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
                  maxLength={200}
                  autoFocus
                />
              </div>

              {/* Options */}
              <div>
                <label className="text-[13px] text-text-tertiary font-medium mb-2 block">Options</label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-[12px] text-text-quaternary font-medium w-5 text-center flex-shrink-0">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 h-10 px-3 bg-border-subtle border border-border-hover rounded-lg text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
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
                    className="mt-2 flex items-center gap-1.5 text-[13px] text-primary-hover hover:text-primary-hover transition-colors"
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
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-text-tertiary hover:bg-border-subtle transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Creer le sondage
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
