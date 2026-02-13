
import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus } from './icons'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
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
}

/**
 * Component showing emoji reactions on a message
 * Supports adding/removing reactions, grouping by emoji, and showing picker
 *
 * NOTE: Realtime subscription removed to prevent N channels per N messages
 * which caused performance issues on mobile (blinking + page freeze).
 * Reactions now fetch once on mount and update optimistically on toggle.
 */
export function MessageReactions({
  messageId,
  isOwnMessage = false,
}: MessageReactionsProps) {
  const { user } = useAuthStore()
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  // Fetch reactions once on mount (no realtime subscription per message)
  useEffect(() => {
    if (!messageId) return

    let cancelled = false

    const fetchReactions = async () => {
      try {
        const { data, error } = await supabase
          .from('message_reactions')
          .select('*')
          .eq('message_id', messageId)
          .order('created_at', { ascending: true })

        if (!error && data && !cancelled) {
          setReactions(data)
        }
      } catch {
        // Table might not exist yet - silently ignore
      }
    }

    fetchReactions()

    return () => {
      cancelled = true
    }
  }, [messageId])

  // Group reactions by emoji
  const groupedReactions: GroupedReaction[] = REACTION_EMOJIS.map((emoji) => {
    const emojiReactions = reactions.filter((r) => r.emoji === emoji)
    return {
      emoji,
      count: emojiReactions.length,
      userIds: emojiReactions.map((r) => r.user_id),
      hasCurrentUser: emojiReactions.some((r) => r.user_id === user?.id),
    }
  }).filter((g) => g.count > 0)

  // Toggle reaction (add or remove) with optimistic update
  const toggleReaction = useCallback(
    async (emoji: ReactionEmoji) => {
      if (!user?.id || isLoading) return

      setIsLoading(true)

      const existingReaction = reactions.find((r) => r.user_id === user.id && r.emoji === emoji)

      // Optimistic update
      if (existingReaction) {
        setReactions((prev) => prev.filter((r) => r.id !== existingReaction.id))
      } else {
        const optimistic: MessageReaction = {
          id: `temp-${Date.now()}`,
          message_id: messageId,
          user_id: user.id,
          emoji,
          created_at: new Date().toISOString(),
        }
        setReactions((prev) => [...prev, optimistic])
      }

      try {
        if (existingReaction) {
          const { error } = await supabase
            .from('message_reactions')
            .delete()
            .match({ message_id: messageId, user_id: user.id, emoji })

          if (error) {
            // Rollback optimistic update
            setReactions((prev) => [...prev, existingReaction])
          }
        } else {
          const { data, error } = await supabase
            .from('message_reactions')
            .insert({ message_id: messageId, user_id: user.id, emoji })
            .select()
            .single()

          if (error) {
            // Rollback optimistic update
            setReactions((prev) => prev.filter((r) => !r.id.startsWith('temp-')))
          } else if (data) {
            // Replace temp with real data
            setReactions((prev) =>
              prev.map((r) => (r.id.startsWith('temp-') && r.emoji === emoji ? data : r))
            )
          }
        }
      } catch {
        // Refetch on error to get consistent state
        const { data } = await supabase
          .from('message_reactions')
          .select('*')
          .eq('message_id', messageId)
          .order('created_at', { ascending: true })
        if (data) setReactions(data)
      } finally {
        setIsLoading(false)
      }
    },
    [user?.id, messageId, reactions, isLoading]
  )

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
      {/* Existing reactions — static render to prevent mobile flickering */}
      {groupedReactions.map(({ emoji, count, hasCurrentUser }) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(emoji as ReactionEmoji)}
          disabled={isLoading}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors active:scale-95 ${
            hasCurrentUser
              ? 'bg-success-15 border border-success/30 text-success'
              : 'bg-border-subtle border border-border-hover text-text-secondary hover:bg-border-hover'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={`Réaction ${emoji}, ${count} ${count === 1 ? 'personne' : 'personnes'}${hasCurrentUser ? ', tu as réagi' : ''}`}
        >
          <span className="text-base leading-none">{emoji}</span>
          <span
            className={`text-xs font-medium ${hasCurrentUser ? 'text-success' : 'text-text-secondary'}`}
          >
            {count}
          </span>
        </button>
      ))}

      {/* Add reaction button — visible on hover (desktop) or always on mobile */}
      <div
        className="relative group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
            isPickerOpen
              ? 'bg-success-15 border border-success/30'
              : 'bg-border-subtle border border-border-hover opacity-0 group-hover:opacity-100 hover:bg-border-hover'
          } ${isLongPressing ? 'scale-110' : ''}`}
          aria-label="Ajouter une réaction"
          aria-expanded={isPickerOpen}
        >
          <Plus className={`w-4 h-4 ${isPickerOpen ? 'text-success' : 'text-text-secondary'}`} />
        </button>

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
