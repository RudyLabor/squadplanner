
import { useEffect } from 'react'
import { m } from 'framer-motion'
import { Sparkles } from '../icons'
export function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  const isCelebration = message.includes('confirm') || message.includes('\uD83D\uDD25')

  useEffect(() => {
    const timer = setTimeout(onClose, isCelebration ? 4000 : 3000)
    return () => clearTimeout(timer)
  }, [onClose, isCelebration])

  return (
    <m.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <m.div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium shadow-xl ${
          isCelebration
            ? 'bg-gradient-to-r from-success to-success text-bg-base shadow-glow-success'
            : 'bg-success text-bg-base shadow-lg'
        }`}
        animate={isCelebration ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3, repeat: isCelebration ? 2 : 0 }}
      >
        <m.div
          animate={isCelebration ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 0.5, repeat: isCelebration ? 2 : 0 }}
        >
          <Sparkles className="w-5 h-5" />
        </m.div>
        <span className="text-md">{message}</span>
      </m.div>
    </m.div>
  )
}
