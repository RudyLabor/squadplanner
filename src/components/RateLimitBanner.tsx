/**
 * Chantier 9 - Rate Limit Banner
 *
 * Fixed banner at the top of the screen shown when API rate limits are hit.
 * Displays a countdown timer and auto-retries when the timer reaches 0.
 */
import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, RefreshCw } from './icons'
export interface RateLimitBannerProps {
  retryAfter: number // seconds until retry is allowed
  onRetry?: () => void
  onDismiss?: () => void
  message?: string
}

export function RateLimitBanner({ retryAfter, onRetry, onDismiss, message }: RateLimitBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfter)
  const [timerDone, setTimerDone] = useState(false)

  // Reset timer when retryAfter changes
  useEffect(() => {
    setSecondsLeft(retryAfter)
    setTimerDone(false)
  }, [retryAfter])

  // Countdown every second
  useEffect(() => {
    if (secondsLeft <= 0) {
      setTimerDone(true)
      // Auto-retry when timer reaches 0 (if no explicit retry button desired)
      if (onRetry && !timerDone) {
        onRetry()
      }
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft, onRetry, timerDone])

  const handleRetry = useCallback(() => {
    onRetry?.()
  }, [onRetry])

  return (
    <AnimatePresence>
      <m.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[9999] safe-area-pt"
        role="alert"
        aria-live="polite"
      >
        <div className="mx-4 mt-2 p-3 rounded-xl bg-warning/15 border border-warning/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-md font-medium text-warning">{message || 'Trop de requêtes'}</p>
              <p className="text-sm text-warning/80">
                {timerDone
                  ? 'Tu peux réessayer maintenant'
                  : `Réessai possible dans ${secondsLeft}s`}
              </p>
            </div>

            {/* Retry button (shown when timer is done) */}
            {timerDone && onRetry && (
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 rounded-lg bg-warning/20 text-warning text-sm font-medium hover:bg-warning/30 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réessayer
              </button>
            )}

            {/* Dismiss */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-2 rounded-lg hover:bg-overlay-light transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-warning/60" />
              </button>
            )}
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}

export default RateLimitBanner
