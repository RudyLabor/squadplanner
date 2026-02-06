import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Calendar, MessageCircle, User, X, ArrowRight } from 'lucide-react'
import { useSquadsStore, useSessionsStore, useAuthStore } from '../hooks'
import { supabase } from '../lib/supabase'

interface SearchResult {
  id: string
  type: 'squad' | 'session' | 'message' | 'member'
  title: string
  subtitle?: string
  icon: React.ElementType
  path: string
  avatar?: string
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { squads } = useSquadsStore()
  const { sessions } = useSessionsStore()
  const { user } = useAuthStore()

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchAsync = async () => {
      setIsLoading(true)
      const lowerQuery = query.toLowerCase()
      const searchResults: SearchResult[] = []

      // Search squads
      squads.forEach(squad => {
        if (squad.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: squad.id,
            type: 'squad',
            title: squad.name,
            subtitle: `${squad.member_count || 0} membres`,
            icon: Users,
            path: `/squads/${squad.id}`,
            avatar: (squad as { avatar_url?: string }).avatar_url || undefined
          })
        }
      })

      // Search sessions
      sessions.forEach(session => {
        const sessionTitle = session.title || session.game || 'Session'
        if (sessionTitle.toLowerCase().includes(lowerQuery)) {
          const sessionDate = new Date(session.scheduled_at)
          searchResults.push({
            id: session.id,
            type: 'session',
            title: sessionTitle,
            subtitle: sessionDate.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }),
            icon: Calendar,
            path: `/sessions/${session.id}`
          })
        }
      })

      // Search messages (from database)
      if (user && query.length >= 3) {
        try {
          const squadIds = squads.map(s => s.id)
          if (squadIds.length > 0) {
            const { data: messages } = await supabase
              .from('messages')
              .select('id, content, squad_id, squads!inner(name)')
              .in('squad_id', squadIds)
              .ilike('content', `%${query}%`)
              .limit(5)

            if (messages) {
              messages.forEach((msg) => {
                const squadName = Array.isArray(msg.squads) ? msg.squads[0]?.name : (msg.squads as { name: string } | null)?.name
                searchResults.push({
                  id: msg.id,
                  type: 'message',
                  title: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
                  subtitle: `Dans ${squadName || 'Squad'}`,
                  icon: MessageCircle,
                  path: `/messages?squad=${msg.squad_id}&highlight=${msg.id}`
                })
              })
            }
          }
        } catch (error) {
          console.error('Error searching messages:', error)
        }
      }

      // Search members (from database)
      if (user && query.length >= 2) {
        try {
          const { data: members } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${query}%`)
            .limit(5)

          if (members) {
            members.forEach((member: { id: string; username: string; avatar_url: string | null }) => {
              searchResults.push({
                id: member.id,
                type: 'member',
                title: member.username,
                subtitle: 'Membre',
                icon: User,
                path: `/profile/${member.id}`,
                avatar: member.avatar_url || undefined
              })
            })
          }
        } catch (error) {
          console.error('Error searching members:', error)
        }
      }

      setResults(searchResults.slice(0, 10))
      setIsLoading(false)
    }

    const debounce = setTimeout(searchAsync, 150)
    return () => clearTimeout(debounce)
  }, [query, squads, sessions, user])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false)
    navigate(result.path)
  }

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      squad: [],
      session: [],
      message: [],
      member: []
    }
    results.forEach(r => groups[r.type].push(r))
    return groups
  }, [results])

  const typeLabels: Record<string, string> = {
    squad: 'Squads',
    session: 'Sessions',
    message: 'Messages',
    member: 'Membres'
  }

  const typeColors: Record<string, string> = {
    squad: 'text-[#a78bfa]',
    session: 'text-[#22d3ee]',
    message: 'text-[#34d399]',
    member: 'text-[#f472b6]'
  }

  return (
    <>
      {/* Search trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f7f8f8] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Rechercher...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[rgba(255,255,255,0.05)] rounded border border-[rgba(255,255,255,0.1)]">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </motion.button>

      {/* Search modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
            >
              <div className="bg-[#0a0a0b] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 p-4 border-b border-[rgba(255,255,255,0.05)]">
                  <Search className="w-5 h-5 text-[#6366f1]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setSelectedIndex(0)
                    }}
                    placeholder="Rechercher squads, sessions, messages, membres..."
                    className="flex-1 bg-transparent text-[#f7f8f8] placeholder-[#5e6063] outline-none text-[15px]"
                  />
                  {query && (
                    <motion.button
                      onClick={() => setQuery('')}
                      className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#5e6063] hover:text-[#8b8d90]"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-[#5e6063] text-sm mt-3">Recherche en cours...</p>
                    </div>
                  ) : query && results.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="w-10 h-10 text-[#3a3a3f] mx-auto mb-3" />
                      <p className="text-[#8b8d90]">Aucun résultat pour "{query}"</p>
                      <p className="text-[#5e6063] text-sm mt-1">Essaie avec d'autres termes</p>
                    </div>
                  ) : query ? (
                    <div className="py-2">
                      {Object.entries(groupedResults).map(([type, items]) => {
                        if (items.length === 0) return null
                        let flatIndex = 0
                        for (const [t, arr] of Object.entries(groupedResults)) {
                          if (t === type) break
                          flatIndex += arr.length
                        }
                        return (
                          <div key={type}>
                            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${typeColors[type]}`}>
                              {typeLabels[type]}
                            </div>
                            {items.map((result, idx) => {
                              const globalIdx = flatIndex + idx
                              const Icon = result.icon
                              return (
                                <motion.button
                                  key={result.id}
                                  onClick={() => handleSelect(result)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                    selectedIndex === globalIdx
                                      ? 'bg-[rgba(99,102,241,0.1)]'
                                      : 'hover:bg-[rgba(255,255,255,0.03)]'
                                  }`}
                                  onMouseEnter={() => setSelectedIndex(globalIdx)}
                                  whileTap={{ scale: 0.99 }}
                                >
                                  {result.avatar ? (
                                    <img
                                      src={result.avatar}
                                      alt=""
                                      className="w-9 h-9 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-[rgba(255,255,255,0.03)] ${typeColors[result.type]}`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="text-[14px] text-[#f7f8f8] truncate">
                                      {result.title}
                                    </div>
                                    {result.subtitle && (
                                      <div className="text-[12px] text-[#5e6063] truncate">
                                        {result.subtitle}
                                      </div>
                                    )}
                                  </div>
                                  {selectedIndex === globalIdx && (
                                    <ArrowRight className="w-4 h-4 text-[#6366f1]" />
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-[#5e6063] text-sm">
                        Commence à taper pour rechercher
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.05)] text-[11px] text-[#5e6063]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded">↓</kbd>
                      naviguer
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded">↵</kbd>
                      sélectionner
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded">esc</kbd>
                    fermer
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
