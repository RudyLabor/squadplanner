import { motion, AnimatePresence } from 'framer-motion'
import { X, Reply } from 'lucide-react'

interface ReplyComposerProps {
  replyingTo: {
    id: string
    sender_username: string
    content: string
  } | null
  onCancel: () => void
}

/**
 * Shows when replying to a message
 * Preview of message being replied to with X button to cancel
 * Attaches to the message input area
 */
export function ReplyComposer({ replyingTo, onCancel }: ReplyComposerProps) {
  // Truncate content to max 80 characters for the composer preview
  const truncatedContent = replyingTo
    ? replyingTo.content.length > 80
      ? replyingTo.content.substring(0, 80) + '...'
      : replyingTo.content
    : ''

  return (
    <AnimatePresence>
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-dark border-l-2 border-[#5e6dd2] mx-2 mb-2 rounded-lg">
            {/* Reply icon */}
            <Reply className="w-4 h-4 text-[#5e6dd2] flex-shrink-0" />

            {/* Reply content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-secondary">Replying to</span>
                <span className="text-[11px] font-medium text-[#5e6dd2]">
                  {replyingTo.sender_username}
                </span>
              </div>
              <p className="text-[12px] text-text-secondary truncate">
                {truncatedContent}
              </p>
            </div>

            {/* Cancel button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="
                w-6 h-6 flex items-center justify-center
                rounded-full bg-white/5 hover:bg-white/10
                text-text-secondary hover:text-white
                transition-colors flex-shrink-0
              "
              aria-label="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ReplyComposer
