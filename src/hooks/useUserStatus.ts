/**
 * Phase 4.2.2 — User status store (Zustand)
 * Manages availability, custom status, and game status
 * Persisted in localStorage, broadcast via Supabase Presence
 */
import { create } from 'zustand'

export type AvailabilityStatus = 'online' | 'busy' | 'dnd' | 'invisible'

export interface CustomStatus {
  emoji: string
  text: string
  expiresAt: string | null // ISO string or null for "don't clear"
}

export interface GameStatus {
  game: string
  startedAt: string // ISO string
}

interface UserStatusState {
  availability: AvailabilityStatus
  customStatus: CustomStatus | null
  gameStatus: GameStatus | null

  setAvailability: (status: AvailabilityStatus) => void
  setCustomStatus: (status: CustomStatus | null) => void
  setGameStatus: (game: string | null) => void
  clearExpiredStatus: () => void
}

const STORAGE_KEY = 'sq-user-status'

function loadPersistedStatus(): Pick<UserStatusState, 'availability' | 'customStatus' | 'gameStatus'> {
  if (typeof window === 'undefined') return { availability: 'online', customStatus: null, gameStatus: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { availability: 'online', customStatus: null, gameStatus: null }
    const parsed = JSON.parse(raw)
    return {
      availability: parsed.availability || 'online',
      customStatus: parsed.customStatus || null,
      gameStatus: parsed.gameStatus || null,
    }
  } catch {
    return { availability: 'online', customStatus: null, gameStatus: null }
  }
}

function persistStatus(state: Pick<UserStatusState, 'availability' | 'customStatus' | 'gameStatus'>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export const useUserStatusStore = create<UserStatusState>((set, get) => {
  const initial = loadPersistedStatus()

  return {
    ...initial,

    setAvailability: (availability) => {
      set({ availability })
      persistStatus({ ...get(), availability })
    },

    setCustomStatus: (customStatus) => {
      set({ customStatus })
      persistStatus({ ...get(), customStatus })

      // Schedule auto-clear if expiry is set
      if (customStatus?.expiresAt) {
        const ms = new Date(customStatus.expiresAt).getTime() - Date.now()
        if (ms > 0) {
          setTimeout(() => {
            const current = get().customStatus
            if (current?.expiresAt === customStatus.expiresAt) {
              get().setCustomStatus(null)
            }
          }, ms)
        }
      }
    },

    setGameStatus: (game) => {
      const gameStatus = game ? { game, startedAt: new Date().toISOString() } : null
      set({ gameStatus })
      persistStatus({ ...get(), gameStatus })
    },

    clearExpiredStatus: () => {
      const { customStatus } = get()
      if (customStatus?.expiresAt) {
        const now = new Date()
        if (new Date(customStatus.expiresAt) <= now) {
          get().setCustomStatus(null)
        }
      }
    },
  }
})

export const AVAILABILITY_CONFIG: Record<AvailabilityStatus, { label: string; color: string; dotClass: string }> = {
  online: { label: 'En ligne', color: 'var(--color-success)', dotClass: 'bg-emerald-400' },
  busy: { label: 'Occupe', color: 'var(--color-warning)', dotClass: 'bg-amber-400' },
  dnd: { label: 'Ne pas deranger', color: 'var(--color-error)', dotClass: 'bg-red-400' },
  invisible: { label: 'Invisible', color: 'var(--color-text-tertiary)', dotClass: 'bg-zinc-500' },
}
