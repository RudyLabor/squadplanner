/**
 * Phase 4.1.3 — Forward Message Modal
 * Select a squad to forward a message to
 */
import { useState, useEffect, memo, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Forward, Search, Users, Check, Loader2 } from './icons'
import { useSquadsStore } from '../hooks/useSquads'
import { useMessagesStore } from '../hooks/useMessages'

interface ForwardMessageModalProps {
  isOpen: boolean
  onClose: () => void
  messageContent: string
  senderUsername: string
}

export const ForwardMessageModal = memo(function ForwardMessageModal({
  isOpen,
  onClose,
  messageContent,
  senderUsername,
}: ForwardMessageModalProps) {
  const { squads, fetchSquads } = useSquadsStore()
  const { sendMessage } = useMessagesStore()
  const [searchQuery, setSearchQuery] = useState('')

  // Ensure squads are loaded when modal opens
  useEffect(() => {
    if (isOpen && squads.length === 0) fetchSquads()
  }, [isOpen, squads.length, fetchSquads])
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const filteredSquads = useMemo(
    () => squads.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [squads, searchQuery]
  )

  const handleForward = async () => {
    if (!selectedSquadId || isSending) return
    setIsSending(true)

    const forwardedContent = `↩️ *Transféré de ${senderUsername}:*\n${messageContent}`

    const { error } = await sendMessage(forwardedContent, selectedSquadId)

    if (!error) {
      setSent(true)
      setTimeout(() => {
        setSent(false)
        setSelectedSquadId(null)
        setSearchQuery('')
        onClose()
      }, 1000)
    }

    setIsSending(false)
  }

  const handleClose = () => {
    setSelectedSquadId(null)
    setSearchQuery('')
    setSent(false)
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
            aria-labelledby="forward-message-title"
            className="w-full max-w-md bg-surface-dark border border-border-hover rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Forward className="w-5 h-5 text-primary-hover" />
                <h2 id="forward-message-title" className="text-lg font-semibold text-text-primary">
                  Transférer le message
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

            {/* Message preview */}
            <div className="mx-5 mt-4 p-3 rounded-xl bg-surface-card border border-border-default">
              <p className="text-sm text-text-quaternary mb-1">De {senderUsername}</p>
              <p className="text-base text-text-secondary line-clamp-3">{messageContent}</p>
            </div>

            {/* Search */}
            <div className="px-5 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une squad..."
                  className="w-full h-10 pl-10 pr-4 bg-border-subtle border border-border-hover rounded-xl text-base text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Squad list */}
            <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-1">
              {filteredSquads.length === 0 ? (
                <p className="text-base text-text-quaternary text-center py-4">
                  Aucune squad trouvée
                </p>
              ) : (
                filteredSquads.map((squad) => (
                  <button
                    key={squad.id}
                    type="button"
                    onClick={() =>
                      setSelectedSquadId(squad.id === selectedSquadId ? null : squad.id)
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      selectedSquadId === squad.id
                        ? 'bg-primary-15 border border-primary'
                        : 'hover:bg-border-subtle border border-transparent'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-15 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary-hover" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-base font-medium text-text-primary truncate">
                        {squad.name}
                      </p>
                      <p className="text-sm text-text-quaternary">{squad.game}</p>
                    </div>
                    {selectedSquadId === squad.id && (
                      <Check className="w-4 h-4 text-primary-hover flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
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
                onClick={handleForward}
                disabled={!selectedSquadId || isSending || sent}
                className="px-5 py-2.5 rounded-xl text-base font-semibold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sent ? (
                  <>
                    <Check className="w-4 h-4" />
                    Envoyé !
                  </>
                ) : isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Forward className="w-4 h-4" />
                    Transférer
                  </>
                )}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
})
