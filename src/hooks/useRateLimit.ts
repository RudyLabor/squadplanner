/**
 * Chantier 9 - Rate Limit Store
 *
 * Centralized Zustand store for rate-limit detection.
 * Any API call that receives a 429 response can call `triggerRateLimit(retryAfter)`
 * and the RateLimitBanner will appear automatically in App.tsx.
 *
 * Usage from API layer:
 *   import { useRateLimitStore } from '../hooks/useRateLimit'
 *   useRateLimitStore.getState().triggerRateLimit(60)
 */
import { create } from 'zustand'

interface RateLimitState {
  isRateLimited: boolean
  retryAfter: number
  triggerRateLimit: (retryAfter?: number) => void
  dismiss: () => void
  reset: () => void
}

export const useRateLimitStore = create<RateLimitState>((set) => ({
  isRateLimited: false,
  retryAfter: 60,
  triggerRateLimit: (retryAfter = 60) => set({ isRateLimited: true, retryAfter }),
  dismiss: () => set({ isRateLimited: false }),
  reset: () => set({ isRateLimited: false, retryAfter: 60 }),
}))
