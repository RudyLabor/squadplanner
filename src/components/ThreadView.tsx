import { useState, useRef, useEffect, memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  MessageSquare,
  Loader2,
} from './icons'
import { useThreads, useThreadInfo } from '../hooks/useThreads'
import { useAuthStore } from '../hooks/useAuth'

interface ThreadViewProps {
  threadId: string
  isOpen: boolean
  onClose: () => void
}

export const ThreadView = memo(function ThreadView({ threadId, isOpen, onClose }: ThreadViewProps) {
  const { user } = useAuthStore()
  const { messages, isLoading, sendReply, isSending } = useThreads(isOpen ? threadId : null)
  const { data: parentMessage } = useThreadInfo(threadId)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, messages.length])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return
    sendReply(newMessage.trim())
    setNewMessage('')
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-50 bg-bg-elevated border-l border-border-default flex flex-col shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <h3 className="text-md font-semibold text-text-primary">Thread</h3>
              <p className="text-xs text-text-tertiary">
                {parentMessage?.thread_reply_count || messages.length} réponse{(parentMessage?.thread_reply_count || messages.length) !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Parent message */}
          {parentMessage && (
            <div className="px-4 py-3 border-b border-border-default bg-bg-surface">
              <div className="flex items-center gap-2 mb-1">
                {parentMessage.sender_avatar ? (
                  <img src={parentMessage.sender_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center text-xs font-bold text-primary">
                    {parentMessage.sender_username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary">{parentMessage.sender_username}</span>
              </div>
              <p className="text-sm text-text-secondary line-clamp-3">{parentMessage.content}</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-text-quaternary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">Aucune réponse</p>
                <p className="text-xs text-text-quaternary mt-1">Sois le premier à répondre !</p>
              </div>
            ) : (
              messages.map(msg => {
                const isOwn = msg.sender_id === user?.id
                return (
                  <m.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <div className="flex-shrink-0">
                          {msg.sender_avatar ? (
                            <img src={msg.sender_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center text-xs font-bold text-primary">
                              {msg.sender_username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        {!isOwn && (
                          <span className="text-xs text-text-tertiary mb-0.5 block">{msg.sender_username}</span>
                        )}
                        <div className={`px-3 py-2 rounded-xl text-sm ${
                          isOwn
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-bg-surface text-text-primary rounded-bl-md'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-text-quaternary mt-0.5 block">
                          {formatTime(msg.created_at)}
                          {msg.edited_at && <span className="italic ml-1">(modifié)</span>}
                        </span>
                      </div>
                    </div>
                  </m.div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-4 py-3 border-t border-border-default">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Répondre dans le thread..."
                className="flex-1 px-4 py-2.5 bg-bg-surface border border-border-default rounded-xl text-sm text-text-primary placeholder-text-quaternary outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                aria-label="Envoyer"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </m.div>
      )}
    </AnimatePresence>
  )
})

// Thread indicator on a message bubble
export function ThreadIndicator({ replyCount, lastReplyAt, onClick }: { replyCount: number; lastReplyAt?: string | null; onClick: () => void }) {
  if (!replyCount || replyCount === 0) return null

  const timeAgo = lastReplyAt ? getRelativeTime(lastReplyAt) : ''

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-lg text-xs text-primary hover:bg-primary-10 transition-colors"
    >
      <MessageSquare className="w-3 h-3" />
      <span className="font-medium">{replyCount} réponse{replyCount !== 1 ? 's' : ''}</span>
      {timeAgo && <span className="text-text-quaternary">{timeAgo}</span>}
    </button>
  )
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}
