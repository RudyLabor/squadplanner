import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Returns true when the user has enabled "Reduce motion" in their OS settings.
 * Subscribes to live changes so the value updates without a page reload.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
