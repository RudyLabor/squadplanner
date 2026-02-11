import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'

export interface MentionUser {
  id: string
  username: string
  avatar_url?: string | null
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  members: MentionUser[]
  inputRef?: React.RefObject<HTMLInputElement | null>
}

/**
 * MentionInput — Phase 3.1
 * Text input with @mention autocomplete.
 * When user types '@', shows a dropdown of squad members filtered by typed text.
 */
export const MentionInput = memo(function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  members,
  inputRef: externalRef,
}: MentionInputProps) {
  const [mentionQuery, setMentionQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const internalRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const ref = externalRef || internalRef

  // Filter members by query
  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 6)

  // Detect @ trigger while typing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0

    onChange(newValue)

    // Find the last @ before cursor
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex >= 0) {
      // Check if @ is at start or preceded by space
      const charBefore = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' '
      if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1)
        // Only show suggestions if no space in query (single word)
        if (!query.includes(' ')) {
          setMentionQuery(query)
          setMentionStart(lastAtIndex)
          setShowSuggestions(true)
          setSelectedIndex(0)
          return
        }
      }
    }

    setShowSuggestions(false)
  }, [onChange])

  // Insert selected mention
  const insertMention = useCallback((member: MentionUser) => {
    if (mentionStart < 0) return

    const before = value.slice(0, mentionStart)
    const after = value.slice(mentionStart + 1 + mentionQuery.length)
    const newValue = `${before}@${member.username} ${after}`

    onChange(newValue)
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(-1)

    // Focus input and set cursor after mention
    setTimeout(() => {
      const input = ref.current
      if (input) {
        input.focus()
        const pos = before.length + member.username.length + 2 // @username + space
        input.setSelectionRange(pos, pos)
      }
    }, 0)
  }, [value, mentionStart, mentionQuery, onChange, ref])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredMembers.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => (i + 1) % filteredMembers.length)
          return
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => (i - 1 + filteredMembers.length) % filteredMembers.length)
          return
        case 'Tab':
        case 'Enter':
          e.preventDefault()
          insertMention(filteredMembers[selectedIndex])
          return
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          return
      }
    }

    // Send on Enter (no Shift)
    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
      e.preventDefault()
      onSubmit()
    }
  }, [showSuggestions, filteredMembers, selectedIndex, insertMention, onSubmit])

  // Close suggestions on click outside
  useEffect(() => {
    if (!showSuggestions) return
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSuggestions])

  // Scroll selected item into view
  useEffect(() => {
    if (!showSuggestions || !suggestionsRef.current) return
    const items = suggestionsRef.current.querySelectorAll('[data-suggestion]')
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex, showSuggestions])

  return (
    <div className="relative flex-1">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-12 px-4 bg-bg-surface border border-border-default rounded-xl text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="send"
        inputMode="text"
      />

      {/* Mention suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && filteredMembers.length > 0 && (
          <m.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute bottom-full mb-2 left-0 right-0 max-h-[240px] overflow-y-auto bg-surface-dark border border-border-hover rounded-xl shadow-2xl shadow-black/50 py-1.5 z-50"
          >
            <p className="px-3 py-1 text-sm text-text-tertiary uppercase tracking-wider">
              Membres
            </p>
            {filteredMembers.map((member, i) => (
              <button
                key={member.id}
                data-suggestion
                onClick={() => insertMention(member)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  i === selectedIndex
                    ? 'bg-primary-15'
                    : 'hover:bg-border-default'
                }`}
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary-20 flex items-center justify-center text-xs font-bold text-primary-hover flex-shrink-0">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-base text-text-primary truncate">
                  {member.username}
                </span>
                {i === selectedIndex && (
                  <span className="ml-auto text-sm text-text-tertiary font-mono">
                    Tab
                  </span>
                )}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default MentionInput
