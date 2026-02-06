import { useCallback, useEffect, useState } from 'react'
import { haptic, getHapticEnabled, setHapticEnabled, isHapticSupported } from '../utils/haptics'

type HapticType = keyof typeof haptic

/**
 * Hook for haptic feedback with preference management
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const { triggerHaptic } = useHapticFeedback()
 *
 *   return (
 *     <button onClick={() => {
 *       triggerHaptic('medium')
 *       // ... do action
 *     }}>
 *       Click me
 *     </button>
 *   )
 * }
 * ```
 */
export function useHapticFeedback() {
  const [enabled, setEnabled] = useState(getHapticEnabled)
  const [supported] = useState(isHapticSupported)

  // Sync with localStorage changes (e.g., from Settings page)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hapticEnabled') {
        setEnabled(e.newValue !== 'false')
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /**
   * Trigger haptic feedback if enabled
   */
  const triggerHaptic = useCallback((type: HapticType) => {
    if (enabled && supported) {
      haptic[type]()
    }
  }, [enabled, supported])

  /**
   * Toggle haptic feedback on/off
   */
  const toggleHaptic = useCallback(() => {
    const newValue = !enabled
    setEnabled(newValue)
    setHapticEnabled(newValue)
    // Give feedback when enabling
    if (newValue) {
      haptic.medium()
    }
  }, [enabled])

  /**
   * Set haptic feedback preference
   */
  const setHaptic = useCallback((value: boolean) => {
    setEnabled(value)
    setHapticEnabled(value)
    if (value) {
      haptic.medium()
    }
  }, [])

  return {
    /** Trigger haptic feedback of specified type */
    triggerHaptic,
    /** Whether haptic feedback is currently enabled */
    isEnabled: enabled,
    /** Whether the device supports haptic feedback */
    isSupported: supported,
    /** Toggle haptic feedback on/off */
    toggleHaptic,
    /** Set haptic feedback preference */
    setHaptic,
  }
}

export default useHapticFeedback
