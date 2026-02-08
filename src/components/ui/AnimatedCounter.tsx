import CountUp from 'react-countup'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedCounterProps {
  end: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
  className?: string
}

export function AnimatedCounter({
  end,
  prefix = '',
  suffix = '',
  duration = 2,
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <span ref={ref} className={className}>
      {isInView ? (
        <CountUp
          end={end}
          prefix={prefix}
          suffix={suffix}
          duration={duration}
          decimals={decimals}
          useEasing
        />
      ) : (
        <span>{prefix}0{suffix}</span>
      )}
    </span>
  )
}
