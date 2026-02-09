import { motion } from 'framer-motion'
import { useId, useCallback, type KeyboardEvent } from 'react'

interface CheckboxProps {
  checked: boolean | 'indeterminate'
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { box: 'w-4 h-4', icon: 12, stroke: 1.5 },
  md: { box: 'w-5 h-5', icon: 14, stroke: 2 },
  lg: { box: 'w-6 h-6', icon: 16, stroke: 2 },
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: CheckboxProps) {
  const id = useId()
  const descId = `${id}-desc`
  const config = sizeConfig[size]
  const isChecked = checked === true
  const isIndeterminate = checked === 'indeterminate'
  const isActive = isChecked || isIndeterminate

  const handleClick = useCallback(() => {
    if (!disabled) onChange(!isChecked)
  }, [disabled, onChange, isChecked])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ') {
        e.preventDefault()
        if (!disabled) onChange(!isChecked)
      }
    },
    [disabled, onChange, isChecked]
  )

  const ariaChecked = isIndeterminate ? 'mixed' as const : isChecked

  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={ariaChecked}
        aria-describedby={description ? descId : undefined}
        aria-label={label || undefined}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex items-center justify-center flex-shrink-0 rounded-md
          border-2 transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2
          ${config.box}
          ${isActive ? 'bg-primary border-primary' : 'bg-transparent border-border-default hover:border-border-hover'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Check mark */}
        {isChecked && (
          <motion.svg
            width={config.icon}
            height={config.icon}
            viewBox="0 0 16 16"
            fill="none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <motion.path
              d="M3.5 8.5L6.5 11.5L12.5 5"
              stroke="white"
              strokeWidth={config.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            />
          </motion.svg>
        )}

        {/* Indeterminate mark */}
        {isIndeterminate && (
          <motion.svg
            width={config.icon}
            height={config.icon}
            viewBox="0 0 16 16"
            fill="none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <motion.path
              d="M4 8H12"
              stroke="white"
              strokeWidth={config.stroke}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.15 }}
            />
          </motion.svg>
        )}
      </button>
      {(label || description) && (
        <div className="flex flex-col gap-0.5 pt-px">
          {label && (
            <label
              htmlFor={id}
              className={`text-sm font-medium text-text-primary ${
                disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <span id={descId} className="text-xs text-text-tertiary">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
