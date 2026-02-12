import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

const STORAGE_KEY = 'sq-user-status'

describe('useUserStatusStore', () => {
  let localStorageStore: Record<string, string>

  beforeEach(() => {
    vi.useFakeTimers()

    // Mock localStorage before importing the store
    localStorageStore = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageStore[key] ?? null
    )
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      localStorageStore[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete localStorageStore[key]
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    // Reset module cache so each test gets fresh store initialization
    vi.resetModules()
  })

  async function getStore() {
    const mod = await import('../useUserStatus')
    return mod.useUserStatusStore
  }

  it('defaults to availability online, null customStatus, null gameStatus', async () => {
    const store = await getStore()
    const state = store.getState()
    expect(state.availability).toBe('online')
    expect(state.customStatus).toBeNull()
    expect(state.gameStatus).toBeNull()
  })

  it('setAvailability changes status and persists to localStorage', async () => {
    const store = await getStore()
    act(() => {
      store.getState().setAvailability('busy')
    })
    expect(store.getState().availability).toBe('busy')

    const persisted = JSON.parse(localStorageStore[STORAGE_KEY])
    expect(persisted.availability).toBe('busy')
  })

  it('setCustomStatus sets status and persists', async () => {
    const store = await getStore()
    const status = { emoji: '🎮', text: 'Gaming', expiresAt: null }
    act(() => {
      store.getState().setCustomStatus(status)
    })
    expect(store.getState().customStatus).toEqual(status)

    const persisted = JSON.parse(localStorageStore[STORAGE_KEY])
    expect(persisted.customStatus).toEqual(status)
  })

  it('setCustomStatus with expiresAt schedules auto-clear', async () => {
    const store = await getStore()
    const now = Date.now()
    const expiresAt = new Date(now + 5000).toISOString()
    const status = { emoji: '🔴', text: 'Busy', expiresAt }

    act(() => {
      store.getState().setCustomStatus(status)
    })
    expect(store.getState().customStatus).toEqual(status)

    // Advance time past expiry
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(store.getState().customStatus).toBeNull()
  })

  it('setGameStatus sets game with startedAt timestamp', async () => {
    const store = await getStore()
    vi.setSystemTime(new Date('2026-02-10T12:00:00Z'))

    act(() => {
      store.getState().setGameStatus('Fortnite')
    })
    const gameStatus = store.getState().gameStatus
    expect(gameStatus).not.toBeNull()
    expect(gameStatus!.game).toBe('Fortnite')
    expect(gameStatus!.startedAt).toBe('2026-02-10T12:00:00.000Z')
  })

  it('setGameStatus(null) clears game status', async () => {
    const store = await getStore()
    act(() => {
      store.getState().setGameStatus('Valorant')
    })
    expect(store.getState().gameStatus).not.toBeNull()

    act(() => {
      store.getState().setGameStatus(null)
    })
    expect(store.getState().gameStatus).toBeNull()
  })

  it('clearExpiredStatus removes expired custom status', async () => {
    const store = await getStore()
    const pastDate = new Date(Date.now() - 10000).toISOString()
    const status = { emoji: '⏰', text: 'Expired', expiresAt: pastDate }

    act(() => {
      // Set directly to avoid the setTimeout auto-clear triggering immediately
      store.setState({ customStatus: status })
    })
    expect(store.getState().customStatus).toEqual(status)

    act(() => {
      store.getState().clearExpiredStatus()
    })
    expect(store.getState().customStatus).toBeNull()
  })

  it('clearExpiredStatus keeps non-expired custom status', async () => {
    const store = await getStore()
    const futureDate = new Date(Date.now() + 60000).toISOString()
    const status = { emoji: '✅', text: 'Active', expiresAt: futureDate }

    act(() => {
      store.getState().setCustomStatus(status)
    })

    act(() => {
      store.getState().clearExpiredStatus()
    })
    expect(store.getState().customStatus).toEqual(status)
  })

  it('loads persisted state from localStorage on creation', async () => {
    const persisted = {
      availability: 'dnd',
      customStatus: { emoji: '🎵', text: 'Listening to music', expiresAt: null },
      gameStatus: { game: 'Minecraft', startedAt: '2026-02-10T10:00:00.000Z' },
    }
    localStorageStore[STORAGE_KEY] = JSON.stringify(persisted)

    const store = await getStore()
    const state = store.getState()
    expect(state.availability).toBe('dnd')
    expect(state.customStatus).toEqual(persisted.customStatus)
    expect(state.gameStatus).toEqual(persisted.gameStatus)
  })
})
