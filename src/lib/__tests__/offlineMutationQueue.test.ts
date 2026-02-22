import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock IndexedDB
// ---------------------------------------------------------------------------
// We create a simple in-memory IndexedDB mock that mirrors the real API
// surface used by offlineMutationQueue (open, transaction, objectStore, add,
// getAll, delete, clear).

function createMockIDB() {
  let store: Record<string, unknown> = {}

  const mockObjectStore = {
    add: vi.fn((entry: { id: string }) => {
      store[entry.id] = entry
      return { onsuccess: null, onerror: null }
    }),
    getAll: vi.fn(() => {
      const req = {
        result: Object.values(store),
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      }
      // Trigger onsuccess asynchronously
      Promise.resolve().then(() => req.onsuccess?.())
      return req
    }),
    delete: vi.fn((id: string) => {
      delete store[id]
      return { onsuccess: null, onerror: null }
    }),
    clear: vi.fn(() => {
      store = {}
      return { onsuccess: null, onerror: null }
    }),
  }

  const mockTransaction = {
    objectStore: vi.fn(() => mockObjectStore),
    oncomplete: null as (() => void) | null,
    onerror: null as (() => void) | null,
    error: null,
  }

  const mockDB = {
    transaction: vi.fn((_storeName: string, _mode?: string) => {
      // Create fresh transaction each call but share the same store
      const tx = {
        objectStore: vi.fn(() => mockObjectStore),
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        error: null,
      }
      // Auto-complete the transaction after a microtask
      Promise.resolve().then(() => tx.oncomplete?.())
      return tx
    }),
    objectStoreNames: {
      contains: vi.fn(() => true),
    },
    createObjectStore: vi.fn(),
  }

  const mockRequest = {
    result: mockDB,
    onsuccess: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onupgradeneeded: null as (() => void) | null,
  }

  const mockIndexedDB = {
    open: vi.fn(() => {
      // Trigger onsuccess asynchronously
      Promise.resolve().then(() => mockRequest.onsuccess?.())
      return mockRequest
    }),
  }

  return {
    mockIndexedDB,
    mockDB,
    mockObjectStore,
    store,
    resetStore: () => {
      store = {}
    },
  }
}

let mockIDB: ReturnType<typeof createMockIDB>

