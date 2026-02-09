import CountUp from 'react-countup'
import { useInView } from 'framer-motion'
import { useRef, useCallback } from 'react'

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
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  // Handle singular/plural and clean intermediate values
  const formattingFn = useCallback((value: number) => {
    const rounded = decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value)
    const display = decimals > 0 ? rounded.toFixed(decimals) : String(rounded)
    const sep = separator || ''
    const activeSuffix = singularSuffix && rounded <= 1 ? singularSuffix : suffix
    return `${prefix}${sep ? display.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : display}${activeSuffix}`
  }, [prefix, suffix, singularSuffix, decimals, separator])

  return (
    <span ref={ref} className={className}>
      {isInView ? (
        <CountUp
          end={end}
          duration={duration}
          decimals={decimals}
          formattingFn={formattingFn}
          useEasing
        />
      ) : (
        <span>{formattingFn(0)}</span>
      )}
    </span>
  )
}
