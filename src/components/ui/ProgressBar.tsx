import { m } from 'framer-motion'

interface ProgressBarProps {
  value?: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  animated?: boolean
  stepped?: { steps: number; current: number }
  className?: string
}

const trackSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
} as const

const fillColors = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
} as const

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  label,
  showValue = false,
  animated = false,
  stepped,
  className = '',
}: ProgressBarProps) {
  const isIndeterminate = value === undefined

  // Stepped mode
  if (stepped) {
    return (
      <div className={`w-full ${className}`}>
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
            {showValue && (
              <span className="text-sm text-text-secondary">
                {stepped.current}/{stepped.steps}
              </span>
            )}
          </div>
        )}
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuenow={stepped.current}
          aria-valuemin={0}
          aria-valuemax={stepped.steps}
          aria-label={label}
        >
          {Array.from({ length: stepped.steps }, (_, i) => (
            <m.div
              key={i}
              className={`flex-1 ${trackSizes[size]} rounded-full ${
                i < stepped.current ? fillColors[variant] : 'bg-border-subtle'
              }`}
              initial={animated ? { scaleX: 0 } : undefined}
              animate={animated ? { scaleX: 1 } : undefined}
              transition={animated ? { duration: 0.3, delay: i * 0.08 } : undefined}
              style={animated ? { transformOrigin: 'left' } : undefined}
            />
          ))}
        </div>
      </div>
    )
  }

  const percent = isIndeterminate ? 0 : Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
          {showValue && !isIndeterminate && (
            <span className="text-sm text-text-secondary">{Math.round(percent)}%</span>
          )}
        </div>
      )}

      <div
        className={`relative w-full ${trackSizes[size]} rounded-full bg-border-subtle overflow-hidden`}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        {isIndeterminate ? (
          <div
            className={`absolute inset-y-0 w-1/3 ${fillColors[variant]} rounded-full animate-shimmer`}
            style={{
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        ) : (
          <m.div
            className={`absolute inset-y-0 left-0 rounded-full ${fillColors[variant]} ${animated ? 'animate-pulse-subtle' : ''}`}
            initial={animated ? { width: 0 } : { width: `${percent}%` }}
            animate={{ width: `${percent}%` }}
            transition={animated ? { duration: 0.6, ease: 'easeOut' } : { duration: 0.3 }}
          />
        )}
      </div>

      {/* Shimmer keyframes injected as inline style */}
      {isIndeterminate && (
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
          .animate-shimmer { animation: shimmer 1.5s ease-in-out infinite; }
        `}</style>
      )}
      {animated && (
        <style>{`
          .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}</style>
      )}
    </div>
  )
}
