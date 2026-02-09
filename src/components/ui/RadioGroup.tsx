import { motion } from 'framer-motion'
import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react'

// --- Context ---

interface RadioGroupContextValue {
  value: string
  onChange: (value: string) => void
  orientation: 'vertical' | 'horizontal'
  name: string
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

function useRadioGroupContext() {
  const ctx = useContext(RadioGroupContext)
  if (!ctx) throw new Error('Radio must be used within <RadioGroup>')
  return ctx
}

// --- RadioGroup ---

interface RadioGroupProps {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  orientation?: 'vertical' | 'horizontal'
}

export function RadioGroup({
  value,
  onChange,
  children,
  orientation = 'vertical',
}: RadioGroupProps) {
  const name = useId()
  const groupRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const group = groupRef.current
      if (!group) return

      const radios = Array.from(
        group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])')
      )
      const currentIndex = radios.findIndex((r) => r === document.activeElement)
      if (currentIndex === -1) return

      const isVertical = orientation === 'vertical'
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'

      let nextIndex = currentIndex
      if (e.key === nextKey) {
        e.preventDefault()
        nextIndex = (currentIndex + 1) % radios.length
      } else if (e.key === prevKey) {
        e.preventDefault()
        nextIndex = (currentIndex - 1 + radios.length) % radios.length
      }

      if (nextIndex !== currentIndex) {
        radios[nextIndex].focus()
        radios[nextIndex].click()
      }
    },
    [orientation]
  )

  return (
    <RadioGroupContext.Provider value={{ value, onChange, orientation, name }}>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={`flex ${
          orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row flex-wrap gap-3'
        }`}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

// --- Radio ---

interface RadioProps {
  value: string
  label: string
  description?: string
  disabled?: boolean
  variant?: 'default' | 'card'
}

export function Radio({
  value,
  label,
  description,
  disabled = false,
  variant = 'default',
}: RadioProps) {
  const { value: groupValue, onChange, name } = useRadioGroupContext()
  const isSelected = groupValue === value
  const radioId = `${name}-radio-${value}`

  const handleClick = useCallback(() => {
    if (!disabled) onChange(value)
  }, [disabled, onChange, value])

  if (variant === 'card') {
    return (
      <button
        id={radioId}
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={disabled}
        onClick={handleClick}
        tabIndex={isSelected ? 0 : -1}
        className={`
          relative flex items-start gap-3 p-4 rounded-xl text-left
          border-2 transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2
          ${
            isSelected
              ? 'border-primary bg-primary/5'
              : 'border-border-subtle bg-surface-card hover:border-border-hover hover:bg-surface-card-hover'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <RadioCircle isSelected={isSelected} />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {description && (
            <span className="text-xs text-text-tertiary">{description}</span>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      id={radioId}
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={handleClick}
      tabIndex={isSelected ? 0 : -1}
      className={`
        flex items-start gap-3 py-1.5 text-left
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-lg
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <RadioCircle isSelected={isSelected} />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {description && (
          <span className="text-xs text-text-tertiary">{description}</span>
        )}
      </div>
    </button>
  )
}

// --- RadioCircle (internal) ---

function RadioCircle({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={`
        relative flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 transition-colors duration-150
        ${isSelected ? 'border-primary' : 'border-border-default'}
      `}
      aria-hidden="true"
    >
      {isSelected && (
        <motion.span
          className="absolute inset-1 rounded-full bg-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </span>
  )
}
