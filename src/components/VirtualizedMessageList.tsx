import { useRef, useEffect, useCallback, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence } from 'framer-motion'
import { LoadingMore } from './ui/LoadingMore'
import { MessageListSkeleton } from './MessageSkeletons'

export {
  MessageListSkeleton,
  ConversationSkeleton,
  DMConversationSkeleton,
  ConversationListSkeleton,
} from './MessageSkeletons'

interface Message {
  id: string
  content: string
  created_at: string
  is_system_message?: boolean
  is_pinned?: boolean
  edited_at?: string | null
  sender_id: string
  sender?: { username?: string; avatar_url?: string | null }
  reply_to_id?: string | null
  read_by?: string[]
  read_at?: string | null
}

interface VirtualizedMessageListProps {
  messages: Message[]
  currentUserId: string
  isSquadChat: boolean
  isLoading: boolean
  isLoadingMore?: boolean
  renderMessage: (message: Message, index: number) => React.ReactNode
  onScroll?: (isNearBottom: boolean) => void
  typingIndicator?: React.ReactNode
}

export const VirtualizedMessageList = memo(function VirtualizedMessageList({
  messages,
  currentUserId: _currentUserId,
  isSquadChat,
  isLoading,
  isLoadingMore,
  renderMessage,
  onScroll,
  typingIndicator,
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const isAutoScrollingRef = useRef(true)
  const lastMessageCountRef = useRef(messages.length)

  const estimateSize = useCallback(
    (index: number) => {
      const message = messages[index]
      if (!message) return 80

      if (message.is_system_message) return 60

      const contentLength = message.content.length
      const hasReply = !!message.reply_to_id
      const hasReactions = isSquadChat

      let baseHeight = 70
      baseHeight += Math.ceil(contentLength / 50) * 20
      if (hasReply) baseHeight += 40
      if (hasReactions) baseHeight += 24

      return Math.min(baseHeight, 300)
    },
    [messages, isSquadChat]
  )

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
    getItemKey: (index) => messages[index]?.id || index,
  })

  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current
    lastMessageCountRef.current = messages.length

    if (hasNewMessages && isAutoScrollingRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' })
      })
    }
  }, [messages.length, virtualizer])

  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, [])

  const handleScroll = useCallback(() => {
    const container = parentRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isNearBottom = distanceFromBottom < 150

    isAutoScrollingRef.current = isNearBottom
    onScroll?.(isNearBottom)
  }, [onScroll])

  const _scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' })
      isAutoScrollingRef.current = true
    }
  }, [messages.length, virtualizer])
  void _scrollToBottom

  if (isLoading && messages.length === 0) {
    return <MessageListSkeleton />
  }

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4"
      style={{ contain: 'strict' }}
    >
      <AnimatePresence>
        {isLoadingMore && <LoadingMore text="Chargement des messages..." />}
      </AnimatePresence>

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const message = messages[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderMessage(message, virtualRow.index)}
            </div>
          )
        })}
      </div>

      <AnimatePresence>{typingIndicator}</AnimatePresence>

      <div id="messages-end" />
    </div>
  )
})

export default VirtualizedMessageList
