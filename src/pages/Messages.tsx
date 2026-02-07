import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSearchParams } from 'react-router-dom'
import {
  Send,
  ArrowLeft,
  Users,
  Loader2,
  Gamepad2,
  Search,
  Sparkles,
  User,
  Phone,
  ChevronDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '../components/ui'
import { useMessagesStore } from '../hooks/useMessages'
import { useDirectMessagesStore } from '../hooks/useDirectMessages'
import { useAuthStore } from '../hooks/useAuth'
import { useVoiceCallStore } from '../hooks/useVoiceCall'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { MessageStatus } from '../components/MessageStatus'
import { TypingIndicator } from '../components/TypingIndicator'
import { MessageActions } from '../components/MessageActions'
import { EditMessageModal } from '../components/EditMessageModal'
import { MessageReactions } from '../components/MessageReactions'
import { PinnedMessages, type PinnedMessage } from '../components/PinnedMessages'
import { EmptyState } from '../components/EmptyState'
import { ReplyComposer } from '../components/ReplyComposer'
import { MessageReplyPreview } from '../components/MessageReplyPreview'
import { ConversationListSkeleton, MessageListSkeleton } from '../components/VirtualizedMessageList'

// Simple toast component for Messages
function MessageToast({ message, isVisible, variant = 'success' }: {
  message: string
  isVisible: boolean
  variant?: 'success' | 'error'
}) {
  const styles = {
    success: { bg: 'bg-[#34d399]', text: 'text-[#050506]', Icon: CheckCircle2 },
    error: { bg: 'bg-[#fb7185]', text: 'text-white', Icon: AlertCircle }
  }
  const style = styles[variant]
  const Icon = style.Icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${style.bg} ${style.text} shadow-lg`}>
            <Icon className="w-5 h-5" />
            <span className="text-[14px] font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Formatage du temps relatif
function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'maintenant'
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Hier'
  if (days < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Formatage date pour séparateurs
function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === now.toDateString()) return 'Aujourd\'hui'
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Card conversation compacte
function ConversationCard({ conversation, onClick, isActive }: {
  conversation: {
    id: string
    name: string
    type: 'squad' | 'session'
    squad_id: string
    session_id?: string
    last_message?: {
      content: string
      created_at: string
      sender?: { username?: string; avatar_url?: string | null }
    }
    unread_count: number
  }
  onClick: () => void
  isActive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-left transition-interactive ${
        isActive
          ? 'bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)]'
          : 'hover:bg-[#18191b] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          conversation.type === 'session'
            ? 'bg-[rgba(251,191,36,0.15)]'
            : 'bg-[rgba(99,102,241,0.15)]'
        }`}>
          {conversation.type === 'session' ? (
            <Gamepad2 className="w-5 h-5 text-[#fbbf24]" />
          ) : (
            <Users className="w-5 h-5 text-[#6366f1]" />
          )}
          {/* Unread indicator */}
          {conversation.unread_count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#6366f1] text-white text-xs font-bold rounded-full flex items-center justify-center">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className={`text-[14px] font-medium truncate ${
              conversation.unread_count > 0 ? 'text-[#f7f8f8]' : 'text-[#c9cace]'
            }`}>
              {conversation.name}
            </h3>
            {conversation.last_message && (
              <span className="text-xs text-[#5e6063] flex-shrink-0 ml-2">
                {formatTime(conversation.last_message.created_at)}
              </span>
            )}
          </div>
          <p className={`text-[13px] truncate ${
            conversation.unread_count > 0 ? 'text-[#8b8d90]' : 'text-[#5e6063]'
          }`}>
            {conversation.last_message ? (
              <>
                <span className="text-[#8b8d90]">
                  {conversation.last_message.sender?.username}:
                </span>{' '}
                {conversation.last_message.content}
              </>
            ) : (
              <span className="italic">Aucun message</span>
            )}
          </p>
        </div>
      </div>
    </button>
  )
}

// Date separator component
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
      <span className="text-xs text-[#5e6063] font-medium uppercase tracking-wider">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
    </div>
  )
}

// =============================================================================
// VIRTUALIZED MESSAGE CONTAINER - For large message lists (50+ messages)
// =============================================================================

interface VirtualizedMessagesProps {
  messages: Array<{
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
  }>
  userId: string | undefined
  isSquadChat: boolean
  isAdmin: boolean
  onEditMessage: (msg: { id: string; content: string }) => void
  onDeleteMessage: (id: string) => void
  onPinMessage: (id: string, isPinned: boolean) => void
  onReplyMessage: (msg: { id: string; content: string; sender: string }) => void
  onScrollToMessage: (id: string) => void
  getMessageDate: (date: string) => string
  containerRef: React.RefObject<HTMLDivElement | null>
  endRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
}

const VirtualizedMessages = memo(function VirtualizedMessages({
  messages,
  userId,
  isSquadChat,
  isAdmin,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onReplyMessage,
  onScrollToMessage,
  getMessageDate,
  containerRef,
  endRef,
  onScroll,
}: VirtualizedMessagesProps) {
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: useCallback((index: number) => {
      const msg = messages[index]
      if (!msg) return 80
      if (msg.is_system_message) return 60
      // Estimate based on content length
      const baseHeight = 70
      const contentLines = Math.ceil(msg.content.length / 50)
      const hasReply = !!msg.reply_to_id
      return Math.min(baseHeight + contentLines * 20 + (hasReply ? 40 : 0), 300)
    }, [messages]),
    overscan: 5,
    getItemKey: (index: number) => messages[index]?.id || index,
  })

  // Auto-scroll to bottom on new messages
  const lastCountRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > lastCountRef.current && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' })
    }
    lastCountRef.current = messages.length
  }, [messages.length, virtualizer])

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, [])

  const items = virtualizer.getVirtualItems()

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-4"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const message = messages[virtualRow.index]
          const index = virtualRow.index
          const isOwn = message.sender_id === userId
          const prevMessage = messages[index - 1]
          const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id
          const showName = showAvatar && isSquadChat

          const messageDate = getMessageDate(message.created_at)
          const prevMessageDate = prevMessage ? getMessageDate(prevMessage.created_at) : ''
          const showDateSeparator = messageDate !== prevMessageDate

          const replyToId = 'reply_to_id' in message ? message.reply_to_id : null
          const replyToMessage = replyToId ? messages.find(m => m.id === replyToId) : null
          const replyToData = replyToMessage ? {
            id: replyToMessage.id,
            sender_id: replyToMessage.sender_id,
            sender_username: replyToMessage.sender?.username || 'Utilisateur',
            sender_avatar: replyToMessage.sender?.avatar_url || undefined,
            content: replyToMessage.content
          } : null

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
              <div id={`message-${message.id}`} className="transition-interactive">
                {showDateSeparator && <DateSeparator date={message.created_at} />}
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showName={showName}
                  currentUserId={userId || ''}
                  isSquadChat={isSquadChat}
                  isAdmin={isAdmin}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  onPin={onPinMessage}
                  onReply={onReplyMessage}
                  replyToMessage={replyToData}
                  onScrollToMessage={onScrollToMessage}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div ref={endRef} />
    </div>
  )
})

// Threshold for enabling virtualization (messages count)
const VIRTUALIZATION_THRESHOLD = 50

// System message component - centré, gris, italic, pas de bulle
// Celebration pour messages importants (confirmation, rejoint)
function SystemMessage({ message }: {
  message: {
    id: string
    content: string
    created_at: string
  }
}) {
  const content = message.content.toLowerCase()
  const isCelebration = content.includes('confirmé') ||
                        content.includes('rejoint') ||
                        content.includes('bienvenue') ||
                        content.includes('présent')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 200, damping: 20 }}
      className="flex justify-center my-3"
    >
      <p className={`text-[13px] italic text-center px-4 py-1.5 rounded-full ${
        isCelebration
          ? 'bg-gradient-to-r from-[rgba(99,102,241,0.15)] to-[rgba(167,139,250,0.15)] text-[#a5b4fc] border border-[rgba(99,102,241,0.2)]'
          : 'text-[#888]'
      }`}>
        {isCelebration && <span className="mr-1">🎉</span>}
        — {message.content} —
      </p>
    </motion.div>
  )
}

// Message bubble
function MessageBubble({ message, isOwn, showAvatar, showName, currentUserId, isSquadChat, isAdmin, onEdit, onDelete, onPin, onReply, replyToMessage, onScrollToMessage }: {
  message: {
    id: string
    content: string
    created_at: string
    is_system_message?: boolean
    is_pinned?: boolean
    edited_at?: string | null
    sender_id: string
    sender?: { username?: string; avatar_url?: string | null }
    reply_to_id?: string | null
    // Pour les squad messages
    read_by?: string[]
    // Pour les DMs
    read_at?: string | null
  }
  isOwn: boolean
  showAvatar: boolean
  showName: boolean
  currentUserId: string
  isSquadChat: boolean
  isAdmin: boolean
  onEdit: (message: { id: string; content: string }) => void
  onDelete: (messageId: string) => void
  onPin: (messageId: string, isPinned: boolean) => void
  onReply: (message: { id: string; content: string; sender: string }) => void
  replyToMessage?: {
    id: string
    sender_id: string
    sender_username: string
    sender_avatar?: string
    content: string
  } | null
  onScrollToMessage?: (messageId: string) => void
}) {
  // Si c'est un message système, utiliser le composant dédié
  if (message.is_system_message) {
    return <SystemMessage message={message} />
  }

  const initial = message.sender?.username?.charAt(0).toUpperCase() || '?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
    >
      <div className={`flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
            {message.sender?.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[rgba(99,102,241,0.2)] flex items-center justify-center text-xs font-bold text-[#6366f1]">
                {initial}
              </div>
            )}
          </div>
        )}

        <div className={`${isOwn ? 'items-end' : 'items-start'} flex flex-col relative`}>
          {showName && !isOwn && (
            <span className="text-xs text-[#8b8d90] mb-1 ml-1 font-medium">
              {message.sender?.username}
            </span>
          )}

          {/* Pinned indicator */}
          {message.is_pinned && (
            <span className="text-[10px] text-[#fbbf24] mb-1 ml-1 flex items-center gap-1">
              <span>📌</span> Epingle
            </span>
          )}

          {/* Reply Preview - Phase 3.3 */}
          {replyToMessage && (
            <MessageReplyPreview
              originalMessage={replyToMessage}
              onClickScrollTo={onScrollToMessage ? () => onScrollToMessage(replyToMessage.id) : undefined}
            />
          )}

          <div className="flex items-center gap-1">
            {/* Message Actions - on the left for own messages */}
            {isOwn && (
              <div className="flex-shrink-0">
                <MessageActions
                  message={{ id: message.id, sender_id: message.sender_id, content: message.content }}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onEdit={() => onEdit({ id: message.id, content: message.content })}
                  onDelete={() => onDelete(message.id)}
                  onPin={() => onPin(message.id, !message.is_pinned)}
                  onReply={() => onReply({
                    id: message.id,
                    content: message.content,
                    sender: message.sender?.username || 'Utilisateur'
                  })}
                />
              </div>
            )}

            <div
              className={`px-4 py-2.5 rounded-2xl transition-colors duration-150 ${
                isOwn
                  ? 'bg-[#6366f1] text-white rounded-br-lg hover:bg-[#7c7ffa] hover:shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                  : 'bg-[#18191b] text-[#f7f8f8] rounded-bl-lg hover:bg-[#1f2023] hover:shadow-[0_0_10px_rgba(255,255,255,0.025)]'
              }`}
            >
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>

            {/* Message Actions - on the right for other's messages */}
            {!isOwn && (
              <div className="flex-shrink-0">
                <MessageActions
                  message={{ id: message.id, sender_id: message.sender_id, content: message.content }}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onEdit={() => onEdit({ id: message.id, content: message.content })}
                  onDelete={() => onDelete(message.id)}
                  onPin={() => onPin(message.id, !message.is_pinned)}
                  onReply={() => onReply({
                    id: message.id,
                    content: message.content,
                    sender: message.sender?.username || 'Utilisateur'
                  })}
                />
              </div>
            )}
          </div>

          <span className="text-xs text-[#5e6063] mt-1 mx-1 flex items-center gap-1">
            {formatTime(message.created_at)}
            {/* Edited indicator */}
            {message.edited_at && (
              <span className="text-[#8b8d90] italic">(modifie)</span>
            )}
            {/* Read receipts - seulement pour les messages envoyés par l'utilisateur */}
            {isOwn && (
              isSquadChat ? (
                <MessageStatus
                  readBy={message.read_by}
                  currentUserId={currentUserId}
                />
              ) : (
                <MessageStatus
                  readAt={message.read_at}
                  currentUserId={currentUserId}
                />
              )
            )}
          </span>

          {/* Emoji Reactions - Phase 3.1 */}
          {isSquadChat && (
            <MessageReactions
              messageId={message.id}
              isOwnMessage={isOwn}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Card DM conversation
function DMConversationCard({ conversation, onClick }: {
  conversation: {
    other_user_id: string
    other_user_username: string
    other_user_avatar_url: string | null
    last_message_content: string | null
    last_message_at: string | null
    unread_count: number
  }
  onClick: () => void
}) {
  const initial = conversation.other_user_username?.charAt(0).toUpperCase() || '?'

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl text-left transition-interactive hover:bg-[#18191b] border border-transparent"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-[rgba(99,102,241,0.15)]">
          {conversation.other_user_avatar_url ? (
            <img
              src={conversation.other_user_avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[14px] font-bold text-[#6366f1]">{initial}</span>
          )}
          {/* Unread indicator */}
          {conversation.unread_count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#6366f1] text-white text-xs font-bold rounded-full flex items-center justify-center">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className={`text-[14px] font-medium truncate ${
              conversation.unread_count > 0 ? 'text-[#f7f8f8]' : 'text-[#c9cace]'
            }`}>
              {conversation.other_user_username}
            </h3>
            {conversation.last_message_at && (
              <span className="text-xs text-[#5e6063] flex-shrink-0 ml-2">
                {formatTime(conversation.last_message_at)}
              </span>
            )}
          </div>
          <p className={`text-[13px] truncate ${
            conversation.unread_count > 0 ? 'text-[#8b8d90]' : 'text-[#5e6063]'
          }`}>
            {conversation.last_message_content || <span className="italic">Nouvelle conversation</span>}
          </p>
        </div>
      </div>
    </button>
  )
}

export function Messages() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  // Squad messages store
  const {
    messages: squadMessages,
    conversations: squadConversations,
    activeConversation: activeSquadConv,
    isLoading: isLoadingSquad,
    fetchConversations: fetchSquadConvs,
    setActiveConversation: setActiveSquadConv,
    sendMessage: sendSquadMessage,
    editMessage: editSquadMessage,
    deleteMessage: deleteSquadMessage,
    pinMessage: pinSquadMessage,
    markAsRead: markSquadAsRead,
    unsubscribe: unsubscribeSquad,
  } = useMessagesStore()

  // DM store
  const {
    messages: dmMessages,
    conversations: dmConversations,
    activeConversation: activeDMConv,
    isLoading: isLoadingDM,
    fetchConversations: fetchDMConvs,
    setActiveConversation: setActiveDMConv,
    sendMessage: sendDMMessage,
    unsubscribe: unsubscribeDM,
  } = useDirectMessagesStore()

  const [activeTab, setActiveTab] = useState<'squads' | 'dms'>('squads')
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; sender: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error'; visible: boolean }>({
    message: '',
    variant: 'success',
    visible: false
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Desktop detection for split view
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Déterminer le contexte de conversation pour le typing indicator
  const isSquadChat = !!activeSquadConv
  const conversationType = isSquadChat ? 'squad' : 'dm'
  const conversationId = isSquadChat
    ? activeSquadConv?.squad_id || ''
    : activeDMConv?.other_user_id || ''
  const sessionId = activeSquadConv?.session_id

  // Typing indicator hook
  const { typingText, handleTyping } = useTypingIndicator({
    conversationType,
    conversationId,
    sessionId,
    currentUsername: user?.user_metadata?.username || user?.email || 'Utilisateur',
  })

  // Handler pour le changement de texte avec typing indicator
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (e.target.value.trim()) {
      handleTyping()
    }
  }, [handleTyping])

  // Fetch conversations on mount
  useEffect(() => {
    fetchSquadConvs()
    fetchDMConvs()
    return () => {
      unsubscribeSquad()
      unsubscribeDM()
    }
  }, [fetchSquadConvs, fetchDMConvs, unsubscribeSquad, unsubscribeDM])

  // Handle DM URL parameter - switch to DMs tab and open conversation
  useEffect(() => {
    const dmUserId = searchParams.get('dm')
    // Wait for loading to complete before handling the dm parameter
    if (!dmUserId || isLoadingDM) return

    // Switch to DMs tab immediately
    setActiveTab('dms')

    // Find or create conversation with this user
    const existingConv = dmConversations.find(c => c.other_user_id === dmUserId)

    if (existingConv) {
      // Open the existing conversation
      setActiveDMConv(existingConv)
      // Clear the URL param to prevent re-triggering
      setSearchParams({}, { replace: true })
    } else {
      // Create a new conversation placeholder (will be created on first message)
      // Fetch the user info and create a temp conversation
      const fetchUserAndOpenConv = async () => {
        const { supabase } = await import('../lib/supabase')
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', dmUserId)
          .single()

        if (userData) {
          // Set up a temporary conversation that will be created on first message
          setActiveDMConv({
            other_user_id: userData.id,
            other_user_username: userData.username || 'Utilisateur',
            other_user_avatar_url: userData.avatar_url,
            last_message_content: null,
            last_message_at: null,
            last_message_sender_id: null,
            unread_count: 0
          })
          // Clear the URL param
          setSearchParams({}, { replace: true })
        }
      }
      fetchUserAndOpenConv()
    }
  }, [searchParams, dmConversations, isLoadingDM, setActiveDMConv, setSearchParams])

  // Scroll to bottom when messages change
  const currentMessages = activeSquadConv ? squadMessages : dmMessages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  // Detect scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Focus input when entering chat (only on initial entry, not on every change)
  const hasEnteredChatRef = useRef(false)
  useEffect(() => {
    const hasActiveChat = !!(activeSquadConv || activeDMConv)
    if (hasActiveChat && !hasEnteredChatRef.current) {
      hasEnteredChatRef.current = true
      setTimeout(() => inputRef.current?.focus(), 100)
    } else if (!hasActiveChat) {
      hasEnteredChatRef.current = false
    }
  }, [activeSquadConv, activeDMConv])

  // Mark squad messages as read
  useEffect(() => {
    if (activeSquadConv) {
      markSquadAsRead(activeSquadConv.squad_id, activeSquadConv.session_id)
    }
  }, [activeSquadConv, markSquadAsRead])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)

    if (activeSquadConv) {
      // Pass reply_to_id for proper reply threading - Phase 3.3
      const { error } = await sendSquadMessage(
        newMessage,
        activeSquadConv.squad_id,
        activeSquadConv.session_id,
        replyingTo?.id // Pass the reply_to_id
      )
      if (!error) {
        setNewMessage('')
        setReplyingTo(null)
      }
    } else if (activeDMConv) {
      const { error } = await sendDMMessage(newMessage, activeDMConv.other_user_id)
      if (!error) {
        setNewMessage('')
        setReplyingTo(null)
      }
    }

    setIsSending(false)
  }

  const handleBack = () => {
    if (activeSquadConv) setActiveSquadConv(null)
    if (activeDMConv) setActiveDMConv(null)
  }

  // Show toast helper
  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ message, variant, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  // Handle message edit
  const handleEditMessage = async (newContent: string) => {
    if (!editingMessage) return

    const { error } = await editSquadMessage(editingMessage.id, newContent)
    if (error) {
      showToast('Erreur lors de la modification', 'error')
    } else {
      showToast('Message modifie')
    }
    setEditingMessage(null)
  }

  // Handle message delete
  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await deleteSquadMessage(messageId)
    if (error) {
      showToast('Erreur lors de la suppression', 'error')
    } else {
      showToast('Message supprime')
    }
  }

  // Handle message pin
  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    const { error } = await pinSquadMessage(messageId, isPinned)
    if (error) {
      showToast('Erreur lors de l\'epinglage', 'error')
    } else {
      showToast(isPinned ? 'Message epingle' : 'Message desepingle')
    }
  }

  // Handle reply - focus input and add reply prefix
  const handleReply = (replyInfo: { id: string; content: string; sender: string }) => {
    setReplyingTo(replyInfo)
    inputRef.current?.focus()
  }

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null)
  }

  // Check if current user is admin in current squad
  const isAdmin = (() => {
    // For now, we'll consider the user as admin if they are viewing their own squad
    // This should be enhanced with actual role checking from squad_members
    return true // Placeholder - should be based on actual role
  })()

  // Compteurs
  const squadUnread = squadConversations.reduce((sum, c) => sum + c.unread_count, 0)
  const dmUnread = dmConversations.reduce((sum, c) => sum + c.unread_count, 0)
  const totalUnread = squadUnread + dmUnread

  // Filtrer les conversations
  const filteredSquadConvs = squadConversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredDMConvs = dmConversations.filter(c =>
    c.other_user_username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isLoading = activeTab === 'squads' ? isLoadingSquad : isLoadingDM

  // Grouper les messages par date
  const getMessageDate = (dateStr: string) => new Date(dateStr).toDateString()

  // Variables pour la vue chat (isSquadChat déjà défini plus haut)
  const messages = isSquadChat ? squadMessages : dmMessages
  const chatName = isSquadChat ? activeSquadConv?.name : activeDMConv?.other_user_username
  const chatSubtitle = isSquadChat
    ? (activeSquadConv?.type === 'squad' ? 'Chat de squad' : 'Chat de session')
    : 'Message privé'

  // Pinned messages - Phase 3.2
  const pinnedMessages: PinnedMessage[] = useMemo(() => {
    if (!isSquadChat) return []
    return messages
      .filter(msg => 'is_pinned' in msg && msg.is_pinned)
      .map(msg => ({
        pin_id: `pin-${msg.id}`,
        message_id: msg.id,
        message_content: msg.content,
        message_sender_id: msg.sender_id,
        message_sender_username: msg.sender?.username || 'Utilisateur',
        message_created_at: msg.created_at,
        pinned_by_id: msg.sender_id, // Simplified - in real app, track who pinned
        pinned_by_username: msg.sender?.username || 'Utilisateur',
        pinned_at: msg.created_at
      }))
      .slice(0, 25) // Max 25 pinned messages
  }, [messages, isSquadChat])

  // Scroll to a specific message (for pinned messages)
  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Highlight the message briefly
      messageElement.classList.add('ring-2', 'ring-[#f5a623]', 'ring-opacity-50')
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-[#f5a623]', 'ring-opacity-50')
      }, 2000)
    }
  }, [])

  // ========== COMPOSANT LISTE DES CONVERSATIONS ==========
  const ConversationsList = ({ showOnDesktop = false }: { showOnDesktop?: boolean }) => (
    <div className={`${showOnDesktop ? 'h-full flex flex-col' : ''}`}>
      {/* Header */}
      <div className={`${showOnDesktop ? 'p-4' : 'mb-5'}`}>
        <div className="flex items-center justify-between mb-1">
          <h1 className={`font-bold text-[#f7f8f8] ${showOnDesktop ? 'text-xl' : 'text-2xl'}`}>Messages</h1>
          {totalUnread > 0 && (
            <span className="px-2.5 py-1 bg-[#6366f1] text-white text-[12px] font-bold rounded-full">
              {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 bg-[#18191b] rounded-xl ${showOnDesktop ? 'mx-4 mb-3' : 'mb-5'}`}>
        <button
          onClick={() => setActiveTab('squads')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-interactive flex items-center justify-center gap-2 ${
            activeTab === 'squads'
              ? 'bg-[#1f2023] text-[#f7f8f8]'
              : 'text-[#8b8d90] hover:text-[#f7f8f8]'
          }`}
        >
          <Users className="w-4 h-4" />
          Squads
          {squadUnread > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-[#6366f1] text-white text-xs font-bold rounded-full flex items-center justify-center">
              {squadUnread > 9 ? '9+' : squadUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('dms')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-interactive flex items-center justify-center gap-2 ${
            activeTab === 'dms'
              ? 'bg-[#1f2023] text-[#f7f8f8]'
              : 'text-[#8b8d90] hover:text-[#f7f8f8]'
          }`}
        >
          <User className="w-4 h-4" />
          Privés
          {dmUnread > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-[#6366f1] text-white text-xs font-bold rounded-full flex items-center justify-center">
              {dmUnread > 9 ? '9+' : dmUnread}
            </span>
          )}
        </button>
      </div>

      {/* Search bar */}
      <div className={`relative ${showOnDesktop ? 'mx-4 mb-3' : 'mb-5'}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e6063]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'squads' ? 'Rechercher une squad...' : 'Rechercher un contact...'}
          aria-label="Rechercher une conversation"
          className="w-full h-11 pl-10 pr-4 bg-[#18191b] border border-[rgba(255,255,255,0.06)] rounded-xl text-[14px] text-[#f7f8f8] placeholder:text-[#5e6063] focus:outline-none focus:border-[rgba(99,102,241,0.5)] transition-colors"
        />
      </div>

      {/* Liste conversations */}
      <div className={`${showOnDesktop ? 'flex-1 overflow-y-auto px-4 pb-4' : ''}`}>
        {isLoading ? (
          <ConversationListSkeleton count={6} type={activeTab === 'squads' ? 'squad' : 'dm'} />
        ) : activeTab === 'squads' ? (
          // Squad conversations
          squadConversations.length === 0 ? (
            <EmptyState
              type="no_squads"
              title="Pas encore de squads"
              message="Rejoins une squad pour discuter avec tes potes."
              actionLabel="Voir mes squads"
              onAction={() => window.location.href = '/squads'}
            />
          ) : filteredSquadConvs.length === 0 ? (
            <EmptyState
              type="no_search_results"
              title="Aucune squad trouvée"
              message="Essaie avec d'autres mots-clés"
            />
          ) : (
            <div className="space-y-1">
              {filteredSquadConvs.map(conversation => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  onClick={() => setActiveSquadConv(conversation)}
                  isActive={isDesktop && activeSquadConv?.id === conversation.id}
                />
              ))}
            </div>
          )
        ) : (
          // DM conversations
          dmConversations.length === 0 ? (
            <EmptyState
              type="no_messages"
              title="Pas encore de messages privés"
              message="Clique sur un membre de ta squad pour lui envoyer un message."
            />
          ) : filteredDMConvs.length === 0 ? (
            <EmptyState
              type="no_search_results"
              title="Aucun contact trouve"
              message="Essaie avec d'autres mots-clés"
            />
          ) : (
            <div className="space-y-1">
              {filteredDMConvs.map(conversation => (
                <DMConversationCard
                  key={conversation.other_user_id}
                  conversation={conversation}
                  onClick={() => setActiveDMConv(conversation)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )

  // ========== COMPOSANT VUE CHAT ==========
  const ChatView = ({ embedded = false }: { embedded?: boolean }) => (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-screen'} bg-[#050506]`}>
      {/* Header chat */}
      <div className={`flex-shrink-0 px-4 py-3 border-b border-[rgba(255,255,255,0.06)] ${embedded ? '' : 'bg-[#101012]/80 backdrop-blur-xl'}`}>
        <div className={`flex items-center gap-3 ${embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}`}>
          {!embedded && (
            <button
              onClick={handleBack}
              aria-label="Retour"
              className="p-2 -ml-2 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#8b8d90]" aria-hidden="true" />
            </button>
          )}

          {isSquadChat && activeSquadConv ? (
            // Squad chat header
            <>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                activeSquadConv.type === 'session'
                  ? 'bg-[rgba(251,191,36,0.15)]'
                  : 'bg-[rgba(99,102,241,0.15)]'
              }`}>
                {activeSquadConv.type === 'session' ? (
                  <Gamepad2 className="w-5 h-5 text-[#fbbf24]" />
                ) : (
                  <Users className="w-5 h-5 text-[#6366f1]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-[#f7f8f8] truncate">{chatName}</h2>
                <p className="text-[12px] text-[#5e6063]">{chatSubtitle}</p>
              </div>
            </>
          ) : activeDMConv ? (
            // DM chat header
            <>
              <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-[rgba(99,102,241,0.15)]">
                {activeDMConv.other_user_avatar_url ? (
                  <img
                    src={activeDMConv.other_user_avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[14px] font-bold text-[#6366f1]">
                    {activeDMConv.other_user_username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-[#f7f8f8] truncate">{chatName}</h2>
                <p className="text-[12px] text-[#5e6063]">{chatSubtitle}</p>
              </div>
              {/* Call button for DM */}
              <button
                onClick={() => {
                  if (activeDMConv) {
                    useVoiceCallStore.getState().startCall(
                      activeDMConv.other_user_id,
                      activeDMConv.other_user_username,
                      activeDMConv.other_user_avatar_url
                    )
                  }
                }}
                className="p-2.5 rounded-xl bg-[rgba(34,197,94,0.1)] hover:bg-[rgba(34,197,94,0.2)] transition-colors"
                aria-label={`Appeler ${activeDMConv.other_user_username}`}
              >
                <Phone className="w-5 h-5 text-[#34d399]" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Pinned Messages Section - Phase 3.2 */}
      {isSquadChat && pinnedMessages.length > 0 && (
        <PinnedMessages
          pinnedMessages={pinnedMessages}
          currentUserId={user?.id || ''}
          isAdmin={isAdmin}
          onUnpin={(messageId) => handlePinMessage(messageId, false)}
          onScrollToMessage={scrollToMessage}
        />
      )}

      {/* Zone messages - Virtual scrolling for large lists */}
      {isLoading && messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}>
            <MessageListSkeleton count={10} />
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}>
            <EmptyState
              type="no_messages"
              title="Nouvelle conversation"
              message="Envoie le premier message !"
            />
          </div>
        </div>
      ) : messages.length >= VIRTUALIZATION_THRESHOLD ? (
        // Virtualized rendering for large message lists (50+)
        <div className="flex-1 relative flex flex-col">
          <VirtualizedMessages
            messages={messages}
            userId={user?.id}
            isSquadChat={isSquadChat}
            isAdmin={isAdmin}
            onEditMessage={setEditingMessage}
            onDeleteMessage={handleDeleteMessage}
            onPinMessage={handlePinMessage}
            onReplyMessage={handleReply}
            onScrollToMessage={scrollToMessage}
            getMessageDate={getMessageDate}
            containerRef={messagesContainerRef}
            endRef={messagesEndRef}
            onScroll={handleScroll}
          />
          {/* Typing Indicator */}
          <AnimatePresence>
            {typingText && (
              <div className="px-4 pb-2">
                <TypingIndicator text={typingText} />
              </div>
            )}
          </AnimatePresence>
          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={scrollToBottom}
                className={`${embedded ? 'absolute' : 'fixed'} bottom-28 right-6 w-10 h-10 bg-[#6366f1] hover:bg-[#7c7ffa] rounded-full flex items-center justify-center shadow-md shadow-[rgba(99,102,241,0.15)] transition-colors z-50`}
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // Standard rendering for small message lists (<50)
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 relative"
        >
          <div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}>
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id
                const prevMessage = messages[index - 1]
                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id
                const showName = showAvatar && isSquadChat

                const messageDate = getMessageDate(message.created_at)
                const prevMessageDate = prevMessage ? getMessageDate(prevMessage.created_at) : ''
                const showDateSeparator = messageDate !== prevMessageDate

                const replyToId = 'reply_to_id' in message ? message.reply_to_id : null
                const replyToMessage = replyToId
                  ? messages.find(m => m.id === replyToId)
                  : null
                const replyToData = replyToMessage ? {
                  id: replyToMessage.id,
                  sender_id: replyToMessage.sender_id,
                  sender_username: replyToMessage.sender?.username || 'Utilisateur',
                  sender_avatar: replyToMessage.sender?.avatar_url || undefined,
                  content: replyToMessage.content
                } : null

                return (
                  <div key={message.id} id={`message-${message.id}`} className="transition-interactive">
                    {showDateSeparator && (
                      <DateSeparator date={message.created_at} />
                    )}
                    <MessageBubble
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showName={showName}
                      currentUserId={user?.id || ''}
                      isSquadChat={isSquadChat}
                      isAdmin={isAdmin}
                      onEdit={setEditingMessage}
                      onDelete={handleDeleteMessage}
                      onPin={handlePinMessage}
                      onReply={handleReply}
                      replyToMessage={replyToData}
                      onScrollToMessage={scrollToMessage}
                    />
                  </div>
                )
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {typingText && (
                <TypingIndicator text={typingText} />
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={scrollToBottom}
                className={`${embedded ? 'absolute' : 'fixed'} bottom-28 right-6 w-10 h-10 bg-[#6366f1] hover:bg-[#7c7ffa] rounded-full flex items-center justify-center shadow-md shadow-[rgba(99,102,241,0.15)] transition-colors z-50`}
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Input message */}
      <div className={`flex-shrink-0 px-4 py-3 ${embedded ? 'pb-3' : 'pb-6'} border-t border-[rgba(255,255,255,0.06)] ${embedded ? '' : 'bg-[#101012]/80 backdrop-blur-xl'}`}>
        <div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}>
          {/* Reply Composer - Phase 3.3 */}
          <ReplyComposer
            replyingTo={replyingTo ? {
              id: replyingTo.id,
              sender_username: replyingTo.sender,
              content: replyingTo.content
            } : null}
            onCancel={cancelReply}
          />

          <form onSubmit={handleSendMessage}>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleMessageChange}
                  placeholder={isSquadChat ? 'Message à la squad...' : `Message à ${chatName}...`}
                  className="w-full h-12 px-4 bg-[#18191b] border border-[rgba(255,255,255,0.06)] rounded-xl text-[14px] text-[#f7f8f8] placeholder:text-[#5e6063] focus:outline-none focus:border-[rgba(99,102,241,0.5)] transition-colors"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  inputMode="text"
                />
              </div>
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="w-12 h-12 p-0 rounded-xl"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={!!editingMessage}
        message={editingMessage || { id: '', content: '' }}
        onSave={handleEditMessage}
        onClose={() => setEditingMessage(null)}
      />
    </div>
  )

  // ========== PLACEHOLDER VUE DESKTOP SANS CHAT ==========
  const EmptyChatPlaceholder = () => (
    <div className="h-full flex items-center justify-center bg-[#050506]">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-10 h-10 text-[#6366f1]" />
        </div>
        <h3 className="text-[18px] font-semibold text-[#f7f8f8] mb-2">
          Sélectionne une conversation
        </h3>
        <p className="text-[14px] text-[#5e6063] max-w-[250px] mx-auto">
          Choisis une conversation dans la liste pour commencer à chatter.
        </p>
      </div>
    </div>
  )

  // ========== RENDU DESKTOP : SPLIT VIEW ==========
  if (isDesktop) {
    return (
      <>
        <MessageToast
          message={toast.message}
          isVisible={toast.visible}
          variant={toast.variant}
        />
        <div className="h-screen bg-[#050506] flex">
          {/* Sidebar gauche - Liste des conversations */}
          <div className="w-[340px] xl:w-[380px] flex-shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-[#101012]">
            {ConversationsList({ showOnDesktop: true })}
          </div>

          {/* Zone principale - Chat */}
          <div className="flex-1 min-w-0">
            {(activeSquadConv || activeDMConv) ? (
              ChatView({ embedded: true })
            ) : (
              EmptyChatPlaceholder()
            )}
          </div>
        </div>
      </>
    )
  }

  // ========== RENDU MOBILE : VUE CLASSIQUE ==========
  // Si pas de conversation active, afficher la liste
  if (!activeSquadConv && !activeDMConv) {
    return (
      <>
        <MessageToast
          message={toast.message}
          isVisible={toast.visible}
          variant={toast.variant}
        />
        <div className="min-h-0 bg-[#050506] pb-6">
          <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
            {ConversationsList({ showOnDesktop: false })}
          </div>
        </div>
      </>
    )
  }

  // Sinon afficher le chat
  return (
    <>
      <MessageToast
        message={toast.message}
        isVisible={toast.visible}
        variant={toast.variant}
      />
      {ChatView({ embedded: false })}
    </>
  )
}

export default Messages
