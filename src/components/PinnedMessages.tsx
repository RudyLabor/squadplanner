import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, ChevronDown, X } from 'lucide-react'

export interface PinnedMessage {
  pin_id: string
  message_id: string
  message_content: string
  message_sender_id: string
  message_sender_username: string
  message_created_at: string
  pinned_by_id: string
  pinned_by_username: string
  pinned_at: string
}

interface PinnedMessagesProps {
  pinnedMessages: PinnedMessage[]
  currentUserId: string
  isAdmin: boolean
  onUnpin: (messageId: string) => void
  onScrollToMessage: (messageId: string) => void
}

// Format relative time for pinned date
function formatPinnedDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'A l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Truncate message content for preview
function truncateMessage(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength).trim() + '...'
}

export function PinnedMessages({
  pinnedMessages,
  currentUserId: _currentUserId,
  isAdmin,
  onUnpin,
  onScrollToMessage,
}: PinnedMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't render if no pinned messages
  if (pinnedMessages.length === 0) {
    return null
  }

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  return (
    <div className="border-b border-[rgba(255,255,255,0.06)]">
      {/* Collapsed header - always visible */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
        aria-expanded={isExpanded}
        aria-controls="pinned-messages-list"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(245,166,35,0.15)] flex items-center justify-center">
            <Pin className="w-4 h-4 text-[#f5a623]" />
          </div>
          <span className="text-[14px] font-medium text-[#f7f8f8]">
            {pinnedMessages.length} message{pinnedMessages.length > 1 ? 's' : ''} epingle{pinnedMessages.length > 1 ? 's' : ''}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-[#5e6063]" />
        </motion.div>
      </button>

      {/* Expanded list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="pinned-messages-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {pinnedMessages.map((pinned, index) => (
                <motion.div
                  key={pinned.pin_id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="group relative bg-[#18191b] rounded-xl border border-[rgba(255,255,255,0.04)] hover:border-[rgba(245,166,35,0.2)] transition-all"
                >
                  {/* Clickable area to scroll to message */}
                  <button
                    onClick={() => onScrollToMessage(pinned.message_id)}
                    className="w-full text-left p-3 pr-10"
                    aria-label={`Voir le message de ${pinned.message_sender_username}`}
                  >
                    {/* Sender info */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[rgba(94,109,210,0.2)] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#5e6dd2]">
                          {pinned.message_sender_username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[13px] font-medium text-[#c9cace]">
                        {pinned.message_sender_username}
                      </span>
                      <span className="text-[11px] text-[#5e6063]">
                        {formatPinnedDate(pinned.message_created_at)}
                      </span>
                    </div>

                    {/* Message preview */}
                    <p className="text-[14px] text-[#8b8d90] leading-relaxed">
                      {truncateMessage(pinned.message_content)}
                    </p>

                    {/* Pinned by info */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Pin className="w-3 h-3 text-[#f5a623]" />
                      <span className="text-[11px] text-[#5e6063]">
                        Epingle par {pinned.pinned_by_username} {formatPinnedDate(pinned.pinned_at)}
                      </span>
                    </div>
                  </button>

                  {/* Unpin button - only for admins */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnpin(pinned.message_id)
                      }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(239,68,68,0.15)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Desepingler ce message"
                    >
                      <X className="w-4 h-4 text-[#5e6063] hover:text-[#ef4444] transition-colors" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PinnedMessages
