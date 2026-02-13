
import { useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Sparkles } from '../../components/icons'
export function StepToast({
  message,
  isVisible,
  onClose,
}: {
  message: string
  isVisible: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success text-bg-base font-medium shadow-lg shadow-glow-success">
            <Sparkles className="w-5 h-5" />
            <span>{message}</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
