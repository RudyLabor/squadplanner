/**
 * PromoBanner — Bannière promotionnelle configurable (Black Friday, soldes, etc.)
 * Affiche un countdown + code promo + CTA
 * Dismissable avec localStorage pour ne pas réapparaître.
 */

import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import { X, Zap } from './icons'

interface PromoBannerProps {
  /** Unique key for localStorage dismissal */
  promoId: string
  /** Headline text */
  headline: string
  /** Promo code to display */
  promoCode?: string
  /** Discount text e.g. "-30%" */
  discount: string
  /** End date ISO string for countdown. If past, banner won't show. */
  endDate: string
  /** CTA link */
  ctaLink?: string
  /** CTA text */
  ctaText?: string
  /** Background gradient classes */
  gradientClasses?: string
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = new Date(endDate).getTime() - Date.now()
    return diff > 0 ? diff : 0
  })

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      const diff = new Date(endDate).getTime() - Date.now()
      setTimeLeft(diff > 0 ? diff : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [endDate, timeLeft])

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, isExpired: timeLeft <= 0 }
}

export function PromoBanner({
  promoId,
  headline,
  promoCode,
  discount,
  endDate,
  ctaLink = '/premium',
  ctaText = 'En profiter',
  gradientClasses = 'bg-gradient-to-r from-purple via-primary to-secondary',
}: PromoBannerProps) {
  const storageKey = `sp_promo_dismissed_${promoId}`
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true'
    } catch {
      return false
    }
  })

  const { days, hours, minutes, seconds, isExpired } = useCountdown(endDate)

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {}
  }, [storageKey])

  if (dismissed || isExpired) return null

  return (
    <AnimatePresence>
      <m.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className={`relative px-4 py-3 ${gradientClasses} text-white`}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Left: headline + discount */}
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold">
                {headline}
                <span className="ml-1.5 px-2 py-0.5 rounded-md bg-white/20 text-xs font-bold">
                  {discount}
                </span>
              </span>
            </div>

            {/* Center: countdown */}
            <div className="flex items-center gap-1 text-xs font-mono tabular-nums">
              {days > 0 && (
                <>
                  <CountdownUnit value={days} label="j" />
                  <span className="opacity-60">:</span>
                </>
              )}
              <CountdownUnit value={hours} label="h" />
              <span className="opacity-60">:</span>
              <CountdownUnit value={minutes} label="m" />
              <span className="opacity-60">:</span>
              <CountdownUnit value={seconds} label="s" />
            </div>

            {/* Right: promo code + CTA */}
            <div className="flex items-center gap-2">
              {promoCode && (
                <span className="px-2 py-1 rounded-md bg-white/15 text-xs font-mono font-bold border border-white/20">
                  {promoCode}
                </span>
              )}
              <Link
                to={ctaLink}
                className="px-3 py-1.5 rounded-lg bg-white text-primary text-xs font-bold hover:bg-white/90 transition-colors"
              >
                {ctaText}
              </Link>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-1 right-1 sm:relative sm:top-auto sm:right-auto p-1 rounded-md hover:bg-white/20 transition-colors"
              aria-label="Fermer la bannière"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10">
      {String(value).padStart(2, '0')}
      <span className="text-[10px] opacity-60">{label}</span>
    </span>
  )
}
