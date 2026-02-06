import { motion } from 'framer-motion'
import { CornerUpRight } from 'lucide-react'

interface MessageReplyPreviewProps {
  originalMessage: {
    id: string
    sender_id: string
    sender_username: string
    sender_avatar?: string
    content: string
  }
  onClickScrollTo?: () => void
}

/**
 * Shows the original message being replied to above the current message
 * Compact preview with sender name and truncated content
 * Click to scroll to original message
 */
export function MessageReplyPreview({
  originalMessage,
  onClickScrollTo,
}: MessageReplyPreviewProps) {
  // Truncate content to max 100 characters
  const truncatedContent =
    originalMessage.content.length > 100
      ? originalMessage.content.substring(0, 100) + '...'
      : originalMessage.content

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClickScrollTo}
      className={`
        flex items-start gap-2 px-3 py-2 mb-1
        bg-[#1a1a2e]/60 rounded-lg
        border-l-2 border-[#5e6dd2]
        ${onClickScrollTo ? 'cursor-pointer hover:bg-[#1a1a2e]/80 transition-colors' : ''}
      `}
      role={onClickScrollTo ? 'button' : undefined}
      tabIndex={onClickScrollTo ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClickScrollTo && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClickScrollTo()
        }
      }}
    >
      {/* Reply icon */}
      <CornerUpRight className="w-3 h-3 text-[#5e6dd2] mt-0.5 flex-shrink-0" />

      {/* Mini avatar */}
      {originalMessage.sender_avatar ? (
        <img
          src={originalMessage.sender_avatar}
          alt={originalMessage.sender_username}
          className="w-4 h-4 rounded-full flex-shrink-0"
        />
      ) : (
        <div className="w-4 h-4 rounded-full bg-[#5e6dd2]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-medium text-[#5e6dd2]">
            {originalMessage.sender_username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium text-[#5e6dd2]">
          {originalMessage.sender_username}
        </span>
        <p className="text-[11px] text-[#8b8d90] truncate leading-tight">
          {truncatedContent}
        </p>
      </div>
    </motion.div>
  )
}

export default MessageReplyPreview
