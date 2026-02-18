import { useState, useEffect } from 'react'

/**
 * Hook to detect if virtual keyboard is visible on mobile
 * Uses visualViewport API to detect viewport height changes
 */
export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!isMobile) return

    // Use visualViewport API if available
    const viewport = window.visualViewport
    if (!viewport) return

    // Use screen height as stable reference instead of initial viewport height
    // This avoids stale closures when page is restored from bfcache
    const getStableHeight = () => window.screen.height

    const handleResize = () => {
      const heightDiff = getStableHeight() - viewport.height
      // Keyboard typically takes 30%+ of screen height
      setIsKeyboardVisible(heightDiff > getStableHeight() * 0.3)
    }

    viewport.addEventListener('resize', handleResize)

    // Reset keyboard state when page becomes visible again (bfcache / tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsKeyboardVisible(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also reset on bfcache restore (pageshow with persisted=true)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsKeyboardVisible(false)
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  return isKeyboardVisible
}

export default useKeyboardVisible
