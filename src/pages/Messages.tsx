import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  ArrowLeft,
  Users,
  Loader2,
  Gamepad2,
  Search,
  Sparkles,
  User,
  Phone
} from 'lucide-react'
import { Button, Card } from '../components/ui'
import { useMessagesStore } from '../hooks/useMessages'
import { useDirectMessagesStore } from '../hooks/useDirectMessages'
import { useAuthStore } from '../hooks/useAuth'
import { useVoiceCallStore } from '../hooks/useVoiceCall'

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
      className={`w-full p-3 rounded-xl text-left transition-all ${
        isActive
          ? 'bg-[rgba(94,109,210,0.15)] border border-[rgba(94,109,210,0.3)]'
          : 'hover:bg-[#141517] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          conversation.type === 'session'
            ? 'bg-[rgba(245,166,35,0.15)]'
            : 'bg-[rgba(94,109,210,0.15)]'
        }`}>
          {conversation.type === 'session' ? (
            <Gamepad2 className="w-5 h-5 text-[#f5a623]" />
          ) : (
            <Users className="w-5 h-5 text-[#5e6dd2]" />
          )}
          {/* Unread indicator */}
          {conversation.unread_count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#5e6dd2] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
              <span className="text-[11px] text-[#5e6063] flex-shrink-0 ml-2">
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
      <span className="text-[11px] text-[#5e6063] font-medium uppercase tracking-wider">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
    </div>
  )
}

