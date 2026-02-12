/**
 * Offline Mutation Queue
 *
 * When the user is offline, mutations (RSVP, message send, session create, etc.)
 * are stored in IndexedDB and replayed when connectivity returns.
 *
 * Uses Background Sync API when available for automatic replay,
 * with a manual fallback for browsers without Background Sync support.
 */

const DB_NAME = 'sq-offline-mutations'
const STORE_NAME = 'mutations'
const DB_VERSION = 1
const SYNC_TAG = 'sync-mutations'

export interface OfflineMutation {
  id: string
  timestamp: number
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  description: string // Human-readable description for UI feedback
}

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Queue a failed mutation for later replay.
 */
export async function queueMutation(mutation: Omit<OfflineMutation, 'id' | 'timestamp'>): Promise<void> {
  try {
    const db = await openDB()
    const entry: OfflineMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).add(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })

    // Request Background Sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready
      await (reg as any).sync.register(SYNC_TAG)
    }
  } catch {
    // IndexedDB or Background Sync unavailable — mutation is lost
  }
}

/**
 * Get all pending mutations (for UI display).
 */
export async function getPendingMutations(): Promise<OfflineMutation[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result as OfflineMutation[])
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

/**
 * Replay all pending mutations. Called on reconnect or by Background Sync.
 * Returns the count of successfully replayed mutations.
 */
export async function replayMutations(): Promise<number> {
  const mutations = await getPendingMutations()
  if (mutations.length === 0) return 0

  let replayed = 0
  const db = await openDB()

  for (const mutation of mutations) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body,
      })

      if (response.ok || response.status < 500) {
        // Success or client error (4xx) — remove from queue either way
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          tx.objectStore(STORE_NAME).delete(mutation.id)
          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve() // Don't block on delete failure
        })
        if (response.ok) replayed++
      }
      // 5xx errors: keep in queue for next retry
    } catch {
      // Network still down — stop trying
      break
    }
  }

  return replayed
}

/**
 * Clear all pending mutations (e.g., on logout).
 */
export async function clearMutationQueue(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // noop
  }
}

/**
 * Initialize offline mutation replay on reconnect.
 * Call this once in the app entry point.
 */
export function initOfflineMutationSync(): void {
  if (typeof window === 'undefined') return

  // Replay mutations when coming back online
  window.addEventListener('online', async () => {
    const count = await replayMutations()
    if (count > 0 && !import.meta.env.DEV) {
      // Notify the app that mutations were synced
      window.dispatchEvent(new CustomEvent('mutations-synced', { detail: { count } }))
    }
  })
}
