import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const inputId = providedId || generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[#c9cace]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e6063]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-11 rounded-xl
              bg-[rgba(255,255,255,0.04)] 
              border border-[rgba(255,255,255,0.08)]
              hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]
              focus:border-[rgba(94,109,210,0.5)] focus:ring-2 focus:ring-[rgba(94,109,210,0.15)] focus:outline-none
              text-[#f7f8f8] placeholder-[#5e6063]
              transition-all
              ${icon ? 'pl-12 pr-4' : 'px-4'}
              ${error ? 'border-[rgba(248,113,113,0.5)] focus:border-[#f87171] focus:ring-[rgba(248,113,113,0.15)]' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[12px] text-[#f87171]">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
