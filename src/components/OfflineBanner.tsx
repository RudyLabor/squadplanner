import { m, AnimatePresence } from 'framer-motion'
import { useOfflineBanner } from '../hooks/useOffline'
import { WifiOff, Wifi } from './icons'

/**
 * Global offline/reconnection banner.
 * Shows a subtle bar at the top when connection is lost,
 * and a brief "reconnected" message when it comes back.
 */
export function OfflineBanner() {
  const { showOfflineBanner, showReconnectedBanner } = useOfflineBanner()

  return (
    <AnimatePresence>
      {showOfflineBanner && (
        <m.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="overflow-hidden z-50"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/20 text-warning text-xs font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Connexion perdue — les modifications seront synchronisées au retour</span>
          </div>
        </m.div>
      )}
      {showReconnectedBanner && (
        <m.div
          key="reconnected"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="overflow-hidden z-50"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-success/10 border-b border-success/20 text-success text-xs font-medium">
            <Wifi className="w-3.5 h-3.5" />
            <span>Connexion rétablie</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineBanner
