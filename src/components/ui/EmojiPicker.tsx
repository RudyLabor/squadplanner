'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Search, X, Clock } from '../icons'
// Emoji categories with curated gaming-friendly selections
const EMOJI_CATEGORIES = {
  recent: { icon: '🕐', label: 'Récents' },
  smileys: { icon: '😀', label: 'Smileys' },
  gaming: { icon: '🎮', label: 'Gaming' },
  gestures: { icon: '👍', label: 'Gestes' },
  hearts: { icon: '❤️', label: 'Cœurs' },
  objects: { icon: '🎯', label: 'Objets' },
  symbols: { icon: '✅', label: 'Symboles' },
} as const

type Category = keyof typeof EMOJI_CATEGORIES

const EMOJIS: Record<Exclude<Category, 'recent'>, string[]> = {
  smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '😊',
    '😇',
    '🥰',
    '😍',
    '🤩',
    '😘',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😝',
    '🤑',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '😐',
    '😑',
    '😶',
    '🫡',
    '😏',
    '😒',
    '🙄',
    '😬',
    '😮‍💨',
    '🤥',
    '😌',
    '😔',
    '😪',
    '🤤',
    '😴',
    '😷',
    '🤒',
    '🤕',
    '🤢',
    '🤮',
    '🥵',
    '🥶',
    '🥴',
    '😵',
    '🤯',
    '🤠',
    '🥳',
    '🥸',
    '😎',
    '🤓',
    '🧐',
    '😤',
    '😠',
    '😡',
    '🤬',
    '😈',
    '👿',
    '💀',
    '☠️',
    '💩',
    '🤡',
    '👹',
    '👺',
    '👻',
    '👽',
    '🫠',
    '🫢',
    '🫣',
    '🫤',
    '🫥',
    '🫨',
  ],
  gaming: [
    '🎮',
    '🕹️',
    '👾',
    '🎯',
    '🏆',
    '🥇',
    '🥈',
    '🥉',
    '🏅',
    '🎖️',
    '⚔️',
    '🗡️',
    '🛡️',
    '🏹',
    '🔫',
    '💣',
    '🧨',
    '🪓',
    '⚡',
    '🔥',
    '💥',
    '✨',
    '🌟',
    '⭐',
    '🎲',
    '🃏',
    '🀄',
    '🎪',
    '🎨',
    '🎭',
    '🚀',
    '🛸',
    '🤖',
    '🦾',
    '🧠',
    '👁️',
    '💪',
    '🦸',
    '🦹',
    '🧙',
    '🧝',
    '🧛',
    '🧟',
    '🐉',
    '🦅',
    '🐺',
    '🦊',
    '🐍',
    '🦂',
    '🕷️',
  ],
  gestures: [
    '👍',
    '👎',
    '👊',
    '✊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '🤝',
    '🤲',
    '👐',
    '✋',
    '🤚',
    '🖐️',
    '🖖',
    '🫱',
    '🫲',
    '🫳',
    '🫴',
    '👋',
    '🤙',
    '💪',
    '🦾',
    '🖕',
    '✌️',
    '🤞',
    '🫰',
    '🤟',
    '🤘',
    '🤏',
    '👌',
    '🤌',
    '👈',
    '👉',
    '👆',
    '👇',
    '☝️',
    '🫵',
  ],
  hearts: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❤️‍🔥',
    '❤️‍🩹',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
    '♥️',
    '🫶',
  ],
  objects: [
    '🎵',
    '🎶',
    '🎤',
    '🎧',
    '🎸',
    '🥁',
    '🎹',
    '🎺',
    '🎻',
    '📱',
    '💻',
    '🖥️',
    '⌨️',
    '🖱️',
    '💾',
    '📸',
    '📹',
    '🔦',
    '💡',
    '🔋',
    '🪫',
    '📡',
    '🔑',
    '🗝️',
    '🔒',
    '🔓',
    '🏠',
    '🏢',
    '🏰',
    '🌍',
    '🌈',
    '☀️',
    '🌙',
    '⭐',
    '🍕',
    '🍔',
    '🌮',
    '🍣',
    '🍩',
    '🧋',
    '🍺',
    '🍷',
    '☕',
    '🧃',
  ],
  symbols: [
    '✅',
    '❌',
    '⭕',
    '❗',
    '❓',
    '‼️',
    '⁉️',
    '💯',
    '🔴',
    '🟠',
    '🟡',
    '🟢',
    '🔵',
    '🟣',
    '⚫',
    '⚪',
    '🟤',
    '🔶',
    '🔷',
    '💠',
    '🔘',
    '🔳',
    '🔲',
    '▪️',
    '▫️',
    '◻️',
    '◼️',
    '⬛',
    '⬜',
    '🏳️',
    '🏴',
    '🚩',
    '♻️',
    '🔱',
    '📛',
    '🔰',
    '⚠️',
    '🚫',
    '🛑',
    '📌',
  ],
}

