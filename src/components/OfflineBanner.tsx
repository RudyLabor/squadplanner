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
            <div className="mx-4 mt-2 p-3 rounded-xl bg-error/15 border border-error/20 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center flex-shrink-0">
                  <WifiOff className="w-4 h-4 text-error" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-md font-medium text-error">
                    Hors ligne
                  </p>
                  <p className="text-sm text-error/80">
                    Vérifie ta connexion internet
                  </p>
                </div>
                <button
                  onClick={dismissOfflineBanner}
                  className="p-2 rounded-lg hover:bg-overlay-light transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-error/60" />
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
            <div className="mx-4 mt-2 p-3 rounded-xl bg-success/15 border border-success/20 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-md font-medium text-success">
                    Connexion rétablie
                  </p>
                </div>
                <button
                  onClick={dismissReconnectedBanner}
                  className="p-2 rounded-lg hover:bg-overlay-light transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-success/60" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
