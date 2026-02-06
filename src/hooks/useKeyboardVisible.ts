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

    // Store initial height
    const initialHeight = viewport.height

    const handleResize = () => {
      // If viewport height is significantly smaller than initial, keyboard is likely open
      // Threshold of 150px accounts for small UI changes
      const heightDiff = initialHeight - viewport.height
      setIsKeyboardVisible(heightDiff > 150)
    }

    viewport.addEventListener('resize', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
    }
  }, [])

  return isKeyboardVisible
}

export default useKeyboardVisible
