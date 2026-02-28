import { m, AnimatePresence } from 'framer-motion'
import { Star, X } from './icons'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Only show after 3+ sessions completed
const useRatingStore = create<{
  dismissed: boolean
  sessionsCompleted: number
  dismiss: () => void
  incrementSessions: () => void
}>()(
  persist(
    (set, get) => ({
      dismissed: false,
      sessionsCompleted: 0,
      dismiss: () => set({ dismissed: true }),
      incrementSessions: () => set({ sessionsCompleted: get().sessionsCompleted + 1 }),
    }),
    { name: 'squadplanner-rating' }
  )
)

export function RatingPrompt() {
  const { dismissed, sessionsCompleted, dismiss } = useRatingStore()

  const shouldShow = !dismissed && sessionsCompleted >= 3

  return (
    <AnimatePresence>
      {shouldShow && (
        <m.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-border-subtle rounded-2xl p-5 shadow-lg max-w-sm mx-4"
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-bg-hover text-text-tertiary"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">3 sessions réussies — ton avis compte&#x202f;!</p>
              <p className="text-xs text-text-tertiary">Dis-nous ce que tu en penses en 30 secondes</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                window.open('https://squadplanner.fr/review', '_blank')
                dismiss()
              }}
              className="flex-1 py-2 px-4 bg-primary-bg text-white rounded-xl text-sm font-semibold hover:bg-primary-bg-hover transition-colors"
            >
              Laisser un avis
            </button>
            <button
              onClick={dismiss}
              className="py-2 px-4 bg-bg-hover text-text-secondary rounded-xl text-sm hover:bg-bg-active transition-colors"
            >
              Plus tard
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

export { useRatingStore }
