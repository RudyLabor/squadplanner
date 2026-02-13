
import { useRef, useCallback, useEffect, useState } from 'react'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  formatValue?: (value: number) => string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const trackSizes = {
  sm: 'h-1',
  md: 'h-1.5',
} as const

const thumbSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
} as const

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

function snapToStep(val: number, min: number, step: number): number {
  return Math.round((val - min) / step) * step + min
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = false,
  formatValue,
  disabled = false,
  size = 'md',
  className = '',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0
  const displayValue = formatValue ? formatValue(value) : String(value)

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value
      const rect = trackRef.current.getBoundingClientRect()
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
      const rawValue = min + ratio * (max - min)
      return clamp(snapToStep(rawValue, min, step), min, max)
    },
    [min, max, step, value]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      setIsDragging(true)
      const newValue = getValueFromPosition(e.clientX)
      if (newValue !== value) onChange(newValue)
    },
    [disabled, getValueFromPosition, onChange, value]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || disabled) return
      const newValue = getValueFromPosition(e.clientX)
      if (newValue !== value) onChange(newValue)
    },
    [isDragging, disabled, getValueFromPosition, onChange, value]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return
      let newValue = value
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          newValue = clamp(value + step, min, max)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          newValue = clamp(value - step, min, max)
          break
        case 'Home':
          newValue = min
          break
        case 'End':
          newValue = max
          break
        default:
          return
      }
      e.preventDefault()
      if (newValue !== value) onChange(newValue)
    },
    [disabled, value, step, min, max, onChange]
  )

  // Prevent text selection while dragging
  useEffect(() => {
    if (!isDragging) return
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('selectstart', prevent)
    return () => document.removeEventListener('selectstart', prevent)
  }, [isDragging])

  return (
    <div className={`w-full ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
          {showValue && <span className="text-sm text-text-secondary">{displayValue}</span>}
        </div>
      )}

      <div
        ref={trackRef}
        className={`relative w-full ${trackSizes[size]} rounded-full bg-border-default ${!disabled ? 'cursor-pointer' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Filled track */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-primary`}
          style={{ width: `${percent}%` }}
        />

        {/* Thumb */}
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={label}
          aria-disabled={disabled || undefined}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => !isDragging && setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${thumbSizes[size]} rounded-full bg-white border-2 border-primary shadow-sm transition-shadow ${!disabled ? 'hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none' : ''} ${isDragging ? 'scale-110 shadow-md' : ''}`}
          style={{ left: `${percent}%` }}
        >
          {/* Tooltip */}
          {(showTooltip || isDragging) && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-text-primary bg-surface-card border border-border-default rounded-lg shadow-dropdown whitespace-nowrap pointer-events-none">
              {displayValue}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
