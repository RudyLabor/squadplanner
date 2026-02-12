'use client'

import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from './icons'
import {
  type FAQItem,
  type ChatMessage,
  QUICK_ACTIONS,
  GREETING_MESSAGE,
  findBestMatch,
  getNoMatchResponse,
} from './help/chatbotUtils'
import { ChatPanel } from './help/ChatPanel'

interface HelpChatbotProps {
  faqItems: FAQItem[]
}

export function HelpChatbot({ faqItems }: HelpChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleBotReply = useCallback(
    (userText: string) => {
      setIsTyping(true)
      const match = findBestMatch(userText, faqItems)
      const replyText = match || getNoMatchResponse()

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: `bot-${Date.now()}`, role: 'bot', text: replyText, timestamp: Date.now() },
        ])
        setIsTyping(false)
      }, 800)
    },
    [faqItems]
  )

  const handleSend = useCallback(() => {
    const text = inputText.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', text, timestamp: Date.now() },
    ])
    setInputText('')
    handleBotReply(text)
  }, [inputText, handleBotReply])

  const handleQuickAction = useCallback(
    (action: string) => {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: action, timestamp: Date.now() },
      ])
      handleBotReply(action)
    },
    [handleBotReply]
  )

  const showQuickActions = messages.length <= 1

  return (
    <>
      {/* Floating chat bubble button */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
        <AnimatePresence>
          {showHint && !isOpen && (
            <m.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-surface-card border border-border-subtle rounded-xl px-3 py-2 shadow-lg text-sm text-text-primary"
            >
              Besoin d'aide ?
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-surface-card border-r border-b border-border-subtle rotate-[-45deg]" />
            </m.div>
          )}
        </AnimatePresence>

        <m.button
          onClick={() => {
            setIsOpen(!isOpen)
            setShowHint(false)
          }}
          className="relative w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/25 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <m.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </m.div>
            ) : (
              <m.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6" />
              </m.div>
            )}
          </AnimatePresence>

          {!isOpen && (
            <span
              className="absolute inset-0 rounded-full bg-primary/30 animate-ping pointer-events-none"
              style={{ animationDuration: '2.5s' }}
            />
          )}
        </m.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <ChatPanel
              messages={messages}
              inputText={inputText}
              setInputText={setInputText}
              isTyping={isTyping}
              showQuickActions={showQuickActions}
              onSend={handleSend}
              onQuickAction={handleQuickAction}
              onClose={() => setIsOpen(false)}
              quickActions={QUICK_ACTIONS}
            />
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default HelpChatbot
