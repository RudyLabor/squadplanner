import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QuietHoursState {
  enabled: boolean
  startHour: number // 0-23
  endHour: number // 0-23
  setEnabled: (v: boolean) => void
  setStartHour: (h: number) => void
  setEndHour: (h: number) => void
  isQuietNow: () => boolean
}

export const useQuietHoursStore = create<QuietHoursState>()(
  persist(
    (set, get) => ({
      enabled: true,
      startHour: 23,
      endHour: 8,
      setEnabled: (enabled) => set({ enabled }),
      setStartHour: (startHour) => set({ startHour }),
      setEndHour: (endHour) => set({ endHour }),
      isQuietNow: () => {
        const { enabled, startHour, endHour } = get()
        if (!enabled) return false
        const hour = new Date().getHours()
        if (startHour > endHour) {
          // Overnight range (e.g., 23-8)
          return hour >= startHour || hour < endHour
        }
        return hour >= startHour && hour < endHour
      },
    }),
    { name: 'squadplanner-quiet-hours' }
  )
)
