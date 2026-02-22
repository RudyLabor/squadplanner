import { useRef, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Send, ChevronRight } from '../icons'
import type { ChatMessage } from './chatbotUtils'

interface ChatPanelProps {
  messages: ChatMessage[]
  inputText: string
  setInputText: (text: string) => void
  isTyping: boolean
  showQuickActions: boolean
  onSend: () => void
  onQuickAction: (action: string) => void
  onClose: () => void
  quickActions: string[]
}

export function ChatPanel({
  messages,
  inputText,
  setInputText,
  isTyping,
  showQuickActions,
  onSend,
  onQuickAction,
  onClose,
  quickActions,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed z-50 bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl md:bottom-24 md:right-8 md:left-auto md:w-[400px] md:max-h-[560px] md:rounded-2xl"
    >
      <div className="flex flex-col h-full max-h-[85vh] md:max-h-[560px] bg-bg-base border border-border-subtle rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-surface-card shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              Assistant Squad Planner
            </h3>
            <p className="text-xs text-text-tertiary">
              {isTyping ? "En train d'écrire..." : 'En ligne'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover transition-colors"
            aria-label="Fermer le chat"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
          {messages.map((msg) => (
            <m.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-surface-card border border-border-subtle text-text-primary rounded-bl-md'}`}
              >
                {msg.text}
              </div>
            </m.div>
          ))}

          <AnimatePresence>
            {isTyping && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex justify-start"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-surface-card border border-border-subtle rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </m.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showQuickActions && !isTyping && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-1.5 pt-1"
              >
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => onQuickAction(action)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 border border-primary/15 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {action}
                  </button>
                ))}
              </m.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border-subtle bg-surface-card px-3 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question..."
              className="flex-1 h-10 px-4 rounded-xl bg-bg-base border border-border-subtle text-sm text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
              disabled={isTyping}
            />
            <m.button
              onClick={onSend}
              disabled={!inputText.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </m.button>
          </div>
        </div>
      </div>
    </m.div>
  )
}