// Message bubble
function MessageBubble({ message, isOwn, showAvatar, showName }: {
  message: {
    id: string
    content: string
    created_at: string
    sender?: { username?: string; avatar_url?: string | null }
  }
  isOwn: boolean
  showAvatar: boolean
  showName: boolean
}) {
  const initial = message.sender?.username?.charAt(0).toUpperCase() || '?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
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
              <div className="w-8 h-8 rounded-full bg-[rgba(94,109,210,0.2)] flex items-center justify-center text-[11px] font-bold text-[#5e6dd2]">
                {initial}
              </div>
            )}
          </div>
        )}

        <div className={`${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          {showName && !isOwn && (
            <span className="text-[11px] text-[#8b8d90] mb-1 ml-1 font-medium">
              {message.sender?.username}
            </span>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isOwn
                ? 'bg-[#5e6dd2] text-white rounded-br-lg'
                : 'bg-[#1a1b1e] text-[#f7f8f8] rounded-bl-lg'
            }`}
          >
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <span className="text-[10px] text-[#5e6063] mt-1 mx-1">
            {formatTime(message.created_at)}
          </span>
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
      className="w-full p-3 rounded-xl text-left transition-all hover:bg-[#141517] border border-transparent"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-[rgba(94,109,210,0.15)]">
          {conversation.other_user_avatar_url ? (
            <img
              src={conversation.other_user_avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[14px] font-bold text-[#5e6dd2]">{initial}</span>
          )}
          {/* Unread indicator */}
          {conversation.unread_count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#5e6dd2] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
              <span className="text-[11px] text-[#5e6063] flex-shrink-0 ml-2">
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

  // Squad messages store
  const {
    messages: squadMessages,
    conversations: squadConversations,
    activeConversation: activeSquadConv,
    isLoading: isLoadingSquad,
    fetchConversations: fetchSquadConvs,
    setActiveConversation: setActiveSquadConv,
    sendMessage: sendSquadMessage,
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch conversations on mount
  useEffect(() => {
    fetchSquadConvs()
    fetchDMConvs()
    return () => {
      unsubscribeSquad()
      unsubscribeDM()
    }
  }, [fetchSquadConvs, fetchDMConvs, unsubscribeSquad, unsubscribeDM])

  // Scroll to bottom when messages change
  const currentMessages = activeSquadConv ? squadMessages : dmMessages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  // Focus input when entering chat
  useEffect(() => {
    if (activeSquadConv || activeDMConv) {
      setTimeout(() => inputRef.current?.focus(), 100)
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
      const { error } = await sendSquadMessage(
        newMessage,
        activeSquadConv.squad_id,
        activeSquadConv.session_id
      )
      if (!error) setNewMessage('')
    } else if (activeDMConv) {
      const { error } = await sendDMMessage(newMessage, activeDMConv.other_user_id)
      if (!error) setNewMessage('')
    }

    setIsSending(false)
  }

  const handleBack = () => {
    if (activeSquadConv) setActiveSquadConv(null)
    if (activeDMConv) setActiveDMConv(null)
  }

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

  // ========== LISTE DES CONVERSATIONS ==========
  if (!activeSquadConv && !activeDMConv) {
    return (
      <div className="min-h-screen bg-[#08090a] pb-24">
        <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-[24px] font-bold text-[#f7f8f8]">Messages</h1>
              {totalUnread > 0 && (
                <span className="px-2.5 py-1 bg-[#5e6dd2] text-white text-[12px] font-bold rounded-full">
                  {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#141517] rounded-xl mb-5">
            <button
              onClick={() => setActiveTab('squads')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'squads'
                  ? 'bg-[#1f2023] text-[#f7f8f8]'
                  : 'text-[#8b8d90] hover:text-[#f7f8f8]'
              }`}
            >
              <Users className="w-4 h-4" />
              Squads
              {squadUnread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-[#5e6dd2] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {squadUnread > 9 ? '9+' : squadUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dms')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'dms'
                  ? 'bg-[#1f2023] text-[#f7f8f8]'
                  : 'text-[#8b8d90] hover:text-[#f7f8f8]'
              }`}
            >
              <User className="w-4 h-4" />
              Privés
              {dmUnread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-[#5e6dd2] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {dmUnread > 9 ? '9+' : dmUnread}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e6063]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'squads' ? 'Rechercher une squad...' : 'Rechercher un contact...'}
              className="w-full h-11 pl-10 pr-4 bg-[#141517] border border-[rgba(255,255,255,0.06)] rounded-xl text-[14px] text-[#f7f8f8] placeholder:text-[#5e6063] focus:outline-none focus:border-[rgba(94,109,210,0.5)] transition-colors"
            />
          </div>

          {/* Liste conversations */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
            </div>
          ) : activeTab === 'squads' ? (
            // Squad conversations
            squadConversations.length === 0 ? (
              <Card className="p-8 text-center bg-[#0c0d0e]">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(94,109,210,0.1)] flex items-center justify-center mx-auto mb-5">
                  <Users className="w-8 h-8 text-[#5e6dd2]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[18px] font-semibold text-[#f7f8f8] mb-2">
                  Pas encore de squads
                </h3>
                <p className="text-[14px] text-[#8b8d90] max-w-[280px] mx-auto mb-5">
                  Rejoins une squad pour discuter avec tes potes.
                </p>
                <Button onClick={() => window.location.href = '/squads'}>
                  Voir mes squads
                </Button>
              </Card>
            ) : filteredSquadConvs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[14px] text-[#5e6063]">Aucune squad trouvée</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSquadConvs.map(conversation => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    onClick={() => setActiveSquadConv(conversation)}
                  />
                ))}
              </div>
            )
          ) : (
            // DM conversations
            dmConversations.length === 0 ? (
              <Card className="p-8 text-center bg-[#0c0d0e]">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(94,109,210,0.1)] flex items-center justify-center mx-auto mb-5">
                  <User className="w-8 h-8 text-[#5e6dd2]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[18px] font-semibold text-[#f7f8f8] mb-2">
                  Pas encore de messages privés
                </h3>
                <p className="text-[14px] text-[#8b8d90] max-w-[280px] mx-auto">
                  Clique sur un membre de ta squad pour lui envoyer un message.
                </p>
              </Card>
            ) : filteredDMConvs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[14px] text-[#5e6063]">Aucun contact trouvé</p>
              </div>
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
  }

  // Déterminer le contexte actuel (squad ou DM)
  const isSquadChat = !!activeSquadConv
  const messages = isSquadChat ? squadMessages : dmMessages
  const chatName = isSquadChat ? activeSquadConv.name : activeDMConv?.other_user_username
  const chatSubtitle = isSquadChat
    ? (activeSquadConv.type === 'squad' ? 'Chat de squad' : 'Chat de session')
    : 'Message privé'

  // ========== VUE CHAT ==========
  // Préparer les messages avec séparateurs de date
  let lastDate = ''

  return (
    <div className="h-screen bg-[#08090a] flex flex-col">
      {/* Header chat */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0c0d0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#8b8d90]" />
          </button>

          {isSquadChat ? (
            // Squad chat header
            <>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                activeSquadConv.type === 'session'
                  ? 'bg-[rgba(245,166,35,0.15)]'
                  : 'bg-[rgba(94,109,210,0.15)]'
              }`}>
                {activeSquadConv.type === 'session' ? (
                  <Gamepad2 className="w-5 h-5 text-[#f5a623]" />
                ) : (
                  <Users className="w-5 h-5 text-[#5e6dd2]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-[#f7f8f8] truncate">{chatName}</h2>
                <p className="text-[12px] text-[#5e6063]">{chatSubtitle}</p>
              </div>
            </>
          ) : (
            // DM chat header
            <>
              <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-[rgba(94,109,210,0.15)]">
                {activeDMConv?.other_user_avatar_url ? (
                  <img
                    src={activeDMConv.other_user_avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[14px] font-bold text-[#5e6dd2]">
                    {activeDMConv?.other_user_username?.charAt(0).toUpperCase() || '?'}
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
                title="Appeler"
              >
                <Phone className="w-5 h-5 text-[#22c55e]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && !isLoading ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(94,109,210,0.1)] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-[#5e6dd2]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">
                Nouvelle conversation
              </h3>
              <p className="text-[14px] text-[#5e6063]">
                Envoie le premier message !
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id
                const prevMessage = messages[index - 1]
                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id
                const showName = showAvatar && isSquadChat // Only show names in squad chats

                // Séparateur de date
                const messageDate = getMessageDate(message.created_at)
                const showDateSeparator = messageDate !== lastDate
                lastDate = messageDate

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <DateSeparator date={message.created_at} />
                    )}
                    <MessageBubble
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showName={showName}
                    />
                  </div>
                )
              })}
            </AnimatePresence>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input message */}
      <div className="flex-shrink-0 px-4 py-3 pb-6 border-t border-[rgba(255,255,255,0.06)] bg-[#0c0d0e]/80 backdrop-blur-xl">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isSquadChat ? 'Message à la squad...' : `Message à ${chatName}...`}
                className="w-full h-12 px-4 bg-[#141517] border border-[rgba(255,255,255,0.06)] rounded-xl text-[14px] text-[#f7f8f8] placeholder:text-[#5e6063] focus:outline-none focus:border-[rgba(94,109,210,0.5)] transition-colors"
                autoComplete="off"
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
  )
}

export default Messages
