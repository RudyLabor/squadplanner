import { useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, WifiOff } from '../../components/icons'
export function PartyToast({ message, isVisible, onClose, variant = 'success' }: {
  message: string; isVisible: boolean; onClose: () => void; variant?: 'success' | 'error' | 'warning'
}) {
  useEffect(() => {
    if (isVisible) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer) }
  }, [isVisible, onClose])

  const variantStyles = {
    success: { bg: 'bg-success', text: 'text-bg-base', Icon: CheckCircle2 },
    error: { bg: 'bg-error', text: 'text-white', Icon: AlertCircle },
    warning: { bg: 'bg-warning', text: 'text-bg-base', Icon: WifiOff }
  }
  const style = variantStyles[variant]
  const Icon = style.Icon

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div className="fixed top-4 left-1/2 -translate-x-1/2 z-50" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${style.bg} ${style.text} shadow-lg`}>
            <Icon className="w-5 h-5" /><span className="text-md font-medium">{message}</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
