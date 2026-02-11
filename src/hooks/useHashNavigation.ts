import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router'

/**
 * Hook for hash-based section navigation.
 * Scrolls to the element matching the URL hash on mount and hash changes.
 * Returns a helper to programmatically navigate to a section.
 */
export function useHashNavigation() {
  const location = useLocation()

  const scrollToHash = useCallback((hash: string) => {
    const id = hash.replace('#', '')
    if (!id) return

    // Small delay to let the DOM render
    requestAnimationFrame(() => {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Brief highlight for visual feedback
        element.classList.add('ring-2', 'ring-primary/40', 'rounded-xl')
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary/40', 'rounded-xl')
        }, 2000)
      }
    })
  }, [])

  // Scroll on mount and when hash changes
  useEffect(() => {
    if (location.hash) {
      scrollToHash(location.hash)
    }
  }, [location.hash, scrollToHash])

  const navigateToSection = useCallback((sectionId: string) => {
    window.history.replaceState(null, '', `#${sectionId}`)
    scrollToHash(`#${sectionId}`)
  }, [scrollToHash])

  return { navigateToSection, currentHash: location.hash.replace('#', '') }
}
