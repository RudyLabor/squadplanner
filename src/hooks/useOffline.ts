/**
 * PHASE - Offline Detection Hook
 *
 * Provides real-time offline/online status detection
 * with clear feedback for users.
 */
import { useState, useEffect, useCallback } from 'react'
import { create } from 'zustand'

interface OfflineState {
  isOnline: boolean
  isOffline: boolean
  wasOffline: boolean
  lastOnlineAt: Date | null
  setOnline: () => void
  setOffline: () => void
  resetWasOffline: () => void
}

// Global offline state store
export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  wasOffline: false,
  lastOnlineAt: null,

  setOnline: () =>
    set({
      isOnline: true,
      isOffline: false,
      wasOffline: false,
      lastOnlineAt: new Date(),
    }),

  setOffline: () =>
    set((state) => ({
      isOnline: false,
      isOffline: true,
      wasOffline: true,
      lastOnlineAt: state.lastOnlineAt,
    })),

  resetWasOffline: () => set({ wasOffline: false }),
}))

/**
 * Hook for offline detection
 * Returns current online status and helper functions
 */
export function useOffline() {
  const store = useOfflineStore()
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'slow' | 'offline'>('good')

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      store.setOnline()
      setConnectionQuality('good')
      // Haptic feedback on reconnection
      navigator.vibrate?.([10, 50, 10])
    }

    const handleOffline = () => {
      store.setOffline()
      setConnectionQuality('offline')
      // Haptic feedback on disconnection
      navigator.vibrate?.([50, 100, 50])
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (!navigator.onLine) {
      store.setOffline()
      setConnectionQuality('offline')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [store])

  // Check connection quality using Network Information API
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection

    if (!connection) return

    const updateConnectionQuality = () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline')
        return
      }

      const effectiveType = connection.effectiveType
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setConnectionQuality('slow')
      } else {
        setConnectionQuality('good')
      }
    }

    updateConnectionQuality()
    connection.addEventListener('change', updateConnectionQuality)

    return () => {
      connection.removeEventListener('change', updateConnectionQuality)
    }
  }, [])

  return {
    isOnline: store.isOnline,
    isOffline: store.isOffline,
    wasOffline: store.wasOffline,
    connectionQuality,
    resetWasOffline: store.resetWasOffline,
  }
}

// Network Information API types
interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  downlink: number
  rtt: number
  saveData: boolean
  addEventListener(type: 'change', listener: EventListener): void
  removeEventListener(type: 'change', listener: EventListener): void
}

/**
 * Hook for showing offline banner/toast
 */
export function useOfflineBanner() {
  const { isOffline, wasOffline, isOnline, resetWasOffline } = useOffline()
  const [showBanner, setShowBanner] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (isOffline) {
      setShowBanner(true)
      setShowReconnected(false)
    } else if (wasOffline && isOnline) {
      setShowBanner(false)
      setShowReconnected(true)
      // Hide reconnected message after 3 seconds
      const timeout = setTimeout(() => {
        setShowReconnected(false)
        resetWasOffline()
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [isOffline, wasOffline, isOnline, resetWasOffline])

  const dismissBanner = useCallback(() => {
    setShowBanner(false)
  }, [])

  const dismissReconnected = useCallback(() => {
    setShowReconnected(false)
    resetWasOffline()
  }, [resetWasOffline])

  return {
    showOfflineBanner: showBanner,
    showReconnectedBanner: showReconnected,
    dismissOfflineBanner: dismissBanner,
    dismissReconnectedBanner: dismissReconnected,
  }
}
