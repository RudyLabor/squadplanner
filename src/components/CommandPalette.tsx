import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Home, Users, Mic, MessageCircle, User, Calendar,
  Settings, Zap, HelpCircle, X, ArrowRight, Moon, Sun
} from 'lucide-react'
import { useSquadsStore, useSessionsStore, useViewTransitionNavigate } from '../hooks'
import { useThemeStore } from '../hooks/useTheme'
import { useCreateSessionModal } from './CreateSessionModal'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigation' | 'squads' | 'sessions' | 'actions'
  children?: CommandItem[]
  preview?: { type: 'squad' | 'session' | 'navigation' | 'action'; data?: Record<string, unknown> }
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [parentStack, setParentStack] = useState<CommandItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useViewTransitionNavigate()

  const { squads } = useSquadsStore()
  const { sessions } = useSessionsStore()
  const { mode, setMode, effectiveTheme } = useThemeStore()
  const createSessionModalOpen = useCreateSessionModal(s => s.isOpen)

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
    setParentStack([])
  }, [])

  // V3: Navigate back in sub-command stack
  const goBack = useCallback(() => {
    if (parentStack.length > 0) {
      setParentStack(prev => prev.slice(0, -1))
      setQuery('')
      setSelectedIndex(0)
      return true
    }
    return false
  }, [parentStack])

  // V3: Enter a sub-command
  const enterSubCommand = useCallback((cmd: CommandItem) => {
    if (cmd.children && cmd.children.length > 0) {
      setParentStack(prev => [...prev, cmd])
      setQuery('')
      setSelectedIndex(0)
    } else {
      cmd.action()
    }
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

  // Open create session modal
  const openCreateSession = useCreateSessionModal(s => s.open)

  // Action commands
  const actionCommands: CommandItem[] = [
    {
      id: 'create-session',
      label: 'Créer une session',
      description: 'Planifier une nouvelle session de jeu',
      icon: Calendar,
      action: () => { openCreateSession(); close() },
      category: 'actions'
    },
    {
      id: 'toggle-theme',
      label: 'Changer le thème',
      description: `Actuel: ${mode === 'system' ? 'Auto' : mode === 'dark' ? 'Sombre' : 'Clair'}`,
      icon: effectiveTheme === 'dark' ? Moon : Sun,
      action: () => { toggleTheme(); close() },
      category: 'actions'
    },
  ]

  // Squad commands with V3 sub-commands
  const squadCommands: CommandItem[] = squads.slice(0, 5).map(squad => ({
    id: `squad-${squad.id}`,
    label: squad.name,
    description: squad.game || 'Squad',
    icon: Users,
    action: () => { navigate(`/squad/${squad.id}`); close() },
    category: 'squads' as const,
    preview: { type: 'squad' as const, data: { name: squad.name, game: squad.game, id: squad.id } },
    children: [
      { id: `squad-${squad.id}-open`, label: 'Ouvrir', description: 'Voir la squad', icon: ArrowRight, action: () => { navigate(`/squad/${squad.id}`); close() }, category: 'squads' as const },
      { id: `squad-${squad.id}-chat`, label: 'Chat', description: 'Ouvrir le chat', icon: MessageCircle, action: () => { navigate('/messages'); close() }, category: 'squads' as const },
      { id: `squad-${squad.id}-party`, label: 'Party Vocale', description: 'Rejoindre la party', icon: Mic, action: () => { navigate('/party'); close() }, category: 'squads' as const },
    ],
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

  // V3: Get active commands (children if in sub-command, else root)
  const activeParent = parentStack[parentStack.length - 1]
  const activeCommands = activeParent?.children ?? allCommands

  // Fuzzy search scoring: characters must appear in order but not necessarily adjacent
  const fuzzyScore = useCallback((text: string, pattern: string): number => {
    const t = text.toLowerCase()
    const p = pattern.toLowerCase()
    if (t.includes(p)) return 100 + (p.length / t.length) * 50 // exact substring = high score
    let ti = 0, pi = 0, score = 0, streak = 0
    while (ti < t.length && pi < p.length) {
      if (t[ti] === p[pi]) {
        score += 10 + streak * 5
        // Bonus for match at word boundary
        if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-') score += 15
        streak++
        pi++
      } else {
        streak = 0
      }
      ti++
    }
    return pi === p.length ? score : 0
  }, [])

  // Recent commands (persisted in localStorage)
  const RECENT_KEY = 'squadplanner:recent-commands'
  const getRecentIds = useCallback((): string[] => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
  }, [])
  const addRecent = useCallback((id: string) => {
    const recent = getRecentIds().filter(r => r !== id)
    recent.unshift(id)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)))
  }, [getRecentIds])

  // Wrap enterSubCommand to track recent
  const originalEnterSubCommand = enterSubCommand
  const enterSubCommandWithRecent = useCallback((cmd: CommandItem) => {
    addRecent(cmd.id)
    originalEnterSubCommand(cmd)
  }, [originalEnterSubCommand, addRecent])

  // Filter commands with fuzzy search + recent sorting
  const filteredCommands = (() => {
    if (!query) {
      // No query: show recent commands first, then the rest
      const recentIds = getRecentIds()
      const recentCmds = recentIds.map(id => activeCommands.find(c => c.id === id)).filter(Boolean) as CommandItem[]
      const rest = activeCommands.filter(c => !recentIds.includes(c.id))
      return [...recentCmds, ...rest].slice(0, 10)
    }
    return activeCommands
      .map(cmd => ({
        cmd,
        score: Math.max(
          fuzzyScore(cmd.label, query),
          fuzzyScore(cmd.description || '', query) * 0.7
        ),
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.cmd)
  })()

  // State for shortcuts help modal
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Open with Cmd+K or Ctrl+K — blocked when CreateSessionModal is open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (createSessionModalOpen) return
        setIsOpen(prev => !prev)
        return
      }

      // Close with Escape (or go back in sub-commands)
      if (e.key === 'Escape') {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false)
          return
        }
        if (isOpen) {
          if (!goBack()) close()
          return
        }
      }

      // V3: Backspace on empty query goes back in sub-commands
      if (e.key === 'Backspace' && isOpen && query === '' && parentStack.length > 0) {
        e.preventDefault()
        goBack()
        return
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
          const cmd = filteredCommands[selectedIndex]
          if (cmd) enterSubCommandWithRecent(cmd)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showShortcutsHelp, filteredCommands, selectedIndex, close, navigate, toggleTheme, goBack, enterSubCommandWithRecent, query, parentStack, createSessionModalOpen])

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

  // Recent IDs must be computed before groupedCommands uses them
  const recentIds = getRecentIds()

  // Group commands by category for display (with "recent" pseudo-category)
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const cat = !query && recentIds.includes(cmd.id) ? 'recent' : cmd.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels: Record<string, string> = {
    recent: 'Récents',
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
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl lg:max-w-3xl z-[101]"
          >
            <div className="mx-4 bg-bg-surface border border-border-hover rounded-2xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border-default">
                {/* V3: Breadcrumb for sub-commands */}
                {parentStack.length > 0 && (
                  <button onClick={goBack} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 shrink-0 mr-1">
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    {parentStack.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && <span className="text-text-tertiary mx-0.5">/</span>}
                        {p.label}
                      </span>
                    ))}
                  </button>
                )}
                <Search className="w-5 h-5 text-primary" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Rechercher une commande, squad, session..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] text-text-primary placeholder-text-tertiary outline-none"
                />
                <button
                  onClick={close}
                  aria-label="Fermer la palette de commandes"
                  className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors"
                >
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>

              {/* V3: Two-column layout with preview */}
              <div className="flex">
              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2 flex-1 min-w-0">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <HelpCircle className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                    <p className="text-[14px] text-text-secondary">Aucun résultat pour "{query}"</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category} className="mb-2">
                      <div className="px-4 py-1.5">
                        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                          {categoryLabels[category]}
                        </span>
                      </div>
                      {commands.map((cmd) => {
                        const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id)
                        const isSelected = globalIndex === selectedIndex

                        return (
                          <button
                            key={cmd.id}
                            onClick={() => enterSubCommandWithRecent(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isSelected
                                ? 'bg-primary-15'
                                : 'hover:bg-surface-card'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-primary' : 'bg-border-subtle'
                            }`}>
                              <cmd.icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-text-secondary'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[14px] truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {cmd.label}
                              </p>
                              {cmd.description && (
                                <p className="text-[12px] text-text-tertiary truncate">
                                  {cmd.description}
                                </p>
                              )}
                            </div>
                            {cmd.children && cmd.children.length > 0 && (
                              <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
                            )}
                            {isSelected && !cmd.children && (
                              <ArrowRight className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* V3: Preview panel (desktop only) */}
              {(() => {
                const previewCmd = filteredCommands[selectedIndex]
                const preview = previewCmd?.preview
                if (!preview) return null
                return (
                  <div className="hidden lg:block w-64 border-l border-border-default p-4 max-h-[400px] overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={previewCmd.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <previewCmd.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-text-primary truncate">{previewCmd.label}</span>
                        </div>
                        {preview.data && typeof (preview.data as { game?: string }).game === 'string' && (
                          <div className="text-xs text-text-tertiary mb-2">
                            Jeu : <span className="text-text-secondary">{(preview.data as { game: string }).game}</span>
                          </div>
                        )}
                        {previewCmd.description && (
                          <p className="text-xs text-text-quaternary">{previewCmd.description}</p>
                        )}
                        {previewCmd.children && previewCmd.children.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border-default">
                            <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Actions</div>
                            {previewCmd.children.map(child => (
                              <div key={child.id} className="text-xs text-text-tertiary flex items-center gap-1.5 mb-1">
                                <child.icon className="w-3 h-3" />
                                {child.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )
              })()}
              </div>{/* end flex container */}

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-default bg-black/20">
                <div className="flex items-center gap-4 text-[11px] text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-border-subtle font-mono">↑↓</kbd>
                    naviguer
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-border-subtle font-mono">↵</kbd>
                    sélectionner
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-border-subtle font-mono">esc</kbd>
                    fermer
                  </span>
                </div>
                <kbd className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-border-subtle text-[11px] text-text-tertiary font-mono">
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
            <div className="bg-bg-surface border border-border-hover rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                <h2 className="text-[16px] font-semibold text-text-primary">Raccourcis clavier</h2>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors"
                >
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Navigation</h3>
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
                        <span className="text-[13px] text-text-secondary">{action}</span>
                        <kbd className="px-2 py-1 rounded bg-border-subtle text-[12px] font-mono text-text-primary">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Global</h3>
                  <div className="space-y-2">
                    {[
                      { key: `${shortcutKey} K`, action: 'Palette de commandes' },
                      { key: '?', action: 'Afficher cette aide' },
                      { key: 'Esc', action: 'Fermer les modals' },
                    ].map(({ key, action }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[13px] text-text-secondary">{action}</span>
                        <kbd className="px-2 py-1 rounded bg-border-subtle text-[12px] font-mono text-text-primary">{key}</kbd>
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
