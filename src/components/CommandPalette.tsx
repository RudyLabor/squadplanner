import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Home, Users, Mic, MessageCircle, User, Calendar,
  Settings, Zap, HelpCircle, X, ArrowRight, Moon, Sun
} from 'lucide-react'
import { useSquadsStore, useSessionsStore, useViewTransitionNavigate } from '../hooks'
import { useThemeStore } from '../hooks/useTheme'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigation' | 'squads' | 'sessions' | 'actions'
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useViewTransitionNavigate()

  const { squads } = useSquadsStore()
  const { sessions } = useSessionsStore()
  const { mode, setMode, effectiveTheme } = useThemeStore()

  // Detect platform for keyboard shortcut display
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  const shortcutKey = isMac ? '⌘' : 'Ctrl'

  // Toggle theme: dark -> light -> system -> dark
  const toggleTheme = useCallback(() => {
    const nextMode = mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark'
    setMode(nextMode)
  }, [mode, setMode])

  // Close and reset
  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  // Navigation commands
  const navigationCommands: CommandItem[] = [
    { id: 'home', label: 'Accueil', description: 'Retour à la page principale', icon: Home, action: () => { navigate('/home'); close() }, category: 'navigation' },
    { id: 'squads', label: 'Mes Squads', description: 'Voir toutes mes squads', icon: Users, action: () => { navigate('/squads'); close() }, category: 'navigation' },
    { id: 'party', label: 'Party Vocale', description: 'Rejoindre une party', icon: Mic, action: () => { navigate('/party'); close() }, category: 'navigation' },
    { id: 'messages', label: 'Messages', description: 'Voir mes conversations', icon: MessageCircle, action: () => { navigate('/messages'); close() }, category: 'navigation' },
    { id: 'sessions', label: 'Sessions', description: 'Voir mes sessions', icon: Calendar, action: () => { navigate('/sessions'); close() }, category: 'navigation' },
    { id: 'profile', label: 'Mon Profil', description: 'Voir mon profil', icon: User, action: () => { navigate('/profile'); close() }, category: 'navigation' },
    { id: 'settings', label: 'Paramètres', description: 'Réglages de l\'app', icon: Settings, action: () => { navigate('/settings'); close() }, category: 'navigation' },
    { id: 'premium', label: 'Premium', description: 'Passer Premium', icon: Zap, action: () => { navigate('/premium'); close() }, category: 'navigation' },
  ]

  // Action commands
  const actionCommands: CommandItem[] = [
    {
      id: 'toggle-theme',
      label: 'Changer le thème',
      description: `Actuel: ${mode === 'system' ? 'Auto' : mode === 'dark' ? 'Sombre' : 'Clair'}`,
      icon: effectiveTheme === 'dark' ? Moon : Sun,
      action: () => { toggleTheme(); close() },
      category: 'actions'
    },
  ]

  // Squad commands
  const squadCommands: CommandItem[] = squads.slice(0, 5).map(squad => ({
    id: `squad-${squad.id}`,
    label: squad.name,
    description: squad.game || 'Squad',
    icon: Users,
    action: () => { navigate(`/squad/${squad.id}`); close() },
    category: 'squads' as const
  }))

  // Session commands
  const sessionCommands: CommandItem[] = sessions.slice(0, 5).map(session => ({
    id: `session-${session.id}`,
    label: session.title || 'Session',
    description: new Date(session.scheduled_at).toLocaleDateString('fr-FR'),
    icon: Calendar,
    action: () => { navigate(`/session/${session.id}`); close() },
    category: 'sessions' as const
  }))

  // All commands
  const allCommands = [...navigationCommands, ...actionCommands, ...squadCommands, ...sessionCommands]

  // Filter commands based on query
  const filteredCommands = query
    ? allCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands.slice(0, 8)

  // State for shortcuts help modal
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        return
      }

      // Close with Escape
      if (e.key === 'Escape') {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false)
          return
        }
        if (isOpen) {
          close()
          return
        }
      }

      // Global shortcuts (only when not typing and palette is closed)
      if (!isTyping && !isOpen) {
        switch (e.key.toLowerCase()) {
          case 'n':
            // N → New session (go to sessions page)
            e.preventDefault()
            navigate('/sessions?new=true')
            break
          case 's':
            // S → Squads
            e.preventDefault()
            navigate('/squads')
            break
          case 'm':
            // M → Messages
            e.preventDefault()
            navigate('/messages')
            break
          case 'p':
            // P → Party
            e.preventDefault()
            navigate('/party')
            break
          case 'h':
            // H → Home
            e.preventDefault()
            navigate('/home')
            break
          case 't':
            // T → Toggle theme
            e.preventDefault()
            toggleTheme()
            break
          case '?':
            // ? → Show shortcuts help
            e.preventDefault()
            setShowShortcutsHelp(true)
            break
        }
      }

      // Navigate with arrows when palette is open
      if (isOpen && filteredCommands.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          filteredCommands[selectedIndex]?.action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showShortcutsHelp, filteredCommands, selectedIndex, close, navigate, toggleTheme])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Group commands by category for display
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    squads: 'Squads',
    sessions: 'Sessions',
    actions: 'Actions'
  }

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101]"
          >
            <div className="mx-4 bg-[#101012] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <Search className="w-5 h-5 text-[#6366f1]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Rechercher une commande, squad, session..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] text-[#f7f8f8] placeholder-[#5e6063] outline-none"
                />
                <button
                  onClick={close}
                  aria-label="Fermer la palette de commandes"
                  className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <X className="w-4 h-4 text-[#5e6063]" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <HelpCircle className="w-8 h-8 text-[#5e6063] mx-auto mb-2" />
                    <p className="text-[14px] text-[#8b8d90]">Aucun résultat pour "{query}"</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category} className="mb-2">
                      <div className="px-4 py-1.5">
                        <span className="text-[11px] font-semibold text-[#5e6063] uppercase tracking-wider">
                          {categoryLabels[category]}
                        </span>
                      </div>
                      {commands.map((cmd) => {
                        const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id)
                        const isSelected = globalIndex === selectedIndex

                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isSelected
                                ? 'bg-[rgba(99,102,241,0.15)]'
                                : 'hover:bg-[rgba(255,255,255,0.03)]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-[#6366f1]' : 'bg-[rgba(255,255,255,0.05)]'
                            }`}>
                              <cmd.icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#8b8d90]'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[14px] truncate ${isSelected ? 'text-[#f7f8f8]' : 'text-[#8b8d90]'}`}>
                                {cmd.label}
                              </p>
                              {cmd.description && (
                                <p className="text-[12px] text-[#5e6063] truncate">
                                  {cmd.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-[#6366f1]" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-4 text-[11px] text-[#5e6063]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] font-mono">↑↓</kbd>
                    naviguer
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] font-mono">↵</kbd>
                    sélectionner
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] font-mono">esc</kbd>
                    fermer
                  </span>
                </div>
                <kbd className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[11px] text-[#5e6063] font-mono">
                  {shortcutKey} K
                </kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Shortcuts Help Modal */}
    <AnimatePresence>
      {showShortcutsHelp && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcutsHelp(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] mx-4"
          >
            <div className="bg-[#101012] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <h2 className="text-[16px] font-semibold text-[#f7f8f8]">Raccourcis clavier</h2>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <X className="w-4 h-4 text-[#5e6063]" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-[11px] font-semibold text-[#5e6063] uppercase tracking-wider mb-2">Navigation</h3>
                  <div className="space-y-2">
                    {[
                      { key: 'H', action: 'Accueil' },
                      { key: 'S', action: 'Squads' },
                      { key: 'M', action: 'Messages' },
                      { key: 'P', action: 'Party vocale' },
                      { key: 'N', action: 'Nouvelle session' },
                      { key: 'T', action: 'Changer le thème' },
                    ].map(({ key, action }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#8b8d90]">{action}</span>
                        <kbd className="px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[12px] font-mono text-[#f7f8f8]">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-[#5e6063] uppercase tracking-wider mb-2">Global</h3>
                  <div className="space-y-2">
                    {[
                      { key: `${shortcutKey} K`, action: 'Palette de commandes' },
                      { key: '?', action: 'Afficher cette aide' },
                      { key: 'Esc', action: 'Fermer les modals' },
                    ].map(({ key, action }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#8b8d90]">{action}</span>
                        <kbd className="px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[12px] font-mono text-[#f7f8f8]">{key}</kbd>
                      </div>
                    ))}
                  </div>
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

export default CommandPalette
