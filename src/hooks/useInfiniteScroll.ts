import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  /** Whether there are more pages to load */
  hasNextPage: boolean | undefined
  /** Whether a page is currently being fetched */
  isFetchingNextPage: boolean
  /** Function to fetch the next page */
  fetchNextPage: () => void
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
  /** Root margin for IntersectionObserver (default: '200px') */
  rootMargin?: string
}

/**
 * Hook for infinite scroll using IntersectionObserver.
 * Returns a ref to attach to a sentinel element at the bottom of the list.
 * When the sentinel enters the viewport, the next page is fetched.
 *
 * Designed to work with TanStack Query's useInfiniteQuery.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
  rootMargin = '200px',
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !enabled) return

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
    })

    observerRef.current.observe(sentinel)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [handleIntersection, enabled, rootMargin])

  return { sentinelRef }
}
