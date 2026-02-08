import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, Sparkles, RefreshCw } from 'lucide-react'

/**
 * GifPicker — Phase 3.1
 * Search and select GIFs using Tenor API v2 (free tier, no key needed for basic search).
 * Mobile-optimized: renders as a full-width bottom sheet on small screens.
 */

interface GifResult {
  id: string
  url: string        // Full GIF URL
  preview: string    // Tiny preview (thumbnail)
  width: number
  height: number
}

// Tenor API v2 search (using the public anonymous key)
const TENOR_API_KEY = 'AIzaSyDDAz5l3nFi8fMbEGMKOvTjdykyH_ugYK8' // Google's public Tenor API key
const TENOR_BASE = 'https://tenor.googleapis.com/v2'

async function searchGifs(query: string, limit = 20): Promise<GifResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      key: TENOR_API_KEY,
      client_key: 'squad_planner',
      limit: String(limit),
      media_filter: 'tinygif,gif',
      contentfilter: 'medium',
      locale: 'fr_FR',
    })

    const res = await fetch(`${TENOR_BASE}/search?${params}`)
    if (!res.ok) throw new Error('Tenor API error')

    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
      preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
      width: r.media_formats?.tinygif?.dims?.[0] || 200,
      height: r.media_formats?.tinygif?.dims?.[1] || 150,
    }))
  } catch {
    return []
  }
}

async function fetchTrendingGifs(limit = 20): Promise<GifResult[]> {
  try {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      client_key: 'squad_planner',
      limit: String(limit),
      media_filter: 'tinygif,gif',
      contentfilter: 'medium',
      locale: 'fr_FR',
    })

    const res = await fetch(`${TENOR_BASE}/featured?${params}`)
    if (!res.ok) throw new Error('Tenor API error')

    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
      preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
      width: r.media_formats?.tinygif?.dims?.[0] || 200,
      height: r.media_formats?.tinygif?.dims?.[1] || 150,
    }))
  } catch {
    return []
  }
}

// Suggested categories for gaming
const CATEGORIES = [
  { label: 'GG', query: 'gg gaming' },
  { label: 'Rage', query: 'rage gaming' },
  { label: 'Victoire', query: 'victory celebration gaming' },
  { label: 'Fail', query: 'epic fail gaming' },
  { label: 'LOL', query: 'laughing gaming' },
  { label: 'Sad', query: 'sad gaming' },
]

interface GifPickerProps {
  isOpen: boolean
  onSelect: (gifUrl: string) => void
  onClose: () => void
}

export const GifPicker = memo(function GifPicker({ isOpen, onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load trending on open
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setGifs([])
      setHasSearched(false)
      setHasLoaded(false)
      return
    }

    const loadTrending = async () => {
      setIsLoading(true)
      const results = await fetchTrendingGifs()
      setGifs(results)
      setIsLoading(false)
      setHasLoaded(true)
    }
    loadTrending()

    setTimeout(() => searchRef.current?.focus(), 200)
  }, [isOpen])

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setIsLoading(true)
      fetchTrendingGifs().then(results => {
        setGifs(results)
        setIsLoading(false)
        setHasLoaded(true)
      })
      setHasSearched(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setHasSearched(true)
      const results = await searchGifs(value)
      setGifs(results)
      setIsLoading(false)
      setHasLoaded(true)
    }, 400)
  }, [])

  // Category quick search
  const handleCategoryClick = useCallback((categoryQuery: string) => {
    setQuery(categoryQuery)
    setIsLoading(true)
    setHasSearched(true)
    searchGifs(categoryQuery).then(results => {
      setGifs(results)
      setIsLoading(false)
      setHasLoaded(true)
    })
  }, [])

  // Retry loading
  const handleRetry = useCallback(() => {
    setIsLoading(true)
    setHasLoaded(false)
    fetchTrendingGifs().then(results => {
      setGifs(results)
      setIsLoading(false)
      setHasLoaded(true)
    })
  }, [])

  const handleGifSelect = useCallback((gif: GifResult) => {
    onSelect(gif.url)
    onClose()
  }, [onSelect, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 sm:bg-transparent"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Picker — full-width bottom sheet on mobile, positioned popup on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[61] sm:absolute sm:inset-x-auto sm:bottom-full sm:mb-2 sm:right-0 sm:w-[360px] bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] sm:rounded-xl rounded-t-2xl shadow-2xl shadow-black/50 overflow-hidden max-h-[70vh] sm:max-h-[420px] flex flex-col"
          >
            {/* Drag handle (mobile only) */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.2)]" />
            </div>

            {/* Header with search */}
            <div className="p-3 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#818cf8]" />
                <span className="text-[13px] font-medium text-[#e0e0e0]">GIFs</span>
                <span className="text-[10px] text-[#6b6b80] ml-auto">Powered by Tenor</span>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-[#6b6b80] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors sm:hidden"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b80]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Chercher un GIF..."
                  className="w-full pl-8 pr-8 py-2 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] rounded-lg text-[13px] text-white placeholder:text-[#6b6b80] focus:outline-none focus:border-[rgba(94,109,210,0.5)]"
                />
                {query && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#6b6b80] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick categories */}
            {!hasSearched && (
              <div className="flex gap-1.5 px-3 py-2 border-b border-[rgba(255,255,255,0.06)] overflow-x-auto scrollbar-hide flex-shrink-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.query}
                    onClick={() => handleCategoryClick(cat.query)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-[12px] bg-[rgba(255,255,255,0.06)] text-[#8b8d90] hover:bg-[rgba(99,102,241,0.15)] hover:text-[#818cf8] transition-colors"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* GIF grid */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent min-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <Loader2 className="w-6 h-6 text-[#818cf8] animate-spin" />
                </div>
              ) : gifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
                  {hasSearched ? (
                    <p className="text-[#6b6b80] text-sm">Aucun GIF trouvé</p>
                  ) : hasLoaded ? (
                    <>
                      <p className="text-[#6b6b80] text-sm text-center px-4">
                        Impossible de charger les GIFs
                      </p>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-[rgba(99,102,241,0.15)] text-[#818cf8] hover:bg-[rgba(99,102,241,0.25)] transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Réessayer
                      </button>
                    </>
                  ) : (
                    <Loader2 className="w-6 h-6 text-[#818cf8] animate-spin" />
                  )}
                </div>
              ) : (
                <div className="columns-2 gap-1.5">
                  {gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleGifSelect(gif)}
                      className="w-full mb-1.5 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#818cf8] transition-all break-inside-avoid"
                    >
                      <img
                        src={gif.preview}
                        alt="GIF"
                        loading="lazy"
                        className="w-full h-auto object-cover"
                        style={{ aspectRatio: `${gif.width}/${gif.height}` }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

export default GifPicker
