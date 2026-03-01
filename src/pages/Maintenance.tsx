/**
 * Chantier 9 - Maintenance Page
 *
 * Full-screen page shown when the app is under planned maintenance.
 * Auto-refreshes every 30 seconds and shows a countdown.
 */
import { useState, useEffect, useCallback } from 'react'
import { m } from 'framer-motion'
import { Wrench, RefreshCw, ExternalLink } from '../components/icons'
import { useSearchParams } from 'react-router'

const AUTO_REFRESH_SECONDS = 30

export default function Maintenance() {
  const [searchParams] = useSearchParams()
  const eta = searchParams.get('eta') // Optional ETA from URL
  const [secondsSinceCheck, setSecondsSinceCheck] = useState(0)
  const [ariaSeconds, setAriaSeconds] = useState(0)

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceCheck((prev) => {
        if (prev >= AUTO_REFRESH_SECONDS - 1) {
          // Reload the page
          window.location.reload()
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Throttled aria-live update every 10 seconds to avoid spamming screen readers
  useEffect(() => {
    const ariaInterval = setInterval(() => {
      setAriaSeconds(secondsSinceCheck)
    }, 10000)

    return () => clearInterval(ariaInterval)
  }, [secondsSinceCheck])

  const handleManualRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  const timeUntilRefresh = AUTO_REFRESH_SECONDS - secondsSinceCheck

  return (
    <div className="min-h-screen bg-bg-base mesh-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated wrench icon */}
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative w-20 h-20 mx-auto mb-8"
        >
          {/* Glow */}
          <m.div
            className="absolute inset-0 rounded-full blur-xl bg-warning/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Icon container */}
          <m.div
            className="relative w-20 h-20 rounded-2xl bg-warning/15 flex items-center justify-center"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Wrench className="w-10 h-10 text-warning" />
          </m.div>
        </m.div>

        {/* Title */}
        <m.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-2xl font-bold font-display text-text-primary mb-3"
        >
          Nous améliorons Squad Planner
        </m.h1>

        {/* Message */}
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-base text-text-secondary mb-4"
        >
          On améliore l'app pour toi. Squad Planner est de retour très bientôt.
        </m.p>

        {/* ETA */}
        {eta && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card border border-border-subtle mb-6"
          >
            <span className="text-sm text-text-tertiary">Retour prévu :</span>
            <span className="text-sm font-medium text-text-primary">{eta}</span>
          </m.div>
        )}

        {/* Progress bar animation */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="w-full h-1.5 bg-border-subtle rounded-full overflow-hidden mb-6 mt-2"
        >
          <m.div
            className="h-full bg-warning/60 rounded-full"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ width: '40%' }}
          />
        </m.div>

        {/* Auto-refresh countdown */}
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-sm text-text-tertiary mb-6"
          aria-hidden="true"
        >
          Dernière vérification il y a {secondsSinceCheck}s &middot; prochaine dans{' '}
          {timeUntilRefresh}s
        </m.p>
        {/* Throttled aria-live (updates every 10s instead of every 1s) */}
        <p className="sr-only" aria-live="polite">
          Dernière vérification il y a {ariaSeconds} secondes, prochaine dans{' '}
          {AUTO_REFRESH_SECONDS - ariaSeconds} secondes
        </p>

        {/* Manual refresh button */}
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          onClick={handleManualRefresh}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-bg text-white text-base font-medium hover:bg-primary-bg-hover transition-colors mb-6"
        >
          <RefreshCw className="w-4 h-4" />
          Vérifier maintenant
        </m.button>

        {/* Social links placeholder */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="flex items-center justify-center gap-4"
        >
          <a
            href="https://x.com/squadplannerfr"
            className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Suivre les mises à jour
          </a>
        </m.div>
      </div>
    </div>
  )
}
