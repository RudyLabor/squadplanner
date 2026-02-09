import { useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronDown } from 'lucide-react'
import { MessageListSkeleton } from '../VirtualizedMessageList'
import { EmptyState } from '../EmptyState'
import { TypingIndicator } from '../TypingIndicator'
import { SwipeableMessage } from '../SwipeableMessage'
import { MessageBubble, type MessageBubbleMessage, type ReplyToData } from './MessageBubble'
import { formatDateSeparator } from './utils'

const VIRTUALIZATION_THRESHOLD = 50

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-surface-card" />
      <span className="text-xs text-text-quaternary font-medium uppercase tracking-wider">{formatDateSeparator(date)}</span>
      <div className="flex-1 h-px bg-surface-card" />
    </div>
  )
}

function buildReplyData(msg: MessageBubbleMessage, all: MessageBubbleMessage[]): ReplyToData | null {
  if (!msg.reply_to_id) return null
  const r = all.find(m => m.id === msg.reply_to_id)
  if (!r) return null
  return { id: r.id, sender_id: r.sender_id, sender_username: r.sender?.username || 'Utilisateur', sender_avatar: r.sender?.avatar_url || undefined, content: r.content }
}

interface SharedProps {
  messages: MessageBubbleMessage[]; userId: string | undefined; isSquadChat: boolean; isAdmin: boolean
  onEditMessage: (m: { id: string; content: string }) => void; onDeleteMessage: (id: string) => void
  onPinMessage: (id: string, p: boolean) => void; onReplyMessage: (m: { id: string; content: string; sender: string }) => void
  onForwardMessage: (m: { content: string; sender: string }) => void; onPollVote: (id: string, idx: number) => void
  onScrollToMessage: (id: string) => void; getMessageDate: (d: string) => string; memberRolesMap?: Map<string, string>
}

function renderMessage(msg: MessageBubbleMessage, idx: number, all: MessageBubbleMessage[], props: SharedProps) {
  const prev = all[idx - 1]
  const isOwn = msg.sender_id === props.userId
  const showAvatar = !prev || prev.sender_id !== msg.sender_id
  const mDate = props.getMessageDate(msg.created_at)
  const pDate = prev ? props.getMessageDate(prev.created_at) : ''
  const reply = () => props.onReplyMessage({ id: msg.id, content: msg.content, sender: msg.sender?.username || 'Utilisateur' })
  return (
    <>
      {mDate !== pDate && <DateSeparator date={msg.created_at} />}
      <SwipeableMessage enableSwipeLeft={!isOwn} enableSwipeRight={isOwn} onReply={reply} onActions={() => props.onDeleteMessage(msg.id)} disabled={!!msg.is_system_message}>
        <MessageBubble message={msg} isOwn={isOwn} showAvatar={showAvatar} showName={showAvatar && props.isSquadChat}
          currentUserId={props.userId || ''} isSquadChat={props.isSquadChat} isAdmin={props.isAdmin}
          onEdit={props.onEditMessage} onDelete={props.onDeleteMessage} onPin={props.onPinMessage}
          onReply={props.onReplyMessage} onForward={props.onForwardMessage} onPollVote={props.onPollVote}
          replyToMessage={buildReplyData(msg, all)} onScrollToMessage={props.onScrollToMessage}
          senderRole={props.memberRolesMap?.get(msg.sender_id)} />
      </SwipeableMessage>
    </>
  )
}

const VirtualizedMessages = memo(function VirtualizedMessages({ containerRef, endRef, onScroll, ...props }: SharedProps & {
  containerRef: React.RefObject<HTMLDivElement | null>; endRef: React.RefObject<HTMLDivElement | null>; onScroll: () => void
}) {
  const { messages } = props
  const virtualizer = useVirtualizer({
    count: messages.length, getScrollElement: () => containerRef.current, overscan: 5,
    getItemKey: (i: number) => messages[i]?.id || i,
    estimateSize: useCallback((i: number) => {
      const m = messages[i]; if (!m) return 80; if (m.is_system_message) return 60
      return Math.min(70 + Math.ceil(m.content.length / 50) * 20 + (m.reply_to_id ? 40 : 0), 300)
    }, [messages]),
  })
  const lastCount = useRef(messages.length)
  useEffect(() => { if (messages.length > lastCount.current) virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' }); lastCount.current = messages.length }, [messages.length, virtualizer])
  useEffect(() => { if (messages.length > 0) virtualizer.scrollToIndex(messages.length - 1, { align: 'end' }) }, [])

  return (
    <div ref={containerRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4" style={{ contain: 'strict' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vr => (
          <div key={vr.key} data-index={vr.index} ref={virtualizer.measureElement}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vr.start}px)` }}>
            <div id={`message-${messages[vr.index].id}`} className="transition-interactive">
              {renderMessage(messages[vr.index], vr.index, messages, props)}
            </div>
          </div>
        ))}
      </div>
      <div ref={endRef} />
    </div>
  )
})

interface MessageThreadProps extends SharedProps {
  isLoading: boolean; embedded: boolean; typingText: string; showScrollButton: boolean
  messagesContainerRef: React.RefObject<HTMLDivElement | null>; messagesEndRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void; onScrollToBottom: () => void
}

export function MessageThread({ isLoading, embedded, typingText, showScrollButton, messagesContainerRef, messagesEndRef, onScroll, onScrollToBottom, ...props }: MessageThreadProps) {
  const { messages } = props

  if (isLoading && messages.length === 0) return <div className="flex-1 overflow-y-auto px-4 py-4"><div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}><MessageListSkeleton count={10} /></div></div>
  if (messages.length === 0) return <div className="flex-1 overflow-y-auto px-4 py-4"><div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}><EmptyState type="no_messages" title="Nouvelle conversation" message="Envoie le premier message !" /></div></div>

  const scrollBtn = (
    <AnimatePresence>{showScrollButton && (
      <motion.button initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }} onClick={onScrollToBottom} aria-label="Scroll to bottom"
        className={`${embedded ? 'absolute' : 'fixed'} bottom-28 right-6 w-10 h-10 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-md shadow-glow-primary-sm transition-colors z-50`}>
        <ChevronDown className="w-5 h-5 text-white" />
      </motion.button>
    )}</AnimatePresence>
  )

  if (messages.length >= VIRTUALIZATION_THRESHOLD) return (
    <div className="flex-1 relative flex flex-col">
      <VirtualizedMessages {...props} containerRef={messagesContainerRef} endRef={messagesEndRef} onScroll={onScroll} />
      <AnimatePresence>{typingText && <div className="px-4 pb-2"><TypingIndicator text={typingText} /></div>}</AnimatePresence>
      {scrollBtn}
    </div>
  )

  return (
    <div ref={messagesContainerRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4 relative">
      <div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => <div key={msg.id} id={`message-${msg.id}`} className="transition-interactive">{renderMessage(msg, i, messages, props)}</div>)}
        </AnimatePresence>
        <AnimatePresence>{typingText && <TypingIndicator text={typingText} />}</AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      {scrollBtn}
    </div>
  )
}
