import { forwardRef, useState, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, showPasswordToggle, className = '', id: providedId, type, ...props }, ref) => {
    const generatedId = useId()
    const inputId = providedId || generatedId
    const errorId = `${inputId}-error`
    const [showPassword, setShowPassword] = useState(false)

    const isPasswordField = type === 'password'
    const inputType = isPasswordField && showPasswordToggle && showPassword ? 'text' : type

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[#c9cace]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e6063]" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full h-11 rounded-xl
              bg-[rgba(255,255,255,0.04)]
              border border-[rgba(255,255,255,0.08)]
              hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]
              focus:border-[rgba(99,102,241,0.6)] focus:ring-2 focus:ring-[rgba(99,102,241,0.1)] focus:outline-none
              focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]
              text-[#f7f8f8] placeholder-[#5e6063]
              transition-all duration-200
              ${icon ? 'pl-12' : 'pl-4'}
              ${isPasswordField && showPasswordToggle ? 'pr-12' : 'pr-4'}
              ${error ? 'border-[rgba(251,113,133,0.5)] focus:border-[#fb7185] focus:ring-[rgba(251,113,133,0.08)] focus:shadow-[0_0_20px_rgba(251,113,133,0.1)]' : ''}
              ${className}
            `}
            {...props}
          />
          {isPasswordField && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5e6063] hover:text-[#8b8d90] transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <span id={errorId} className="text-[12px] text-[#fb7185]" role="alert">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
