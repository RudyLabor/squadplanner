"use client";

import { useRef, useEffect, useCallback, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence } from 'framer-motion'
import { Skeleton, SkeletonAvatar } from './ui/Skeleton'
import { LoadingMore } from './ui/LoadingMore'

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// MESSAGE SKELETON - Optimized for virtualized lists
// =============================================================================

const MessageSkeleton = memo(({ isOwn, showAvatar }: { isOwn: boolean; showAvatar: boolean }) => (
  <div
    className={`flex gap-2 py-1 ${isOwn ? 'flex-row-reverse' : ''}`}
    aria-hidden="true"
  >
    {!isOwn && (
      <div className={showAvatar ? 'visible' : 'invisible'}>
        <SkeletonAvatar size="sm" />
      </div>
    )}
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && showAvatar && (
        <Skeleton className="h-3 w-16 mb-1" rounded="sm" />
      )}
      <Skeleton
        className={`h-12 ${isOwn ? 'w-36' : 'w-44'}`}
        rounded="xl"
      />
      <Skeleton className="h-2 w-10 mt-1" rounded="sm" />
    </div>
  </div>
))
MessageSkeleton.displayName = 'MessageSkeleton'

// =============================================================================
// LOADING SKELETON LIST
// =============================================================================

export function MessageListSkeleton({ count = 8 }: { count?: number }) {
  // Alternate between own and other messages for realistic appearance
  const skeletons = Array.from({ length: count }, (_, i) => ({
    isOwn: i % 3 === 1, // Every 3rd message is "own"
    showAvatar: i === 0 || (i % 3 !== 1 && (i - 1) % 3 === 1), // Show avatar on first or after own message
  }))

  return (
    <div className="space-y-3 p-4" aria-label="Chargement des messages...">
      {skeletons.map((props, i) => (
        <MessageSkeleton key={i} {...props} />
      ))}
    </div>
  )
}

// =============================================================================
// VIRTUALIZED MESSAGE LIST
// =============================================================================

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
  // Note: _currentUserId available for future use (e.g., highlighting own messages)
  const parentRef = useRef<HTMLDivElement>(null)
  const isAutoScrollingRef = useRef(true)
  const lastMessageCountRef = useRef(messages.length)

  // Estimate row height based on message content
  const estimateSize = useCallback((index: number) => {
    const message = messages[index]
    if (!message) return 80

    // System messages are shorter
    if (message.is_system_message) return 60

    // Calculate based on content length
    const contentLength = message.content.length
    const hasReply = !!message.reply_to_id
    const hasReactions = isSquadChat

    let baseHeight = 70 // Minimum height

    // Add height for longer content (roughly 50 chars per line)
    baseHeight += Math.ceil(contentLength / 50) * 20

    // Add height for reply preview
    if (hasReply) baseHeight += 40

    // Add height for reactions
    if (hasReactions) baseHeight += 24

    // Cap maximum height
    return Math.min(baseHeight, 300)
  }, [messages, isSquadChat])

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Render 5 extra items above/below viewport
    getItemKey: (index) => messages[index]?.id || index,
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current
    lastMessageCountRef.current = messages.length

    if (hasNewMessages && isAutoScrollingRef.current && messages.length > 0) {
      // Small delay to ensure virtualizer has updated
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' })
      })
    }
  }, [messages.length, virtualizer])

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, []) // Only on mount

  // Handle scroll position tracking
  const handleScroll = useCallback(() => {
    const container = parentRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isNearBottom = distanceFromBottom < 150

    // Update auto-scroll state
    isAutoScrollingRef.current = isNearBottom

    // Notify parent
    onScroll?.(isNearBottom)
  }, [onScroll])

  // Scroll to bottom function - available for future imperative handle
  const _scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' })
      isAutoScrollingRef.current = true
    }
  }, [messages.length, virtualizer])
  void _scrollToBottom // Prevent unused warning

  // Show skeleton while loading
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
      {/* Loading more indicator at the top */}
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

      {/* Typing indicator at the bottom */}
      <AnimatePresence>
        {typingIndicator}
      </AnimatePresence>

      {/* Scroll anchor for non-virtualized scroll-to-bottom */}
      <div id="messages-end" />
    </div>
  )
})

// =============================================================================
// CONVERSATION LIST SKELETONS
// =============================================================================

export const ConversationSkeleton = memo(function ConversationSkeleton() {
  return (
    <div className="p-3 rounded-xl" aria-hidden="true">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <Skeleton className="w-12 h-12" rounded="xl" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-24" rounded="sm" />
            <Skeleton className="h-3 w-10" rounded="sm" />
          </div>
          <Skeleton className="h-3 w-40" rounded="sm" />
        </div>
      </div>
    </div>
  )
})

export const DMConversationSkeleton = memo(function DMConversationSkeleton() {
  return (
    <div className="p-3 rounded-xl" aria-hidden="true">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <SkeletonAvatar size="lg" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-20" rounded="sm" />
            <Skeleton className="h-3 w-10" rounded="sm" />
          </div>
          <Skeleton className="h-3 w-36" rounded="sm" />
        </div>
      </div>
    </div>
  )
})

export function ConversationListSkeleton({ count = 5, type = 'squad' }: { count?: number; type?: 'squad' | 'dm' }) {
  const SkeletonComponent = type === 'dm' ? DMConversationSkeleton : ConversationSkeleton

  return (
    <div className="space-y-1" aria-label="Chargement des conversations...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}

export default VirtualizedMessageList
