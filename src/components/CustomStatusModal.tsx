/**
 * Phase 4.2.3 + 4.2.4 — Custom Status Modal
 * Set emoji + text + duration + game status
 */
import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Gamepad2 } from 'lucide-react'
import { useUserStatusStore } from '../hooks/useUserStatus'
import { useSquadsStore } from '../hooks/useSquads'

const QUICK_EMOJIS = ['😊', '🎮', '💤', '🔥', '🏆', '🎯', '🎧', '💪', '🍕', '📚', '🎵', '🏃']

const DURATION_OPTIONS = [
  { label: '1 heure', ms: 60 * 60 * 1000 },
  { label: '4 heures', ms: 4 * 60 * 60 * 1000 },
  { label: "Aujourd'hui", ms: null }, // calculated dynamically
  { label: 'Ne pas effacer', ms: 0 },
]

const POPULAR_GAMES = [
  'Valorant', 'League of Legends', 'Fortnite', 'Minecraft',
  'Apex Legends', 'CS2', 'Overwatch 2', 'Rocket League',
  'GTA V', 'FIFA', 'Call of Duty', 'Genshin Impact',
  'Roblox', 'Among Us', 'Dead by Daylight', 'Rainbow Six Siege',
]

interface CustomStatusModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CustomStatusModal = memo(function CustomStatusModal({ isOpen, onClose }: CustomStatusModalProps) {
  const { customStatus, gameStatus, setCustomStatus, setGameStatus } = useUserStatusStore()
  const { squads } = useSquadsStore()

  const [emoji, setEmoji] = useState(customStatus?.emoji || '😊')
  const [text, setText] = useState(customStatus?.text || '')
  const [durationIndex, setDurationIndex] = useState(3) // default: "don't clear"
  const [gameInput, setGameInput] = useState(gameStatus?.game || '')
  const [showGameSuggestions, setShowGameSuggestions] = useState(false)

  // Compute game suggestions from squad games + popular
  const squadGames = squads.map(s => s.game).filter(Boolean)
  const allGames = [...new Set([...squadGames, ...POPULAR_GAMES])]
  const filteredGames = gameInput
    ? allGames.filter(g => g.toLowerCase().includes(gameInput.toLowerCase()))
    : allGames.slice(0, 8)

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setEmoji(customStatus?.emoji || '😊')
      setText(customStatus?.text || '')
      setGameInput(gameStatus?.game || '')
      setDurationIndex(3)
    }
  }, [isOpen, customStatus, gameStatus])

  const handleSave = () => {
    // Custom status
    if (text.trim()) {
      let expiresAt: string | null = null
      const option = DURATION_OPTIONS[durationIndex]

      if (option.ms === null) {
        // "Today" — end of day
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)
        expiresAt = endOfDay.toISOString()
      } else if (option.ms > 0) {
        expiresAt = new Date(Date.now() + option.ms).toISOString()
      }
      // ms === 0 means "don't clear" → expiresAt stays null

      setCustomStatus({ emoji, text: text.trim(), expiresAt })
    } else {
      setCustomStatus(null)
    }

    // Game status
    setGameStatus(gameInput.trim() || null)

    onClose()
  }

  const handleClear = () => {
    setCustomStatus(null)
    setGameStatus(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#1a1b1e] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-[16px] font-semibold text-text-primary">Definir un statut</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-text-tertiary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Emoji + Text */}
              <div>
                <label className="text-[13px] text-text-tertiary font-medium mb-2 block">Statut personnalise</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-xl hover:bg-[rgba(255,255,255,0.08)] transition-colors flex-shrink-0"
                  >
                    {emoji}
                  </button>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 80))}
                    placeholder="Que fais-tu ?"
                    className="flex-1 h-12 px-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-[rgba(99,102,241,0.4)] transition-colors"
                    maxLength={80}
                  />
                </div>
                <div className="text-right text-[11px] text-text-quaternary mt-1">{text.length}/80</div>
              </div>

              {/* Quick emojis */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                      emoji === e
                        ? 'bg-[rgba(99,102,241,0.2)] ring-1 ring-[rgba(99,102,241,0.4)]'
                        : 'hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Duration */}
              <div>
                <label className="text-[13px] text-text-tertiary font-medium mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Effacer apres
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATION_OPTIONS.map((option, i) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setDurationIndex(i)}
                      className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        durationIndex === i
                          ? 'bg-[rgba(99,102,241,0.15)] text-[#818cf8] border border-[rgba(99,102,241,0.3)]'
                          : 'bg-[rgba(255,255,255,0.03)] text-text-secondary border border-transparent hover:bg-[rgba(255,255,255,0.06)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Status */}
              <div>
                <label className="text-[13px] text-text-tertiary font-medium mb-2 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Jeu en cours
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={gameInput}
                    onChange={(e) => {
                      setGameInput(e.target.value)
                      setShowGameSuggestions(true)
                    }}
                    onFocus={() => setShowGameSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowGameSuggestions(false), 200)}
                    placeholder="Ex: Valorant, League of Legends..."
                    className="w-full h-11 px-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-[rgba(99,102,241,0.4)] transition-colors"
                  />
                  {/* Autocomplete suggestions */}
                  {showGameSuggestions && filteredGames.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1b1e] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl overflow-hidden z-10 max-h-40 overflow-y-auto">
                      {filteredGames.map((game) => (
                        <button
                          key={game}
                          type="button"
                          onMouseDown={() => {
                            setGameInput(game)
                            setShowGameSuggestions(false)
                          }}
                          className="w-full px-3 py-2 text-left text-[13px] text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary transition-colors"
                        >
                          {game}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-[rgba(255,255,255,0.06)]">
              {(customStatus || gameStatus) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                >
                  Effacer
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-text-tertiary hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#6366f1] text-white hover:bg-[#7c7ffa] transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
