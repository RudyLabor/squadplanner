import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Sparkles, Send, ChevronRight } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
  category: string
}

interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  text: string
  timestamp: number
}

interface HelpChatbotProps {
  faqItems: FAQItem[]
}

const QUICK_ACTIONS = [
  'Creer une squad',
  'Score de fiabilite',
  'Party vocale',
  'Premium',
  'Supprimer mon compte',
]

const GREETING_MESSAGE: ChatMessage = {
  id: 'greeting',
  role: 'bot',
  text: 'Salut ! Je suis l\'assistant Squad Planner. Pose-moi une question sur l\'app !',
  timestamp: Date.now(),
}

const NO_MATCH_RESPONSE =
  "Je n'ai pas trouve de reponse precise. Tu peux contacter le support via le formulaire ci-dessus ou reformuler ta question."

/**
 * Normalize a string for keyword matching:
 * strips accents, lowercases, removes punctuation.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Simple keyword-based FAQ matcher.
 * Splits user input into words, scores each FAQ by how many
 * keywords appear in either question or answer.
 */
function findBestMatch(input: string, faqItems: FAQItem[]): string | null {
  const normalizedInput = normalize(input)
  const inputWords = normalizedInput.split(/\s+/).filter(w => w.length > 2)

  if (inputWords.length === 0) return null

  let bestScore = 0
  let bestAnswer: string | null = null

  for (const item of faqItems) {
    const normalizedQ = normalize(item.question)
    const normalizedA = normalize(item.answer)
    const combined = normalizedQ + ' ' + normalizedA

    let score = 0
    for (const word of inputWords) {
      if (combined.includes(word)) {
        // Bonus if keyword appears in the question (more relevant)
        score += normalizedQ.includes(word) ? 2 : 1
      }
    }

    // Normalize score by number of input words for fairness
    const normalizedScore = score / inputWords.length

    if (normalizedScore > bestScore) {
      bestScore = normalizedScore
      bestAnswer = item.answer
    }
  }

  // Require at least some minimum relevance
  if (bestScore < 1) return null
  return bestAnswer
}

export function HelpChatbot({ faqItems }: HelpChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Hide the hint badge after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleBotReply = useCallback((userText: string) => {
    setIsTyping(true)
    const match = findBestMatch(userText, faqItems)
    const replyText = match || NO_MATCH_RESPONSE

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: replyText,
          timestamp: Date.now(),
        },
      ])
      setIsTyping(false)
    }, 800)
  }, [faqItems])

  const handleSend = useCallback(() => {
    const text = inputText.trim()
    if (!text) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    handleBotReply(text)
  }, [inputText, handleBotReply])

  const handleQuickAction = useCallback((action: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: action,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    handleBotReply(action)
  }, [handleBotReply])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const showQuickActions = messages.length <= 1

  return (
    <>
      {/* Floating chat bubble button */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
        <AnimatePresence>
          {showHint && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-surface-card border border-border-subtle rounded-xl px-3 py-2 shadow-lg text-sm text-text-primary"
            >
              Besoin d'aide ?
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-surface-card border-r border-b border-border-subtle rotate-[-45deg]" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => { setIsOpen(!isOpen); setShowHint(false) }}
          className="relative w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/25 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
          )}
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed z-50
                bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl
                md:bottom-24 md:right-8 md:left-auto md:w-[400px] md:max-h-[560px] md:rounded-2xl
              "
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
                      {isTyping ? 'En train d\'ecrire...' : 'En ligne'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover transition-colors"
                    aria-label="Fermer le chat"
                  >
                    <X className="w-4 h-4 text-text-tertiary" />
                  </button>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
                  {messages.map((msg) => (
                    <motion.div
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
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-surface-card border border-border-subtle text-text-primary rounded-bl-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex justify-start"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="bg-surface-card border border-border-subtle rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick actions (only shown initially) */}
                  <AnimatePresence>
                    {showQuickActions && !isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-wrap gap-1.5 pt-1"
                      >
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action}
                            onClick={() => handleQuickAction(action)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 border border-primary/15 text-primary hover:bg-primary/10 transition-colors"
                          >
                            <ChevronRight className="w-3 h-3" />
                            {action}
                          </button>
                        ))}
                      </motion.div>
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
                    <motion.button
                      onClick={handleSend}
                      disabled={!inputText.trim() || isTyping}
                      className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Envoyer"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default HelpChatbot
