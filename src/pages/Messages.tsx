import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Users,
  Loader2,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { Button, Card, Input } from '../components/ui'
import { useMessagesStore } from '../hooks/useMessages'
import { useAuthStore } from '../hooks/useAuth'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

export function Messages() {
  const { user } = useAuthStore()
  const {
    messages,
    conversations,
    activeConversation,
    isLoading,
    fetchConversations,
    setActiveConversation,
    sendMessage,
    markAsRead,
    unsubscribe,
  } = useMessagesStore()

  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
    return () => unsubscribe()
  }, [fetchConversations, unsubscribe])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when opening a conversation
  useEffect(() => {
    if (activeConversation) {
      markAsRead(activeConversation.squad_id, activeConversation.session_id)
    }
  }, [activeConversation, markAsRead])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || isSending) return

    setIsSending(true)
    const { error } = await sendMessage(
      newMessage,
      activeConversation.squad_id,
      activeConversation.session_id
    )

    if (!error) {
      setNewMessage('')
    }
    setIsSending(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Conversation list view
  if (!activeConversation) {
    return (
      <div className="min-h-screen bg-[#08090a] pb-20 md:pb-8">
        <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-6">
              <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Messages</h1>
              <p className="text-[14px] text-[#8b8d90]">
                Discute avec tes squads en temps réel
              </p>
            </motion.div>

            {/* Conversations list */}
            {isLoading ? (
              <motion.div variants={itemVariants} className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
              </motion.div>
            ) : conversations.length === 0 ? (
              <motion.div variants={itemVariants}>
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[rgba(94,109,210,0.2)] to-[rgba(139,147,255,0.1)] flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-[#5e6dd2]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#f7f8f8] mb-2">
                    Pas encore de conversations
                  </h3>
                  <p className="text-[14px] text-[#8b8d90]">
                    Rejoins une squad pour commencer à discuter
                  </p>
                </Card>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="space-y-2">
                {conversations.map(conversation => (
                  <motion.div
                    key={conversation.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      className="p-4 cursor-pointer hover:bg-[#18191b] transition-colors"
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-[#f7f8f8] truncate">
                              {conversation.name}
                            </h3>
                            {conversation.last_message && (
                              <span className="text-[12px] text-[#5e6063] flex-shrink-0 ml-2">
                                {formatTime(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] text-[#8b8d90] truncate">
                              {conversation.last_message ? (
                                <>
                                  <span className="text-[#c9cace]">
                                    {conversation.last_message.sender?.username}:
                                  </span>{' '}
                                  {conversation.last_message.content}
                                </>
                              ) : (
                                'Aucun message'
                              )}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-[#5e6dd2] text-white text-[11px] font-bold rounded-full">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-[#5e6063] flex-shrink-0" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* AI tip */}
            <motion.div variants={itemVariants} className="mt-6">
              <Card className="p-4 bg-gradient-to-r from-[rgba(94,109,210,0.1)] to-transparent border-[#5e6dd2]/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#5e6dd2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] text-[#c9cace]">
                      <span className="text-[#5e6dd2] font-medium">Astuce IA :</span> Les messages
                      importants seront automatiquement mis en avant pour que tu ne rates rien.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Chat view
  return (
    <div className="h-screen bg-[#08090a] flex flex-col">
      {/* Chat header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[#101012]">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveConversation(null)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[#f7f8f8] truncate">
              {activeConversation.name}
            </h2>
            <p className="text-[12px] text-[#8b8d90]">
              {activeConversation.type === 'squad' ? 'Chat de squad' : 'Chat de session'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id
              const showAvatar = index === 0 ||
                messages[index - 1]?.sender_id !== message.sender_id

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar placeholder */}
                    {showAvatar && !isOwn && (
                      <div className="w-8 h-8 rounded-xl bg-[#18191b] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#5e6dd2]">
                        {message.sender?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {!showAvatar && !isOwn && <div className="w-8" />}

                    <div className={`${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && !isOwn && (
                        <span className="text-[11px] text-[#5e6063] mb-1 ml-1">
                          {message.sender?.username}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? 'bg-[#5e6dd2] text-white rounded-br-md'
                            : 'bg-[#18191b] text-[#f7f8f8] rounded-bl-md'
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
            })}
          </AnimatePresence>

          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-[#5e6063] mx-auto mb-3" />
              <p className="text-[#8b8d90]">Aucun message pour l'instant</p>
              <p className="text-[13px] text-[#5e6063] mt-1">
                Sois le premier à écrire !
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[#101012]">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écris un message..."
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-4"
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
