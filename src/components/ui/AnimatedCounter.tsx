import { useRef, useCallback, useState, useEffect } from 'react'

interface AnimatedCounterProps {
  end: number
  prefix?: string
  suffix?: string
  /** Singular form of the suffix (e.g. ' clic' when suffix is ' clics') */
  singularSuffix?: string
  duration?: number
  decimals?: number
  separator?: string
  className?: string
}

/** Easing function: easeOutCubic */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function AnimatedCounter({
  end,
  prefix = '',
  suffix = '',
  singularSuffix,
  duration = 2,
  decimals = 0,
  separator,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)

  // Native IntersectionObserver — more reliable than framer-motion's useInView
  // which could miss triggers during Suspense/lazy mount-unmount cycles
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const format = useCallback(
    (value: number) => {
      const rounded = decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value)
      const display = decimals > 0 ? rounded.toFixed(decimals) : String(rounded)
      const sep = separator || ''
      const activeSuffix = singularSuffix && rounded <= 1 ? singularSuffix : suffix
      return `${prefix}${sep ? display.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : display}${activeSuffix}`
    },
    [prefix, suffix, singularSuffix, decimals, separator]
  )

  useEffect(() => {
    if (!isInView) return

    const durationMs = duration * 1000
    let startTime: number | null = null
    let rafId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOut(progress)

      setDisplayValue(easedProgress * end)

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setDisplayValue(end)
      }
    }

    rafId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafId)
  }, [isInView, end, duration])

  return (
    <span
      ref={ref}
      className={className}
      aria-label={format(end)}
      role="text"
      aria-live="polite"
      aria-atomic="true"
    >
      {format(isInView ? displayValue : 0)}
    </span>
  )
}
