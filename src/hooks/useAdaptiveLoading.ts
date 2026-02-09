import { useState, useEffect, useCallback } from 'react'

export type QualityTier = 'low' | 'medium' | 'high'

interface ConnectionInfo {
  effectiveType?: string
  downlink?: number
  saveData?: boolean
}

/**
 * Returns a quality tier based on the user's network connection.
 * Components can use this to reduce complexity on slow connections:
 * - 'low': disable animations, load thumbnails only, reduce items
 * - 'medium': standard quality, moderate animations
 * - 'high': full quality, all animations, high-res images
 */
export function useAdaptiveLoading(): {
  tier: QualityTier
  isSlowConnection: boolean
  isSaveData: boolean
  effectiveType: string
} {
  const getConnectionInfo = useCallback((): ConnectionInfo => {
    const nav = navigator as Navigator & { connection?: ConnectionInfo }
    return nav.connection ?? {}
  }, [])

  const getTier = useCallback((): QualityTier => {
    const conn = getConnectionInfo()

    // Respect data-saver mode
    if (conn.saveData) return 'low'

    const type = conn.effectiveType
    if (type === 'slow-2g' || type === '2g') return 'low'
    if (type === '3g') return 'medium'

    // 4g/wifi or unknown = high
    return 'high'
  }, [getConnectionInfo])

  const [tier, setTier] = useState<QualityTier>(getTier)

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: ConnectionInfo & { addEventListener?: (type: string, fn: () => void) => void; removeEventListener?: (type: string, fn: () => void) => void } }
    const conn = nav.connection

    if (!conn?.addEventListener) return

    const handleChange = () => setTier(getTier())
    conn.addEventListener('change', handleChange)
    return () => conn.removeEventListener?.('change', handleChange)
  }, [getTier])

  const connInfo = getConnectionInfo()

  return {
    tier,
    isSlowConnection: tier === 'low',
    isSaveData: connInfo.saveData ?? false,
    effectiveType: connInfo.effectiveType ?? '4g',
  }
}
