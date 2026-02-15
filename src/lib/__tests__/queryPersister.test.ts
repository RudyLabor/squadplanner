import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createIDBPersister, type Persister } from '../queryPersister'

// Mock IndexedDB using fake-indexeddb (jsdom doesn't include it)
// We'll create a simple in-memory mock of IndexedDB
const mockStore = vi.hoisted(() => new Map<string, unknown>())

const mockGet = vi.hoisted(() =>
  vi.fn((key: string) => {
    const req = {
      result: mockStore.get(key),
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      error: null as Error | null,
    }
    setTimeout(() => req.onsuccess?.(), 0)
    return req
  })
)

const mockPut = vi.hoisted(() =>
  vi.fn((_value: unknown, _key: string) => {
    const req = {
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      error: null as Error | null,
    }
    setTimeout(() => {
      mockStore.set(_key, _value)
      req.onsuccess?.()
    }, 0)
    return req
  })
)

const mockDelete = vi.hoisted(() =>
  vi.fn((_key: string) => {
    const req = {
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      error: null as Error | null,
    }
    setTimeout(() => {
      mockStore.delete(_key)
      req.onsuccess?.()
    }, 0)
    return req
  })
)

const mockObjectStore = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    get: mockGet,
    put: mockPut,
    delete: mockDelete,
  })
)

const mockTransaction = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    objectStore: mockObjectStore,
  })
)

const mockCreateObjectStore = vi.hoisted(() => vi.fn())
const mockObjectStoreNames = vi.hoisted(() => ({
  contains: vi.fn().mockReturnValue(false),
}))

const mockDB = vi.hoisted(() => ({
  transaction: mockTransaction,
  createObjectStore: mockCreateObjectStore,
  objectStoreNames: mockObjectStoreNames,
}))

// Mock indexedDB.open
const mockOpen = vi.hoisted(() =>
  vi.fn(() => {
    const req = {
      result: mockDB,
      onupgradeneeded: null as (() => void) | null,
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      error: null as Error | null,
    }
    setTimeout(() => {
      req.onupgradeneeded?.()
      req.onsuccess?.()
    }, 0)
    return req
  })
)

vi.stubGlobal('indexedDB', { open: mockOpen })

