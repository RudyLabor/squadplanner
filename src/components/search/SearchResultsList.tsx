import { motion } from 'framer-motion'
import { Search, ArrowRight } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'squad' | 'session' | 'message' | 'member'
  title: string
  subtitle?: string
  icon: React.ElementType
  path: string
  avatar?: string
}

const typeLabels: Record<string, string> = {
  squad: 'Squads',
  session: 'Sessions',
  message: 'Messages',
  member: 'Membres'
}

const typeColors: Record<string, string> = {
  squad: 'text-purple',
  session: 'text-info',
  message: 'text-success',
  member: 'text-pink'
}

interface SearchResultsListProps {
  query: string
  results: SearchResult[]
  groupedResults: Record<string, SearchResult[]>
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  onSelect: (result: SearchResult) => void
  isLoading: boolean
}

export function SearchResultsList({ query, results, groupedResults, selectedIndex, setSelectedIndex, onSelect, isLoading }: SearchResultsListProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-text-tertiary text-sm mt-3">Recherche en cours...</p>
      </div>
    )
  }

  if (query && results.length === 0) {
    return (
      <div className="p-8 text-center">
        <Search className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary">Aucun résultat pour "{query}"</p>
        <p className="text-text-tertiary text-sm mt-1">Essaie avec d'autres termes</p>
      </div>
    )
  }

  if (query) {
    return (
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
                    onClick={() => onSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      selectedIndex === globalIdx ? 'bg-primary-10' : 'hover:bg-surface-card'
                    }`}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    whileTap={{ scale: 0.99 }}
                  >
                    {result.avatar ? (
                      <img src={result.avatar} alt="" className="w-9 h-9 rounded-lg object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-surface-card ${typeColors[result.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-md text-text-primary truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-text-tertiary truncate">{result.subtitle}</div>
                      )}
                    </div>
                    {selectedIndex === globalIdx && <ArrowRight className="w-4 h-4 text-primary" />}
                  </motion.button>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 text-center">
      <p className="text-text-tertiary text-sm">Commence à taper pour rechercher</p>
    </div>
  )
}
