import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Calendar, MessageCircle, User, X } from 'lucide-react'
import { useSquadsStore, useSessionsStore, useAuthStore } from '../hooks'
import { supabase } from '../lib/supabase'
import { SearchResultsList } from './search/SearchResultsList'

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

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  const shortcutKey = isMac ? '⌘' : 'Ctrl'

  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus() }, [isOpen])
  useEffect(() => { if (!isOpen) { setQuery(''); setResults([]); setSelectedIndex(0) } }, [isOpen])

  // Search logic
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }

    const searchAsync = async () => {
      setIsLoading(true)
      const lowerQuery = query.toLowerCase()
      const searchResults: SearchResult[] = []

      squads.forEach(squad => {
        if (squad.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({ id: squad.id, type: 'squad', title: squad.name, subtitle: `${squad.member_count || 0} membre${(squad.member_count || 0) > 1 ? 's' : ''}`, icon: Users, path: `/squad/${squad.id}`, avatar: (squad as { avatar_url?: string }).avatar_url || undefined })
        }
      })

      sessions.forEach(session => {
        const sessionTitle = session.title || session.game || 'Session'
        if (sessionTitle.toLowerCase().includes(lowerQuery)) {
          const sessionDate = new Date(session.scheduled_at)
          searchResults.push({ id: session.id, type: 'session', title: sessionTitle, subtitle: sessionDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), icon: Calendar, path: `/sessions/${session.id}` })
        }
      })

      if (user && query.length >= 3) {
        try {
          const squadIds = squads.map(s => s.id)
          if (squadIds.length > 0) {
            const { data: messages } = await supabase.from('messages').select('id, content, squad_id, squads!inner(name)').in('squad_id', squadIds).ilike('content', `%${query}%`).limit(5)
            if (messages) {
              messages.forEach((msg) => {
                const squadName = Array.isArray(msg.squads) ? msg.squads[0]?.name : (msg.squads as { name: string } | null)?.name
                searchResults.push({ id: msg.id, type: 'message', title: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content, subtitle: `Dans ${squadName || 'Squad'}`, icon: MessageCircle, path: `/messages?squad=${msg.squad_id}&highlight=${msg.id}` })
              })
            }
          }
        } catch (error) { console.error('Error searching messages:', error) }
      }

      if (user && query.length >= 2) {
        try {
          const { data: members } = await supabase.from('profiles').select('id, username, avatar_url').ilike('username', `%${query}%`).limit(5)
          if (members) {
            members.forEach((member: { id: string; username: string; avatar_url: string | null }) => {
              searchResults.push({ id: member.id, type: 'member', title: member.username, subtitle: 'Membre', icon: User, path: `/profile/${member.id}`, avatar: member.avatar_url || undefined })
            })
          }
        } catch (error) { console.error('Error searching members:', error) }
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
        case 'ArrowDown': e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)); break
        case 'ArrowUp': e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)); break
        case 'Enter': e.preventDefault(); if (results[selectedIndex]) handleSelect(results[selectedIndex]); break
        case 'Escape': e.preventDefault(); setIsOpen(false); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSelect = (result: SearchResult) => { setIsOpen(false); navigate(result.path) }

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = { squad: [], session: [], message: [], member: [] }
    results.forEach(r => groups[r.type].push(r))
    return groups
  }, [results])

  return (
    <>
      <motion.button
        onClick={() => {
          const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: !isMac, metaKey: isMac, bubbles: true })
          window.dispatchEvent(event)
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-secondary hover:bg-border-subtle hover:text-text-primary transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Rechercher...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-border-subtle rounded border border-border-hover">
          <span className="text-xs">{shortcutKey}</span>K
        </kbd>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
            >
              <div className="bg-bg-elevated border border-border-hover rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
                  <Search className="w-5 h-5 text-primary" />
                  <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }} placeholder="Rechercher squads, sessions, messages, membres..." aria-label="Recherche globale" className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none text-md" />
                  {query && (
                    <motion.button onClick={() => setQuery('')} aria-label="Effacer la recherche" className="p-1 rounded-lg hover:bg-border-subtle text-text-tertiary hover:text-text-secondary" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  <SearchResultsList query={query} results={results} groupedResults={groupedResults} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} onSelect={handleSelect} isLoading={isLoading} />
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle text-sm text-text-tertiary">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-border-subtle rounded">↑</kbd><kbd className="px-1.5 py-0.5 bg-border-subtle rounded">↓</kbd> naviguer</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-border-subtle rounded">↵</kbd> sélectionner</span>
                  </div>
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-border-subtle rounded">esc</kbd> fermer</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
