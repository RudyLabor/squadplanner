import { m, AnimatePresence } from 'framer-motion'
import { forwardRef } from 'react'

// Available emoji reactions
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

interface ReactionPickerProps {
  /** Whether the picker is visible */
  isOpen: boolean
  /** Called when an emoji is selected */
  onSelect: (emoji: ReactionEmoji) => void
  /** Called when picker should close */
  onClose: () => void
  /** Position relative to the trigger element */
  position?: 'top' | 'bottom'
  /** Alignment relative to the trigger element */
  align?: 'left' | 'center' | 'right'
}

/**
 * Emoji reaction picker popup
 * Shows a horizontal list of emoji reactions with hover effects
 */
export const ReactionPicker = forwardRef<HTMLDivElement, ReactionPickerProps>(
  ({ isOpen, onSelect, onClose, position = 'top', align = 'center' }, ref) => {
    const handleEmojiClick = (emoji: ReactionEmoji) => {
      onSelect(emoji)
      onClose()
    }

    // Position classes
    const positionClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
    }

    const alignClasses = {
      left: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      right: 'right-0',
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing on click outside - separate from picker */}
            <div
              className="fixed inset-0 z-40"
              onClick={onClose}
              onTouchEnd={onClose}
              aria-hidden="true"
            />

            {/* Picker container */}
            <m.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                duration: 0.2,
              }}
              className={`absolute z-50 ${positionClasses[position]} ${alignClasses[align]}`}
            >
              <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-dark border border-border-hover rounded-full shadow-lg shadow-black/40">
                {REACTION_EMOJIS.map((emoji, index) => (
                  <m.button
                    key={emoji}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.03,
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                    }}
                    whileHover={{
                      scale: 1.3,
                      transition: { duration: 0.15 },
                    }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEmojiClick(emoji)
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation()
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-border-hover transition-colors text-xl touch-manipulation"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </m.button>
                ))}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    )
  }
)

ReactionPicker.displayName = 'ReactionPicker'

export default ReactionPicker
