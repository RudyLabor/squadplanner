import { m, AnimatePresence } from 'framer-motion'
import { X, Reply } from './icons'
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
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-dark border-l-2 border-primary mx-2 mb-2 rounded-lg">
            {/* Reply icon */}
            <Reply className="w-4 h-4 text-primary flex-shrink-0" />

            {/* Reply content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm text-text-secondary">Replying to</span>
                <span className="text-sm font-medium text-primary">
                  {replyingTo.sender_username}
                </span>
              </div>
              <p className="text-sm text-text-secondary truncate">
                {truncatedContent}
              </p>
            </div>

            {/* Cancel button */}
            <m.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="
                w-6 h-6 flex items-center justify-center
                rounded-full bg-overlay-subtle hover:bg-overlay-light
                text-text-secondary hover:text-text-primary
                transition-colors flex-shrink-0
              "
              aria-label="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </m.button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

export default ReplyComposer
