import { m, useInView } from 'framer-motion'
import { useRef } from 'react'

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  showValue?: boolean
  className?: string
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  color = 'var(--color-primary)',
  trackColor = 'var(--color-inactive-bar)',
  label,
  showValue = true,
  className = '',
}: ProgressRingProps) {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.min(100, Math.max(0, value))
  const isFull = clampedValue >= 100
  const offset = isFull ? 0 : circumference - (clampedValue / 100) * circumference

  return (
    <div
      className={`inline-flex flex-col items-center gap-1 ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${clampedValue}%`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap={isFull ? 'butt' : 'round'}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-text-primary font-semibold" style={{ fontSize: size * 0.22 }}>
              {clampedValue}%
            </span>
          </div>
        )}
      </div>
      {label && <span className="text-text-tertiary text-sm font-medium">{label}</span>}
    </div>
  )
}
