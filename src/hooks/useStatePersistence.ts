import { useState, useEffect, useCallback, useRef } from 'react'

const NAMESPACE = 'sp_persist_'
const MAX_KEYS = 100
const LRU_TRACKER_KEY = 'sp_persist__lru'

/**
 * Tracks access order for LRU eviction of sessionStorage keys.
 */
function touchLRU(key: string): void {
  try {
    const raw = sessionStorage.getItem(LRU_TRACKER_KEY)
    const keys: string[] = raw ? JSON.parse(raw) : []
    const idx = keys.indexOf(key)
    if (idx !== -1) keys.splice(idx, 1)
    keys.push(key)

    // Evict oldest entries if over limit
    while (keys.length > MAX_KEYS) {
      const evicted = keys.shift()
      if (evicted) sessionStorage.removeItem(evicted)
    }

    sessionStorage.setItem(LRU_TRACKER_KEY, JSON.stringify(keys))
  } catch {
    // Storage full or unavailable - silently ignore
  }
}

function readFromStorage<T>(namespacedKey: string, defaultValue: T): T {
  try {
    const raw = sessionStorage.getItem(namespacedKey)
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function writeToStorage<T>(namespacedKey: string, value: T): void {
  try {
    sessionStorage.setItem(namespacedKey, JSON.stringify(value))
    touchLRU(namespacedKey)
  } catch {
    // Storage full or serialization error - silently ignore
  }
}

/**
 * Generic hook that persists state to sessionStorage with a namespaced key.
 * State persists across navigation but clears on page refresh (sessionStorage).
 *
 * @param key - Unique identifier for this persisted value
 * @param defaultValue - Fallback value when nothing is stored
 */
export function useStatePersistence<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const namespacedKey = `${NAMESPACE}${key}`
  const isInitialized = useRef(false)

  const [value, setValueInternal] = useState<T>(() =>
    readFromStorage(namespacedKey, defaultValue)
  )

  // Write to storage whenever value changes (skip initial mount)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      return
    }
    writeToStorage(namespacedKey, value)
  }, [namespacedKey, value])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValueInternal(newValue)
    },
    []
  )

  return [value, setValue]
}
