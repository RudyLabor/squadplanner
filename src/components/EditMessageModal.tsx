
import { useState, useEffect, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Loader2, Pencil } from './icons'
import { Button } from './ui'
import { useFocusTrap } from '../hooks/useFocusTrap'

export interface EditMessageModalProps {
  isOpen: boolean
  message: { id: string; content: string }
  onSave: (newContent: string) => void
  onClose: () => void
}

/**
 * Modal for editing a message
 * - Shows the original message
 * - Provides a textarea for editing
 * - Save/Cancel buttons
 * - Dark theme styling consistent with app design
 */
export function EditMessageModal({ isOpen, message, onSave, onClose }: EditMessageModalProps) {
  const [content, setContent] = useState(message.content)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus trap for accessibility
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  // Reset content when message changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(message.content)
      // Focus textarea after a brief delay
      setTimeout(() => {
        textareaRef.current?.focus()
        // Move cursor to end
        textareaRef.current?.setSelectionRange(message.content.length, message.content.length)
      }, 100)
    }
  }, [isOpen, message.content])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  const handleSave = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || trimmedContent === message.content) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      await onSave(trimmedContent)
      onClose()
    } catch (error) {
      console.error('Failed to save message:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  const hasChanges = content.trim() !== message.content
  const canSave = content.trim().length > 0 && hasChanges && !isSaving

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <m.div
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-message-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-[15%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="bg-bg-surface border border-border-hover rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-15 flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-primary" />
                  </div>
                  <h2 id="edit-message-title" className="text-xl font-semibold text-text-primary">
                    Modifier le message
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-border-default transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Original message preview */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">
                    Message original
                  </label>
                  <div className="p-3 rounded-xl bg-surface-card border border-border-subtle">
                    <p className="text-base text-text-secondary whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>

                {/* Edit textarea */}
                <div>
                  <label
                    htmlFor="edit-message-content"
                    className="block text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2"
                  >
                    Nouveau contenu
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="edit-message-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tapez votre message..."
                    rows={3}
                    className="w-full px-4 py-3 bg-border-subtle border border-border-hover rounded-xl text-md text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-20 focus:shadow-glow-primary-md transition-input min-h-[80px] max-h-[200px]"
                  />
                  <p className="text-sm text-text-tertiary mt-2">
                    Conseil : Ctrl+Entrée pour sauvegarder rapidement
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-border-default bg-surface-card">
                <span className="text-sm text-text-tertiary">
                  {hasChanges ? '(modifié) sera affiché' : 'Aucune modification'}
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={!canSave}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default EditMessageModal
