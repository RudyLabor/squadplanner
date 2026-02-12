import { create } from 'zustand'

/**
 * Shared overlay store — ensures only one popup/dropdown is open at a time.
 * Prevents visual superposition between Notifications panel and More menu.
 */
type OverlayId = 'notifications' | 'more-menu' | null

interface OverlayStore {
  activeOverlay: OverlayId
  open: (id: OverlayId) => void
  close: (id?: OverlayId) => void
  toggle: (id: Exclude<OverlayId, null>) => void
}

export const useOverlayStore = create<OverlayStore>((set, get) => ({
  activeOverlay: null,
  open: (id) => set({ activeOverlay: id }),
  close: (id) => {
    const { activeOverlay } = get()
    // If id is specified, only close if it matches
    if (id && activeOverlay !== id) return
    set({ activeOverlay: null })
  },
  toggle: (id) => {
    const { activeOverlay } = get()
    set({ activeOverlay: activeOverlay === id ? null : id })
  },
}))