const RECENT_STORAGE_KEY = 'sq-recent-emojis'
const MAX_RECENT = 24

interface EmojiPickerProps {
  isOpen: boolean
  onSelect: (emoji: string) => void
  onClose: () => void
  position?: 'top' | 'bottom'
  align?: 'left' | 'right'
}

export function EmojiPicker({
  isOpen,
  onSelect,
  onClose,
  position = 'bottom',
  align = 'right',
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('smileys')
  const [search, setSearch] = useState('')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Load recent emojis from localStorage
  useEffect(() => {
    if (!isOpen) return
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY)
      if (stored) setRecentEmojis(JSON.parse(stored))
    } catch {
      /* empty */
    }
  }, [isOpen])

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 100)
    } else {
      setSearch('')
      setActiveCategory('smileys')
    }
  }, [isOpen])

  // Save to recent
  const addToRecent = useCallback((emoji: string) => {
    setRecentEmojis((prev) => {
      const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, MAX_RECENT)
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        /* empty */
      }
      return updated
    })
  }, [])

  const handleSelect = useCallback(
    (emoji: string) => {
      addToRecent(emoji)
      onSelect(emoji)
      onClose()
    },
    [addToRecent, onSelect, onClose]
  )

  // All emojis flat for search
  const allEmojis = useMemo(() => {
    return Object.values(EMOJIS).flat()
  }, [])

  // Filtered emojis based on search
  const displayedEmojis = useMemo(() => {
    if (search) {
      return allEmojis.filter((e) => e.includes(search))
    }
    if (activeCategory === 'recent') {
      return recentEmojis
    }
    return EMOJIS[activeCategory] || []
  }, [search, activeCategory, allEmojis, recentEmojis])

  // Scroll grid to top when category changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = 0
    }
  }, [activeCategory, search])

  const positionClasses = position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
  const alignClasses = align === 'left' ? 'left-0' : 'right-0'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[50]" onClick={onClose} aria-hidden="true" />

          {/* Picker */}
          <m.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute ${positionClasses} ${alignClasses} z-[51] w-[320px] bg-surface-dark border border-border-hover rounded-xl shadow-2xl shadow-black/50 overflow-hidden`}
          >
            {/* Search bar */}
            <div className="p-2 border-b border-border-default">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chercher un emoji..."
                  className="w-full pl-8 pr-8 py-1.5 bg-border-default border border-border-default rounded-lg text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            {!search && (
              <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border-default">
                {(Object.keys(EMOJI_CATEGORIES) as Category[]).map((cat) => {
                  const info = EMOJI_CATEGORIES[cat]
                  const isActive = activeCategory === cat
                  const isRecent = cat === 'recent'

                  // Hide recent tab if empty
                  if (isRecent && recentEmojis.length === 0) return null

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-1 py-1.5 rounded-md text-center transition-colors relative ${
                        isActive ? 'bg-primary/20' : 'hover:bg-border-default'
                      }`}
                      aria-label={info.label}
                      title={info.label}
                    >
                      <span className="text-base">
                        {isRecent ? (
                          <Clock className="w-4 h-4 mx-auto text-text-secondary" />
                        ) : (
                          info.icon
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Emoji grid */}
            <div
              ref={gridRef}
              className="h-[240px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border-hover scrollbar-track-transparent"
            >
              {/* Category label */}
              {!search && (
                <p className="text-sm text-text-tertiary uppercase tracking-wider px-1 mb-1.5">
                  {EMOJI_CATEGORIES[activeCategory].label}
                </p>
              )}

              {displayedEmojis.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                  {search ? 'Aucun résultat' : "Pas encore d'emojis récents"}
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-0.5">
                  {displayedEmojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => handleSelect(emoji)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-xl hover:bg-border-hover active:scale-90 transition-all touch-manipulation"
                      aria-label={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - currently hovered emoji name could go here */}
            <div className="px-3 py-1.5 border-t border-border-default text-sm text-text-tertiary">
              {search
                ? `${displayedEmojis.length} résultat${displayedEmojis.length !== 1 ? 's' : ''}`
                : EMOJI_CATEGORIES[activeCategory].label}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default EmojiPicker
