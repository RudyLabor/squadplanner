/**
 * IndexedDB persister for React Query cache.
 * Allows offline access to previously loaded data (squads, sessions, profile).
 * Uses the official @tanstack/query-persist-client-core approach with raw IndexedDB.
 */

const DB_NAME = 'sq-query-cache'
const STORE_NAME = 'queries'
const DB_VERSION = 1
// Cache persisted data for 24 hours max
const MAX_AGE = 24 * 60 * 60 * 1000

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.get(key)
        req.onsuccess = () => resolve(req.result as T | undefined)
        req.onerror = () => reject(req.error)
      }),
  )
}

function idbSet(key: string, value: unknown): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.put(value, key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      }),
  )
}

function idbDelete(key: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      }),
  )
}

export interface Persister {
  persistClient: (client: { timestamp: number; buster: string; clientState: unknown }) => Promise<void>
  restoreClient: () => Promise<{ timestamp: number; buster: string; clientState: unknown } | undefined>
  removeClient: () => Promise<void>
}

export function createIDBPersister(key = 'sq-react-query'): Persister {
  return {
    persistClient: async (client) => {
      try {
        await idbSet(key, client)
      } catch {
        // IndexedDB unavailable (private browsing, quota exceeded) — silently skip
      }
    },
    restoreClient: async () => {
      try {
        const stored = await idbGet<{ timestamp: number; buster: string; clientState: unknown }>(key)
        if (!stored) return undefined
        // Expire stale cache
        if (Date.now() - stored.timestamp > MAX_AGE) {
          await idbDelete(key)
          return undefined
        }
        return stored
      } catch {
        return undefined
      }
    },
    removeClient: async () => {
      try {
        await idbDelete(key)
      } catch {
        // noop
      }
    },
  }
}
