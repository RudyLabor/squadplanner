import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Returns true when the user has enabled "Reduce motion" in their OS settings.
 * Subscribes to live changes so the value updates without a page reload.
 */
export function useReducedMotion(): boolean {
  // Always initialize to false for SSR safety — avoids hydration mismatch
  // when server renders false but client would read true from matchMedia.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
