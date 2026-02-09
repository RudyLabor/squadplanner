import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface MessageToastProps {
  message: string
  isVisible: boolean
  variant?: 'success' | 'error'
}

export function MessageToast({ message, isVisible, variant = 'success' }: MessageToastProps) {
  const styles = {
    success: { bg: 'bg-success', text: 'text-bg-base', Icon: CheckCircle2 },
    error: { bg: 'bg-error', text: 'text-white', Icon: AlertCircle },
  }
  const style = styles[variant]
  const Icon = style.Icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${style.bg} ${style.text} shadow-lg`}>
            <Icon className="w-5 h-5" />
            <span className="text-md font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
