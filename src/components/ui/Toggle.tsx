import { m } from 'framer-motion'
import { useId, useCallback, type KeyboardEvent } from 'react'
import { haptic } from '../../utils/haptics'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { track: 'h-5 w-9', thumb: 'w-3.5 h-3.5', translate: 16 },
  md: { track: 'h-6 w-11', thumb: 'w-4 h-4', translate: 20 },
  lg: { track: 'h-7 w-14', thumb: 'w-5 h-5', translate: 28 },
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: ToggleProps) {
  const id = useId()
  const descId = `${id}-desc`
  const config = sizeConfig[size]

  const handleClick = useCallback(() => {
    if (!disabled) {
      try {
        haptic.selection()
      } catch {}
      onChange(!checked)
    }
  }, [disabled, onChange, checked])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ') {
        e.preventDefault()
        if (!disabled) onChange(!checked)
      }
    },
    [disabled, onChange, checked]
  )

  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        aria-label={label || undefined}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex items-center flex-shrink-0 rounded-full
          transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2
          ${config.track}
          ${checked ? 'bg-primary-bg' : 'bg-border-hover'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <m.span
          className={`
            block rounded-full bg-white shadow-sm
            ${config.thumb}
          `}
          layout
          initial={false}
          animate={{ x: checked ? config.translate : 3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          aria-hidden="true"
        />
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
