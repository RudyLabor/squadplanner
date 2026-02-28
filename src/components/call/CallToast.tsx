import { m, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle } from '../icons'
export function CallToast({
  message,
  isVisible,
  variant = 'success',
}: {
  message: string
  isVisible: boolean
  variant?: 'success' | 'error'
}) {
  const variantStyles = {
    success: {
      bg: 'bg-success',
      text: 'text-bg-base',
      Icon: CheckCircle2,
    },
    error: {
      bg: 'bg-error',
      text: 'text-white',
      Icon: AlertCircle,
    },
  }

  const style = variantStyles[variant]
  const Icon = style.Icon

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[110]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl ${style.bg} ${style.text} shadow-lg`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-base font-medium">{message}</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