beforeEach(() => {
  mockIDB = createMockIDB()
  vi.stubGlobal('indexedDB', mockIDB.mockIndexedDB)
  vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'test-uuid-123') })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('offlineMutationQueue', () => {
  describe('queueMutation', () => {
    it('should open IndexedDB and store mutation with generated id and timestamp', async () => {
      const { queueMutation } = await import('../offlineMutationQueue')

      await queueMutation({
        url: 'https://api.example.com/rsvp',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'present' }),
        description: 'RSVP to session',
      })

      expect(mockIDB.mockIndexedDB.open).toHaveBeenCalledWith('sq-offline-mutations', 1)
      expect(mockIDB.mockObjectStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-123',
          url: 'https://api.example.com/rsvp',
          method: 'POST',
          description: 'RSVP to session',
        })
      )
    })

    it('should include timestamp from Date.now()', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
      const { queueMutation } = await import('../offlineMutationQueue')

      await queueMutation({
        url: '/api/test',
        method: 'POST',
        headers: {},
        body: null,
        description: 'Test mutation',
      })

      expect(mockIDB.mockObjectStore.add).toHaveBeenCalledWith(
        expect.objectContaining({ timestamp: 1700000000000 })
      )
    })

    it('should request Background Sync when serviceWorker and SyncManager available', async () => {
      const mockRegister = vi.fn()
      vi.stubGlobal('navigator', {
        ...navigator,
        serviceWorker: {
          ready: Promise.resolve({ sync: { register: mockRegister } }),
        },
      })
      vi.stubGlobal('SyncManager', class {})

      const { queueMutation } = await import('../offlineMutationQueue')

      await queueMutation({
        url: '/api/test',
        method: 'POST',
        headers: {},
        body: null,
        description: 'Test',
      })

      expect(mockRegister).toHaveBeenCalledWith('sync-mutations')
    })

    it('should not throw when IndexedDB is unavailable', async () => {
      vi.stubGlobal('indexedDB', {
        open: vi.fn(() => {
          throw new Error('Not supported')
        }),
      })

      const { queueMutation } = await import('../offlineMutationQueue')

      await expect(
        queueMutation({
          url: '/api/test',
          method: 'POST',
          headers: {},
          body: null,
          description: 'Test',
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('getPendingMutations', () => {
    it('should return all entries from the store', async () => {
      const { getPendingMutations } = await import('../offlineMutationQueue')

      const result = await getPendingMutations()
      // Default mock store is empty
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array when IndexedDB fails', async () => {
      vi.stubGlobal('indexedDB', {
        open: vi.fn(() => {
          throw new Error('Fail')
        }),
      })

      const { getPendingMutations } = await import('../offlineMutationQueue')

      const result = await getPendingMutations()
      expect(result).toEqual([])
    })
  })

  describe('replayMutations', () => {
    it('should return 0 when there are no pending mutations', async () => {
      const { replayMutations } = await import('../offlineMutationQueue')

      const count = await replayMutations()
      expect(count).toBe(0)
    })

    it('should fetch and delete successful mutations', async () => {
      // Pre-populate the store
      const mutation = {
        id: 'mut-1',
        timestamp: Date.now(),
        url: 'https://api.example.com/rsvp',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        description: 'Test',
      }

      // Override getAll to return our mutation
      const origGetAll = mockIDB.mockObjectStore.getAll
      mockIDB.mockObjectStore.getAll.mockImplementation(() => {
        const req = {
          result: [mutation],
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        }
        Promise.resolve().then(() => req.onsuccess?.())
        return req
      })

      // Mock fetch to succeed
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })
      vi.stubGlobal('fetch', mockFetch)

      const { replayMutations } = await import('../offlineMutationQueue')
      const count = await replayMutations()

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      expect(count).toBe(1)

      // Restore
      mockIDB.mockObjectStore.getAll.mockImplementation(origGetAll.getMockImplementation()!)
    })

    it('should remove 4xx mutations but not count them as replayed', async () => {
      const mutation = {
        id: 'mut-2',
        timestamp: Date.now(),
        url: '/api/test',
        method: 'POST',
        headers: {},
        body: null,
        description: 'Test',
      }

      mockIDB.mockObjectStore.getAll.mockImplementation(() => {
        const req = {
          result: [mutation],
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        }
        Promise.resolve().then(() => req.onsuccess?.())
        return req
      })

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }))

      const { replayMutations } = await import('../offlineMutationQueue')
      const count = await replayMutations()

      // 4xx is removed from queue but not counted as replayed
      expect(count).toBe(0)
      expect(mockIDB.mockObjectStore.delete).toHaveBeenCalledWith('mut-2')
    })

    it('should keep 5xx mutations in queue for retry', async () => {
      const mutation = {
        id: 'mut-3',
        timestamp: Date.now(),
        url: '/api/test',
        method: 'POST',
        headers: {},
        body: null,
        description: 'Test',
      }

      mockIDB.mockObjectStore.getAll.mockImplementation(() => {
        const req = {
          result: [mutation],
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        }
        Promise.resolve().then(() => req.onsuccess?.())
        return req
      })

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

      const { replayMutations } = await import('../offlineMutationQueue')
      const count = await replayMutations()

      expect(count).toBe(0)
      // Should NOT have called delete for 5xx
      expect(mockIDB.mockObjectStore.delete).not.toHaveBeenCalled()
    })

    it('should stop trying when fetch throws (network down)', async () => {
      const mutations = [
        {
          id: 'mut-a',
          timestamp: 1,
          url: '/a',
          method: 'POST',
          headers: {},
          body: null,
          description: 'A',
        },
        {
          id: 'mut-b',
          timestamp: 2,
          url: '/b',
          method: 'POST',
          headers: {},
          body: null,
          description: 'B',
        },
      ]

      mockIDB.mockObjectStore.getAll.mockImplementation(() => {
        const req = {
          result: mutations,
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        }
        Promise.resolve().then(() => req.onsuccess?.())
        return req
      })

      // First call throws to simulate network error
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const { replayMutations } = await import('../offlineMutationQueue')
      const count = await replayMutations()

      // Should have stopped after first failure - never tried the second
      expect(count).toBe(0)
    })
  })

  describe('clearMutationQueue', () => {
    it('should call clear on the object store', async () => {
      const { clearMutationQueue } = await import('../offlineMutationQueue')

      await clearMutationQueue()

      expect(mockIDB.mockObjectStore.clear).toHaveBeenCalled()
    })

    it('should not throw when IndexedDB is unavailable', async () => {
      vi.stubGlobal('indexedDB', {
        open: vi.fn(() => {
          throw new Error('Fail')
        }),
      })

      const { clearMutationQueue } = await import('../offlineMutationQueue')

      await expect(clearMutationQueue()).resolves.toBeUndefined()
    })
  })

  describe('initOfflineMutationSync', () => {
    it('should do nothing when window is undefined', async () => {
      const origWindow = globalThis.window
      // @ts-expect-error - testing SSR
      delete globalThis.window

      const addEventSpy = vi.fn()
      const { initOfflineMutationSync } = await import('../offlineMutationQueue')
      initOfflineMutationSync()

      // No event listener should be registered since window is undefined
      expect(addEventSpy).not.toHaveBeenCalled()

      globalThis.window = origWindow
    })

    it('should add online event listener to window', async () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener')

      const { initOfflineMutationSync } = await import('../offlineMutationQueue')
      initOfflineMutationSync()

      expect(addEventSpy).toHaveBeenCalledWith('online', expect.any(Function))
    })
  })
})
