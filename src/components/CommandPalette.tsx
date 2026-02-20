
import { useState, useEffect, useCallback, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Home,
  Users,
  Mic,
  MessageCircle,
  User,
  Calendar,
  Settings,
  Zap,
  X,
  ArrowRight,
  Moon,
  Sun,
} from './icons'
import { useSquadsStore, useSessionsStore, useViewTransitionNavigate } from '../hooks'
import { useThemeStore } from '../hooks/useTheme'
import { useCreateSessionModal } from './CreateSessionModal'
import { ShortcutsHelpModal } from './command-palette/ShortcutsHelpModal'
import { CommandPreviewPanel } from './command-palette/CommandPreviewPanel'
import { CommandResultList } from './command-palette/CommandResultList'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { queryKeys } from '../lib/queryClient'
import type { SessionWithDetails } from '../hooks/queries/useSessionsQuery'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigation' | 'squads' | 'sessions' | 'actions' | 'players'
  children?: CommandItem[]
  preview?: {
    type: 'squad' | 'session' | 'navigation' | 'action' | 'player'
    data?: Record<string, unknown>
  }
}

interface SearchedPlayer {
  id: string
  username: string
  avatar_url: string | null
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [parentStack, setParentStack] = useState<CommandItem[]>([])
  const [searchedPlayers, setSearchedPlayers] = useState<SearchedPlayer[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useViewTransitionNavigate()
  const queryClient = useQueryClient()

  const { squads } = useSquadsStore()
  const { sessions } = useSessionsStore()
  const { mode, setMode, effectiveTheme } = useThemeStore()
  const createSessionModalOpen = useCreateSessionModal((s) => s.isOpen)

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  const shortcutKey = isMac ? '⌘' : 'Ctrl'

  const toggleTheme = useCallback(() => {
    const nextMode = mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark'
    setMode(nextMode)
  }, [mode, setMode])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
    setParentStack([])
    setSearchedPlayers([])
  }, [])

  const goBack = useCallback(() => {
    if (parentStack.length > 0) {
      setParentStack((prev) => prev.slice(0, -1))
      setQuery('')
      setSelectedIndex(0)
      return true
    }
    return false
  }, [parentStack])

  const enterSubCommand = useCallback((cmd: CommandItem) => {
    if (cmd.children && cmd.children.length > 0) {
      setParentStack((prev) => [...prev, cmd])
      setQuery('')
      setSelectedIndex(0)
    } else {
      cmd.action()
    }
  }, [])

  // Navigation commands
  const navigationCommands: CommandItem[] = [
    {
      id: 'home',
      label: 'Accueil',
      description: 'Retour à la page principale',
      icon: Home,
      action: () => {
        navigate('/home')
        close()
      },
      category: 'navigation',
    },
    {
      id: 'squads',
      label: 'Mes Squads',
      description: 'Voir toutes mes squads',
      icon: Users,
      action: () => {
        navigate('/squads')
        close()
      },
      category: 'navigation',
    },
    {
      id: 'party',
      label: 'Party Vocale',
      description: 'Rejoindre une party',
      icon: Mic,
      action: () => {
        navigate('/party')
        close()
      },
      category: 'navigation',
    },
    {
      id: 'messages',
      label: 'Messages',
      description: 'Voir mes conversations',
      icon: MessageCircle,
      action: () => {
        navigate('/messages')
        close()
      },
      category: 'navigation',
    },
    {
      id: 'sessions',
      label: 'Sessions',
      description: 'Voir mes sessions',
      icon: Calendar,
      action: () => {
        navigate('/sessions')
        close()
      },
      category: 'navigation',
    },
    {
      id: 'profile',
      label: 'Mon Profil',
      description: 'Voir mon profil',
      icon: User,
      action: () => {
        navigate('/profile')
        close()
      },
      category: 'navigation',
    },
    {
      id: 'settings',
      label: 'Paramètres',
      description: "Réglages de l'app",
      icon: Settings,
      action: () => {
        navigate('/settings')
        close()
      },
      category: 'navigation',
    },
    {
      id: 'premium',
      label: 'Premium',
      description: 'Passer Premium',
      icon: Zap,
      action: () => {
        navigate('/premium')
        close()
      },
      category: 'navigation',
    },
  ]

  const openCreateSession = useCreateSessionModal((s) => s.open)

  const actionCommands: CommandItem[] = [
    {
      id: 'create-session',
      label: 'Créer une session',
      description: 'Planifier une nouvelle session de jeu',
      icon: Calendar,
      action: () => {
        openCreateSession()
        close()
      },
      category: 'actions',
    },
    {
      id: 'toggle-theme',
      label: 'Changer le thème',
      description: `Actuel: ${mode === 'system' ? 'Auto' : mode === 'dark' ? 'Sombre' : 'Clair'}`,
      icon: effectiveTheme === 'dark' ? Moon : Sun,
      action: () => {
        toggleTheme()
        close()
      },
      category: 'actions',
    },
  ]

  // Get cached squads from React Query or fallback to Zustand store
  const cachedSquadsData = queryClient.getQueryData<
    Array<{ id: string; name: string; game: string | null }>
  >(queryKeys.squads.list())
  const availableSquads = cachedSquadsData || squads

  // Get cached upcoming sessions from React Query or fallback to Zustand store
  const cachedSessionsData = queryClient.getQueryData<SessionWithDetails[]>(
    queryKeys.sessions.upcoming()
  )
  const availableSessions = cachedSessionsData || sessions

  // Search through squads based on query
  const searchSquads = useCallback(
    (searchQuery: string) => {
      if (!searchQuery) return availableSquads.slice(0, 5)
      const lowerQuery = searchQuery.toLowerCase()
      return availableSquads
        .filter(
          (squad) =>
            squad.name.toLowerCase().includes(lowerQuery) ||
            (squad.game && squad.game.toLowerCase().includes(lowerQuery))
        )
        .slice(0, 5)
    },
    [availableSquads]
  )

  // Search through sessions based on query
  const searchSessions = useCallback(
    (searchQuery: string) => {
      if (!searchQuery) return availableSessions.slice(0, 5)
      const lowerQuery = searchQuery.toLowerCase()
      return availableSessions
        .filter(
          (session) =>
            (session.title && session.title.toLowerCase().includes(lowerQuery)) ||
            (session.game && session.game.toLowerCase().includes(lowerQuery))
        )
        .slice(0, 5)
    },
    [availableSessions]
  )

  const squadResults = searchSquads(query)
  const sessionResults = searchSessions(query)

  const squadCommands: CommandItem[] = squadResults.map((squad) => ({
    id: `squad-${squad.id}`,
    label: squad.name,
    description: squad.game || 'Squad',
    icon: Users,
    action: () => {
      navigate(`/squad/${squad.id}`)
      close()
    },
    category: 'squads' as const,
    preview: { type: 'squad' as const, data: { name: squad.name, game: squad.game, id: squad.id } },
    children: [
      {
        id: `squad-${squad.id}-open`,
        label: 'Ouvrir',
        description: 'Voir la squad',
        icon: ArrowRight,
        action: () => {
          navigate(`/squad/${squad.id}`)
          close()
        },
        category: 'squads' as const,
      },
      {
        id: `squad-${squad.id}-chat`,
        label: 'Chat',
        description: 'Ouvrir le chat',
        icon: MessageCircle,
        action: () => {
          navigate('/messages')
          close()
        },
        category: 'squads' as const,
      },
      {
        id: `squad-${squad.id}-party`,
        label: 'Party Vocale',
        description: 'Rejoindre la party',
        icon: Mic,
        action: () => {
          navigate('/party')
          close()
        },
        category: 'squads' as const,
      },
    ],
  }))

  const sessionCommands: CommandItem[] = sessionResults.map((session) => ({
    id: `session-${session.id}`,
    label: session.title || 'Session',
    description: new Date(session.scheduled_at).toLocaleDateString('fr-FR'),
    icon: Calendar,
    action: () => {
      navigate(`/session/${session.id}`)
      close()
    },
    category: 'sessions' as const,
  }))

  // Player search results
  const playerCommands: CommandItem[] = searchedPlayers.map((player) => ({
    id: `player-${player.id}`,
    label: player.username,
    description: 'Profil joueur',
    icon: User,
    action: () => {
      navigate(`/profile/${player.id}`)
      close()
    },
    category: 'players' as const,
    preview: {
      type: 'player' as const,
      data: { username: player.username, avatar_url: player.avatar_url, id: player.id },
    },
  }))

  const allCommands = [
    ...navigationCommands,
    ...actionCommands,
    ...squadCommands,
    ...sessionCommands,
    ...playerCommands,
  ]

  const activeParent = parentStack[parentStack.length - 1]
  const activeCommands = activeParent?.children ?? allCommands

  // Fuzzy search scoring
  const fuzzyScore = useCallback((text: string, pattern: string): number => {
    const t = text.toLowerCase()
    const p = pattern.toLowerCase()
    if (t.includes(p)) return 100 + (p.length / t.length) * 50
    let ti = 0,
      pi = 0,
      score = 0,
      streak = 0
    while (ti < t.length && pi < p.length) {
      if (t[ti] === p[pi]) {
        score += 10 + streak * 5
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

  // Recent commands
  const RECENT_KEY = 'squadplanner:recent-commands'
  const getRecentIds = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    } catch {
      return []
    }
  }, [])
  const addRecent = useCallback(
    (id: string) => {
      const recent = getRecentIds().filter((r) => r !== id)
      recent.unshift(id)
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)))
    },
    [getRecentIds]
  )

  const enterSubCommandWithRecent = useCallback(
    (cmd: CommandItem) => {
      addRecent(cmd.id)
      enterSubCommand(cmd)
    },
    [enterSubCommand, addRecent]
  )

  // Filter commands
  const filteredCommands = (() => {
    if (!query) {
      const recentIds = getRecentIds()
      const recentCmds = recentIds
        .map((id) => activeCommands.find((c) => c.id === id))
        .filter(Boolean) as CommandItem[]
      const rest = activeCommands.filter((c) => !recentIds.includes(c.id))
      return [...recentCmds, ...rest].slice(0, 10)
    }
    return activeCommands
      .map((cmd) => ({
        cmd,
        score: Math.max(
          fuzzyScore(cmd.label, query),
          fuzzyScore(cmd.description || '', query) * 0.7
        ),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.cmd)
  })()

  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (createSessionModalOpen) return
        setIsOpen((prev) => !prev)
        return
      }

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

      if (e.key === 'Backspace' && isOpen && query === '' && parentStack.length > 0) {
        e.preventDefault()
        goBack()
        return
      }

      if (!isTyping && !isOpen) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            navigate('/sessions?new=true')
            break
          case 's':
            e.preventDefault()
            navigate('/squads')
            break
          case 'm':
            e.preventDefault()
            navigate('/messages')
            break
          case 'p':
            e.preventDefault()
            navigate('/party')
            break
          case 'h':
            e.preventDefault()
            navigate('/home')
            break
          case 't':
            e.preventDefault()
            toggleTheme()
            break
          case '?':
            e.preventDefault()
            setShowShortcutsHelp(true)
            break
        }
      }

      if (isOpen && filteredCommands.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
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
  }, [
    isOpen,
    showShortcutsHelp,
    filteredCommands,
    selectedIndex,
    close,
    navigate,
    toggleTheme,
    goBack,
    enterSubCommandWithRecent,
    query,
    parentStack,
    createSessionModalOpen,
  ])

  // Debounced player search
  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchedPlayers([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .ilike('username', `%${query}%`)
          .limit(5)

        if (!error && data) {
          setSearchedPlayers(data)
        }
      } catch (err) {
        console.warn('[CommandPalette] Player search error:', err)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus()
  }, [isOpen])
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const recentIds = getRecentIds()

  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      const cat = !query && recentIds.includes(cmd.id) ? 'recent' : cmd.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(cmd)
      return acc
    },
    {} as Record<string, CommandItem[]>
  )

  const categoryLabels: Record<string, string> = {
    recent: 'Récents',
    navigation: 'Navigation',
    squads: 'Squads',
    sessions: 'Sessions',
    actions: 'Actions',
    players: 'Joueurs',
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl lg:max-w-3xl z-[101]"
            >
              <div className="mx-4 bg-bg-surface border border-border-hover rounded-2xl shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border-default">
                  {parentStack.length > 0 && (
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 shrink-0 mr-1"
                      aria-label={`Retour à ${parentStack[parentStack.length - 2]?.label || 'la palette de commandes'}`}
                    >
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
                    className="flex-1 bg-transparent text-md text-text-primary placeholder-text-tertiary outline-none"
                  />
                  <button
                    onClick={close}
                    aria-label="Fermer la palette de commandes"
                    className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors"
                  >
                    <X className="w-4 h-4 text-text-tertiary" />
                  </button>
                </div>

                <div className="flex">
                  <CommandResultList
                    filteredCommands={filteredCommands}
                    groupedCommands={groupedCommands}
                    categoryLabels={categoryLabels}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                    onSelect={enterSubCommandWithRecent}
                    query={query}
                  />
                  <CommandPreviewPanel command={filteredCommands[selectedIndex]} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border-default bg-bg-surface">
                  <div className="flex items-center gap-4 text-sm text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-border-subtle font-mono">↑↓</kbd>{' '}
                      naviguer
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-border-subtle font-mono">↵</kbd>{' '}
                      sélectionner
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-border-subtle font-mono">esc</kbd>{' '}
                      fermer
                    </span>
                  </div>
                  <kbd className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-border-subtle text-sm text-text-tertiary font-mono">
                    {shortcutKey} K
                  </kbd>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      <ShortcutsHelpModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcutKey={shortcutKey}
      />
    </>
  )
}

export default CommandPalette
