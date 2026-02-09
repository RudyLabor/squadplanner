import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../hooks/useAuth'
import { ReactionPicker, REACTION_EMOJIS, type ReactionEmoji } from './ReactionPicker'

interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

interface GroupedReaction {
  emoji: string
  count: number
  userIds: string[]
  hasCurrentUser: boolean
}

interface MessageReactionsProps {
  /** The message ID to show/add reactions for */
  messageId: string
  /** Whether the message is from the current user (for positioning) */
  isOwnMessage?: boolean
  /** Callback when reactions change */
  onReactionsChange?: (reactions: MessageReaction[]) => void
}

/**
 * Component showing emoji reactions on a message
 * Supports adding/removing reactions, grouping by emoji, and showing picker
 */
export function MessageReactions({
  messageId,
  isOwnMessage = false,
  onReactionsChange
}: MessageReactionsProps) {
  const { user } = useAuthStore()
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  // Fetch reactions on mount and subscribe to changes
  useEffect(() => {
    if (!messageId) return

    const fetchReactions = async () => {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setReactions(data)
        onReactionsChange?.(data)
      }
    }

    fetchReactions()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`message_reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReactions(prev => {
              const newReactions = [...prev, payload.new as MessageReaction]
              onReactionsChange?.(newReactions)
              return newReactions
            })
          } else if (payload.eventType === 'DELETE') {
            setReactions(prev => {
              const newReactions = prev.filter(r => r.id !== (payload.old as MessageReaction).id)
              onReactionsChange?.(newReactions)
              return newReactions
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messageId, onReactionsChange])

  // Group reactions by emoji
  const groupedReactions: GroupedReaction[] = REACTION_EMOJIS
    .map(emoji => {
      const emojiReactions = reactions.filter(r => r.emoji === emoji)
      return {
        emoji,
        count: emojiReactions.length,
        userIds: emojiReactions.map(r => r.user_id),
        hasCurrentUser: emojiReactions.some(r => r.user_id === user?.id)
      }
    })
    .filter(g => g.count > 0)

  // Toggle reaction (add or remove)
  const toggleReaction = useCallback(async (emoji: ReactionEmoji) => {
    if (!user?.id || isLoading) return

    setIsLoading(true)

    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        r => r.user_id === user.id && r.emoji === emoji
      )

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .match({ message_id: messageId, user_id: user.id, emoji })

        if (error) {
          console.error('Error removing reaction:', error)
        }
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji
          })

        if (error) {
          console.error('Error adding reaction:', error)
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, messageId, reactions, isLoading])

  // Handle long press for mobile
  const handleTouchStart = useCallback(() => {
    longPressTimeout.current = setTimeout(() => {
      setIsLongPressing(true)
      setIsPickerOpen(true)
    }, 500)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
    setIsLongPressing(false)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-wrap items-center gap-1 mt-1 ${
        isOwnMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Existing reactions */}
      <AnimatePresence mode="popLayout">
        {groupedReactions.map(({ emoji, count, hasCurrentUser }) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleReaction(emoji as ReactionEmoji)}
            disabled={isLoading}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-interactive ${
              hasCurrentUser
                ? 'bg-success-15 border border-[#4ade80]/30 text-[#4ade80]'
                : 'bg-border-subtle border border-border-hover text-text-secondary hover:bg-border-hover'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`${emoji} reaction, ${count} ${count === 1 ? 'person' : 'people'}${hasCurrentUser ? ', you reacted' : ''}`}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span className={`text-xs font-medium ${hasCurrentUser ? 'text-[#4ade80]' : 'text-text-secondary'}`}>
              {count}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add reaction button - shown on hover/touch */}
      <div
        className="relative group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-interactive ${
            isPickerOpen
              ? 'bg-success-15 border border-[#4ade80]/30'
              : 'bg-border-subtle border border-border-hover opacity-0 group-hover:opacity-100 hover:bg-border-hover'
          } ${isLongPressing ? 'scale-110' : ''}`}
          aria-label="Add reaction"
          aria-expanded={isPickerOpen}
        >
          <Plus className={`w-4 h-4 ${isPickerOpen ? 'text-[#4ade80]' : 'text-text-secondary'}`} />
        </motion.button>

        {/* Reaction picker */}
        <ReactionPicker
          isOpen={isPickerOpen}
          onSelect={toggleReaction}
          onClose={() => setIsPickerOpen(false)}
          position="top"
          align={isOwnMessage ? 'right' : 'left'}
        />
      </div>
    </div>
  )
}

export default MessageReactions
