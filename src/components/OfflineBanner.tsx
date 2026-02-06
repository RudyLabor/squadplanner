/**
 * PHASE - Offline Banner Component
 *
 * Shows clear feedback when the user is offline
 * and when they reconnect.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, X } from 'lucide-react'
import { useOfflineBanner } from '../hooks/useOffline'

export function OfflineBanner() {
  const {
    showOfflineBanner,
    showReconnectedBanner,
    dismissOfflineBanner,
    dismissReconnectedBanner,
  } = useOfflineBanner()

  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence>
        {showOfflineBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[9999] safe-area-pt"
            role="alert"
            aria-live="assertive"
          >
            <div className="mx-4 mt-2 p-3 rounded-xl bg-[#f87171]/15 border border-[#f87171]/20 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f87171]/20 flex items-center justify-center flex-shrink-0">
                  <WifiOff className="w-4 h-4 text-[#f87171]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#f87171]">
                    Hors ligne
                  </p>
                  <p className="text-[12px] text-[#f87171]/80">
                    Vérifie ta connexion internet
                  </p>
                </div>
                <button
                  onClick={dismissOfflineBanner}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-[#f87171]/60" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnected Banner */}
      <AnimatePresence>
        {showReconnectedBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[9999] safe-area-pt"
            role="status"
            aria-live="polite"
          >
            <div className="mx-4 mt-2 p-3 rounded-xl bg-[#34d399]/15 border border-[#34d399]/20 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#34d399]/20 flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-4 h-4 text-[#34d399]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#34d399]">
                    Connexion rétablie
                  </p>
                </div>
                <button
                  onClick={dismissReconnectedBanner}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-[#34d399]/60" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
