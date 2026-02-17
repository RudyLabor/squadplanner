
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, Sparkles, RefreshCw } from './icons'
import { searchGifs, fetchTrendingGifs, CATEGORIES } from './gifApi'
import type { GifResult } from './gifApi'

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

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setIsLoading(true)
      fetchTrendingGifs().then((results) => {
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

  const handleCategoryClick = useCallback((categoryQuery: string) => {
    setQuery(categoryQuery)
    setIsLoading(true)
    setHasSearched(true)
    searchGifs(categoryQuery).then((results) => {
      setGifs(results)
      setIsLoading(false)
      setHasLoaded(true)
    })
  }, [])

  const handleRetry = useCallback(() => {
    setIsLoading(true)
    setHasLoaded(false)
    fetchTrendingGifs().then((results) => {
      setGifs(results)
      setIsLoading(false)
      setHasLoaded(true)
    })
  }, [])

  const handleGifSelect = useCallback(
    (gif: GifResult) => {
      onSelect(gif.url)
      onClose()
    },
    [onSelect, onClose]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 sm:bg-transparent"
            onClick={onClose}
            aria-hidden="true"
          />

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[61] sm:absolute sm:inset-x-auto sm:bottom-full sm:mb-2 sm:right-0 sm:w-[360px] bg-surface-dark border border-border-hover sm:rounded-xl rounded-t-2xl shadow-2xl shadow-black/50 overflow-hidden max-h-[70vh] sm:max-h-[420px] flex flex-col"
          >
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-overlay-heavy" />
            </div>

            <div className="p-3 border-b border-border-default flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-hover" />
                <span className="text-base font-medium text-text-primary">GIFs</span>
                <span className="text-xs text-text-tertiary ml-auto">Powered by GIPHY</span>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-border-hover transition-colors sm:hidden"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Chercher un GIF..."
                  className="w-full pl-8 pr-8 py-2 bg-border-default border border-border-default rounded-lg text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                />
                {query && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text-tertiary hover:text-text-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {!hasSearched && (
              <div className="flex gap-1.5 px-3 py-2 border-b border-border-default overflow-x-auto scrollbar-hide flex-shrink-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.query}
                    onClick={() => handleCategoryClick(cat.query)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-sm bg-border-default text-text-secondary hover:bg-primary-15 hover:text-primary-hover transition-colors"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border-hover scrollbar-track-transparent min-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <Loader2 className="w-6 h-6 text-primary-hover animate-spin" />
                </div>
              ) : gifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
                  {hasSearched ? (
                    <p className="text-text-tertiary text-sm">Aucun GIF trouve</p>
                  ) : hasLoaded ? (
                    <>
                      <p className="text-text-tertiary text-sm text-center px-4">
                        Impossible de charger les GIFs
                      </p>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary-15 text-primary-hover hover:bg-primary-20 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reessayer
                      </button>
                    </>
                  ) : (
                    <Loader2 className="w-6 h-6 text-primary-hover animate-spin" />
                  )}
                </div>
              ) : (
                <div className="columns-2 gap-1.5">
                  {gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleGifSelect(gif)}
                      className="w-full mb-1.5 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-hover transition-all break-inside-avoid"
                    >
                      <img
                        src={gif.preview}
                        alt="GIF"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto object-cover"
                        style={{ aspectRatio: `${gif.width}/${gif.height}` }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
})

export default GifPicker
