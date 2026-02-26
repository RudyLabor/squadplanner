import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import { Eye, EyeOff, X } from '../icons'
type BaseInputProps = {
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

type InputFieldProps = BaseInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { multiline?: false; rows?: never }
type TextareaFieldProps = BaseInputProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & { multiline: true }

type InputProps = InputFieldProps | TextareaFieldProps

const sharedClasses = `w-full rounded-xl bg-surface-input border border-border-default
  hover:bg-bg-hover hover:border-border-hover
  focus:border-primary/60 focus:ring-2 focus:ring-primary/10 focus:outline-none
  focus:shadow-[0_0_0_3px_rgba(92,96,239,0.08),0_0_16px_rgba(92,96,239,0.1)] text-text-primary placeholder-text-quaternary transition-input`

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
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
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const providedId = props.id
    const inputId = providedId || generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const [showPassword, setShowPassword] = useState(false)
    const [shaking, setShaking] = useState(false)
    const prevErrorRef = useRef<string | undefined>(undefined)

    useEffect(() => {
      if (error && !prevErrorRef.current) {
        setShaking(true)
        const timer = setTimeout(() => setShaking(false), 400)
        return () => clearTimeout(timer)
      }
      prevErrorRef.current = error
    }, [error])

    const isMultiline = 'multiline' in props && props.multiline === true
    const type = !isMultiline ? (props as InputFieldProps).type : undefined
    const value = props.value
    const maxLength = props.maxLength

    const isPasswordField = type === 'password'
    const inputType = isPasswordField && showPasswordToggle && showPassword ? 'text' : type

    const sizeClasses: Record<string, string> = {
      sm: 'h-9 text-sm',
      md: 'h-11 text-sm',
      lg: 'h-13 text-base',
    }

    const textareaSizeClasses: Record<string, string> = {
      sm: 'text-sm py-2',
      md: 'text-sm py-3',
      lg: 'text-base py-3.5',
    }

    const hasRightElement = (isPasswordField && showPasswordToggle) || clearable || suffix
    const hasLeftElement = icon || prefix

    const describedBy =
      [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

    const currentLength = typeof value === 'string' ? value.length : 0

    const errorClasses = error
      ? 'border-error/50 focus:border-error focus:ring-error/8 focus:shadow-glow-primary-md'
      : ''
    const paddingClasses = `${hasLeftElement ? 'pl-12' : 'pl-4'} ${hasRightElement ? 'pr-12' : 'pr-4'}`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className={`relative ${shaking ? 'animate-shake' : ''}`}>
          {hasLeftElement && (
            <div
              className={`absolute left-4 ${isMultiline ? 'top-3' : 'top-1/2 -translate-y-1/2'} flex items-center gap-1.5 text-text-quaternary`}
              aria-hidden="true"
            >
              {icon}
              {prefix}
            </div>
          )}
          {isMultiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              value={value}
              maxLength={maxLength}
              rows={(props as TextareaFieldProps).rows || 3}
              aria-invalid={error ? 'true' : undefined}
              aria-required={(props as any).required ? 'true' : undefined}
              aria-describedby={describedBy}
              className={`${sharedClasses} resize-y min-h-[80px] ${textareaSizeClasses[size]} ${paddingClasses} ${errorClasses} ${className}`}
              {...(() => {
                const { multiline: _, id: _id, ...rest } = props as any
                return rest
              })()}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={inputId}
              type={inputType}
              value={value}
              maxLength={maxLength}
              aria-invalid={error ? 'true' : undefined}
              aria-required={(props as any).required ? 'true' : undefined}
              aria-describedby={describedBy}
              className={`${sharedClasses} ${sizeClasses[size]} ${paddingClasses} ${errorClasses} ${className}`}
              {...(() => {
                const { id: _id, ...rest } = props as any
                return rest
              })()}
            />
          )}
          {hasRightElement && (
            <div
              className={`absolute right-4 z-10 ${isMultiline ? 'top-3' : 'top-1/2 -translate-y-1/2'} flex items-center gap-1.5`}
            >
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
                  className="text-text-quaternary hover:text-text-tertiary transition-colors touch-target flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
