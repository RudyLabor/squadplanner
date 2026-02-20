import { m } from 'framer-motion'
import { useState, useEffect } from 'react'
import { X, Gift } from './icons'

interface AnnualPushBannerProps {
  className?: string
}

/**
 * December annual plan push banner
 * Encourages users to upgrade to annual plans with New Year's theme
 * Shows only in December 2026 and respects localStorage dismissal
 */
export function AnnualPushBanner({ className = '' }: AnnualPushBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)

    // Check if banner was dismissed
    const isDismissed = localStorage.getItem('sq-annual-push-dismissed-2026') === 'true'
    if (isDismissed) {
      setIsVisible(false)
      return
    }

    const now = new Date()

    // Only show in December 2026
    if (now.getMonth() === 11 && now.getFullYear() === 2026) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('sq-annual-push-dismissed-2026', 'true')
    setIsVisible(false)
  }

  if (!isHydrated || !isVisible) {
    return null
  }

  return (
    <m.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
      className={`mx-4 sm:mx-auto max-w-2xl mt-4 ${className}`}
    >
      {/* Card container with gradient border */}
      <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 p-0.5 rounded-lg">
        {/* Inner card */}
        <div className="bg-surface-dark rounded-lg px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <m.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xl sm:text-2xl"
                >
                  🎁
                </m.span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Résolution gaming 2027
                </h3>
              </div>

              {/* Main CTA text */}
              <p className="text-sm sm:text-base text-text-secondary mb-3 leading-relaxed">
                Passe au plan annuel et économise <span className="text-emerald-400 font-bold">30%</span>
              </p>

              {/* Price comparison */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-xs sm:text-sm">
                  <p className="text-text-tertiary line-through">6,99€/mois</p>
                  <p className="text-emerald-400 font-bold text-sm sm:text-base">
                    À partir de 4,99€/mois
                  </p>
                </div>
              </div>

              {/* Benefit bullets */}
              <ul className="space-y-1 text-xs sm:text-sm text-text-secondary mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Facturé une fois par an
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Accès illimité à toutes les fonctionnalités
                </li>
              </ul>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 hover:bg-border-hover rounded-lg transition-colors active:scale-90"
              aria-label="Dismisser la bannière"
            >
              <X className="w-5 h-5 text-text-secondary hover:text-text-primary" />
            </button>
          </div>

          {/* CTA Button - full width on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border-hover">
            <p className="text-xs text-text-tertiary">
              Commence bien 2027 avec ta squad! 🚀
            </p>
            <a
              href="/premium"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold text-sm hover:from-emerald-600 hover:to-teal-600 transition-colors active:scale-95 whitespace-nowrap"
            >
              Voir les plans
            </a>
          </div>
        </div>
      </div>
    </m.div>
  )
}

export default AnnualPushBanner
