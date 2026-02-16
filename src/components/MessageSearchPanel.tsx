import { memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Search, X, User, Hash } from './icons'
import { useMessageSearch } from '../hooks/useMessageSearch'

interface MessageSearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToMessage?: (messageId: string, squadId: string) => void
  onNavigateToDM?: (messageId: string, otherUserId: string) => void
  squadId?: string
}

export const MessageSearchPanel = memo(function MessageSearchPanel({
  isOpen,
  onClose,
  onNavigateToMessage,
  onNavigateToDM,
  squadId,
}: MessageSearchPanelProps) {
  const { query, setQuery, squadResults, dmResults, totalResults, isLoading, clearSearch } =
    useMessageSearch({ squadId })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' })
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-warning/30 text-text-primary rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute inset-x-0 top-0 z-50 bg-bg-elevated border-b border-border-default shadow-lg rounded-b-xl max-h-[80vh] flex flex-col"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
            <Search className="w-4 h-4 text-text-quaternary flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans les messages..."
              className="flex-1 bg-transparent text-text-primary placeholder-text-quaternary outline-none text-md"
              aria-label="Rechercher des messages"
              autoFocus
            />
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 rounded text-text-quaternary hover:text-text-secondary"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Fermer la recherche"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && query.trim().length >= 2 && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!isLoading && query.trim().length >= 2 && totalResults === 0 && (
              <div className="text-center py-8 px-4">
                <Search className="w-8 h-8 text-text-quaternary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">
                  Aucun résultat pour &laquo;{query}&raquo;
                </p>
              </div>
            )}

            {query.trim().length < 2 && (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-text-quaternary">
                  Tape au moins 2 caractères pour chercher
                </p>
              </div>
            )}

            {/* Squad messages results */}
            {squadResults.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-bg-surface">
                  <h4 className="text-xs font-semibold text-text-quaternary uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3 h-3" /> Messages de squad ({squadResults.length})
                  </h4>
                </div>
                {squadResults.map((result) => (
                  <button
                    key={result.message_id}
                    onClick={() => onNavigateToMessage?.(result.message_id, result.squad_id)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left"
                  >
                    {result.sender_avatar ? (
                      <img
                        src={result.sender_avatar}
                        alt={`Avatar de ${result.sender_username || 'utilisateur'}`}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {result.sender_username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-text-primary">
                          {result.sender_username}
                        </span>
                        <span className="text-xs text-text-quaternary">
                          dans {result.squad_name}
                        </span>
                        <span className="ml-auto text-xs text-text-quaternary flex-shrink-0">
                          {formatDate(result.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {highlightMatch(result.content, query)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* DM results */}
            {dmResults.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-bg-surface">
                  <h4 className="text-xs font-semibold text-text-quaternary uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Messages privés ({dmResults.length})
                  </h4>
                </div>
                {dmResults.map((result) => (
                  <button
                    key={result.message_id}
                    onClick={() => onNavigateToDM?.(result.message_id, result.other_user_id)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left"
                  >
                    {result.sender_avatar ? (
                      <img
                        src={result.sender_avatar}
                        alt={`Avatar de ${result.sender_username || 'utilisateur'}`}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {result.sender_username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-text-primary">
                          {result.sender_username}
                        </span>
                        <span className="ml-auto text-xs text-text-quaternary flex-shrink-0">
                          {formatDate(result.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {highlightMatch(result.content, query)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {totalResults > 0 && (
            <div className="px-4 py-2 border-t border-border-default bg-bg-surface">
              <p className="text-xs text-text-quaternary text-center">
                {totalResults} résultat{totalResults !== 1 ? 's' : ''} trouvé
                {totalResults !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
})