describe('queryPersister', () => {
  let persister: Persister

  beforeEach(() => {
    mockStore.clear()
    mockOpen.mockClear()
    mockGet.mockClear()
    mockPut.mockClear()
    mockDelete.mockClear()
    persister = createIDBPersister()
  })

  describe('createIDBPersister', () => {
    it('creates a persister object with three methods', () => {
      expect(typeof persister.persistClient).toBe('function')
      expect(typeof persister.restoreClient).toBe('function')
      expect(typeof persister.removeClient).toBe('function')
    })

    it('uses default key sq-react-query', async () => {
      const clientData = {
        timestamp: Date.now(),
        buster: 'v1',
        clientState: { queries: [] },
      }
      await persister.persistClient(clientData)
      expect(mockStore.has('sq-react-query')).toBe(true)
    })

    it('uses custom key when provided', async () => {
      const customPersister = createIDBPersister('custom-key')
      const clientData = {
        timestamp: Date.now(),
        buster: 'v1',
        clientState: { queries: [] },
      }
      await customPersister.persistClient(clientData)
      expect(mockStore.has('custom-key')).toBe(true)
    })
  })

  describe('persistClient', () => {
    it('stores client data in IndexedDB', async () => {
      const clientData = {
        timestamp: Date.now(),
        buster: 'v1',
        clientState: { queries: [{ key: 'test' }] },
      }
      await persister.persistClient(clientData)
      expect(mockStore.get('sq-react-query')).toEqual(clientData)
    })

    it('silently catches IndexedDB errors', async () => {
      // Make put throw
      mockPut.mockImplementationOnce(() => {
        const req = {
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          error: new Error('QuotaExceeded'),
        }
        setTimeout(() => req.onerror?.(), 0)
        return req
      })

      // Should not throw
      await expect(
        persister.persistClient({
          timestamp: Date.now(),
          buster: 'v1',
          clientState: {},
        })
      ).resolves.toBeUndefined()
    })

    it('overwrites previous data', async () => {
      const first = { timestamp: 1000, buster: 'v1', clientState: { a: 1 } }
      const second = { timestamp: 2000, buster: 'v2', clientState: { b: 2 } }

      await persister.persistClient(first)
      await persister.persistClient(second)

      expect(mockStore.get('sq-react-query')).toEqual(second)
    })
  })

  describe('restoreClient', () => {
    it('returns stored data when fresh', async () => {
      const clientData = {
        timestamp: Date.now(),
        buster: 'v1',
        clientState: { queries: [{ key: 'test' }] },
      }
      mockStore.set('sq-react-query', clientData)

      const result = await persister.restoreClient()
      expect(result).toEqual(clientData)
    })

    it('returns undefined when no data stored', async () => {
      const result = await persister.restoreClient()
      expect(result).toBeUndefined()
    })

    it('returns undefined and deletes when data is older than 24 hours', async () => {
      const staleData = {
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        buster: 'v1',
        clientState: { queries: [] },
      }
      mockStore.set('sq-react-query', staleData)

      const result = await persister.restoreClient()
      expect(result).toBeUndefined()
    })

    it('returns data when exactly at 24 hour boundary', async () => {
      const borderlineData = {
        timestamp: Date.now() - 24 * 60 * 60 * 1000 + 1000, // just under 24h
        buster: 'v1',
        clientState: { queries: [] },
      }
      mockStore.set('sq-react-query', borderlineData)

      const result = await persister.restoreClient()
      expect(result).toEqual(borderlineData)
    })

    it('silently catches IndexedDB errors and returns undefined', async () => {
      mockGet.mockImplementationOnce(() => {
        const req = {
          result: undefined,
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          error: new Error('DB error'),
        }
        setTimeout(() => req.onerror?.(), 0)
        return req
      })

      const result = await persister.restoreClient()
      expect(result).toBeUndefined()
    })
  })

  describe('removeClient', () => {
    it('removes stored data from IndexedDB', async () => {
      mockStore.set('sq-react-query', { timestamp: Date.now(), buster: 'v1', clientState: {} })

      await persister.removeClient()
      expect(mockStore.has('sq-react-query')).toBe(false)
    })

    it('does not throw when no data to remove', async () => {
      await expect(persister.removeClient()).resolves.toBeUndefined()
    })

    it('silently catches IndexedDB errors', async () => {
      mockDelete.mockImplementationOnce(() => {
        const req = {
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          error: new Error('DB error'),
        }
        setTimeout(() => req.onerror?.(), 0)
        return req
      })

      await expect(persister.removeClient()).resolves.toBeUndefined()
    })
  })

  describe('IndexedDB setup', () => {
    it('opens the database with correct name and version', async () => {
      await persister.persistClient({
        timestamp: Date.now(),
        buster: 'v1',
        clientState: {},
      })

      expect(mockOpen).toHaveBeenCalledWith('sq-query-cache', 1)
    })

    it('creates object store on upgrade if not existing', async () => {
      mockObjectStoreNames.contains.mockReturnValue(false)

      await persister.persistClient({
        timestamp: Date.now(),
        buster: 'v1',
        clientState: {},
      })

      expect(mockCreateObjectStore).toHaveBeenCalledWith('queries')
    })
  })

  describe('multiple persisters with different keys', () => {
    it('can use separate storage keys independently', async () => {
      const persisterA = createIDBPersister('key-a')
      const persisterB = createIDBPersister('key-b')

      await persisterA.persistClient({
        timestamp: Date.now(),
        buster: 'v1',
        clientState: { a: true },
      })
      await persisterB.persistClient({
        timestamp: Date.now(),
        buster: 'v1',
        clientState: { b: true },
      })

      expect(mockStore.get('key-a')).toEqual(
        expect.objectContaining({ clientState: { a: true } })
      )
      expect(mockStore.get('key-b')).toEqual(
        expect.objectContaining({ clientState: { b: true } })
      )
    })
  })
})
