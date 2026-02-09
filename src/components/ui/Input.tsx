import { forwardRef, useState, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  showPasswordToggle?: boolean
  size?: 'sm' | 'md' | 'lg'
  clearable?: boolean
  onClear?: () => void
  prefix?: ReactNode
  suffix?: ReactNode
  charCount?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      showPasswordToggle,
      size = 'md',
      clearable,
      onClear,
      prefix,
      suffix,
      charCount,
      className = '',
      id: providedId,
      type,
      value,
      maxLength,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = providedId || generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const [showPassword, setShowPassword] = useState(false)

    const isPasswordField = type === 'password'
    const inputType = isPasswordField && showPasswordToggle && showPassword ? 'text' : type

    const sizeClasses: Record<string, string> = {
      sm: 'h-9 text-sm',
      md: 'h-11 text-sm',
      lg: 'h-13 text-base',
    }

    const hasRightElement = (isPasswordField && showPasswordToggle) || clearable || suffix
    const hasLeftElement = icon || prefix

    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ].filter(Boolean).join(' ') || undefined

    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {hasLeftElement && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-text-quaternary" aria-hidden="true">
              {icon}
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={`
              w-full rounded-xl
              bg-surface-input
              border border-border-default
              hover:bg-bg-hover hover:border-border-hover
              focus:border-primary/60 focus:ring-2 focus:ring-primary/10 focus:outline-none
              focus:shadow-glow-primary-sm
              text-text-primary placeholder-text-quaternary
              transition-input
              ${sizeClasses[size]}
              ${hasLeftElement ? 'pl-12' : 'pl-4'}
              ${hasRightElement ? 'pr-12' : 'pr-4'}
              ${error ? 'border-error/50 focus:border-error focus:ring-error/8 focus:shadow-glow-primary-md' : ''}
              ${className}
            `}
            {...props}
          />
          {hasRightElement && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {clearable && value && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-text-quaternary hover:text-text-tertiary transition-colors"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isPasswordField && showPasswordToggle && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-quaternary hover:text-text-tertiary transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
              {suffix && (
                <span className="text-text-quaternary" aria-hidden="true">
                  {suffix}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            {error && (
              <span id={errorId} className="text-xs text-error" role="alert">
                {error}
              </span>
            )}
            {!error && hint && (
              <span id={hintId} className="text-xs text-text-quaternary">
                {hint}
              </span>
            )}
          </div>
          {charCount && maxLength !== undefined && (
            <span className="text-xs text-text-quaternary ml-auto">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'
