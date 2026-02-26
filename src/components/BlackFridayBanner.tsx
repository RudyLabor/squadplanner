import { m } from 'framer-motion'
import { useState, useEffect } from 'react'
import { X } from './icons'

interface BlackFridayBannerProps {
  className?: string
}

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Black Friday / Cyber Gaming Week promotional banner
 * Shows countdown timer and CTA for annual plans
 * Auto-hides after Nov 30, 2026 and respects localStorage dismissal
 */
export function BlackFridayBanner({ className = '' }: BlackFridayBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)

    // Check if banner was dismissed
    const isDismissed = localStorage.getItem('sq-bf-dismissed-2026') === 'true'
    if (isDismissed) {
      setIsVisible(false)
      return
    }

    const now = new Date()
    const currentYear = now.getFullYear()

    // Campaign dates: Nov 23 - Nov 30, 2026
    const startDate = new Date(2026, 10, 23, 0, 0, 0) // Nov 23
    const endDate = new Date(2026, 10, 30, 23, 59, 59) // Nov 30, 23:59:59

    // Check if we're in the campaign window
    if (now >= startDate && now <= endDate) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const updateCountdown = () => {
      const now = new Date()
      const endDate = new Date(2026, 10, 30, 23, 59, 59) // Nov 30, 23:59:59

      const totalSeconds = Math.floor((endDate.getTime() - now.getTime()) / 1000)

      if (totalSeconds <= 0) {
        setIsVisible(false)
        return
      }

      const days = Math.floor(totalSeconds / (24 * 60 * 60))
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
      const seconds = totalSeconds % 60

      setCountdown({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [isVisible])

  const handleDismiss = () => {
    localStorage.setItem('sq-bf-dismissed-2026', 'true')
    setIsVisible(false)
  }

  if (!isHydrated || !isVisible) {
    return null
  }

  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-40 w-full ${className}`}
    >
      {/* Animated gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple via-orange-500 to-purple bg-[length:200%_100%]">
        <style>{`
          @keyframes gradient-shift {
            0% { background-position: 0% center; }
            50% { background-position: 100% center; }
            100% { background-position: 0% center; }
          }
          .gradient-animate {
            animation: gradient-shift 6s ease infinite;
          }
        `}</style>
        <div className="gradient-animate w-full" />

        <div className="relative px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            {/* Left content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                {/* Main text */}
                <div className="flex-shrink-0">
                  <p className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                    🔥 CYBER GAMING WEEK — -40% sur tous les plans annuels
                  </p>
                </div>

                {/* Countdown timer */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-semibold">
                  <span className="hidden sm:inline">Fin dans :</span>
                  <span className="bg-black/20 px-2 py-1 rounded whitespace-nowrap">
                    {countdown.days}j {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                  </span>
                </div>

                {/* Subtext - promo code */}
                <div className="text-xs sm:text-sm text-white/80">
                  Code : <span className="font-bold text-white">BFGAMING40</span>
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* CTA Button */}
              <a
                href="/premium"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white text-purple rounded-lg font-bold text-xs sm:text-sm hover:bg-white/90 transition-colors active:scale-95 whitespace-nowrap"
              >
                J'en profite
              </a>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors active:scale-90"
                aria-label="Dismisser la bannière"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  )
}

export default BlackFridayBanner
