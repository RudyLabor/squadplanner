import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, isLoading, className = '', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20',
      secondary: 'bg-[rgba(255,255,255,0.03)] border border-border-default hover:bg-[rgba(255,255,255,0.06)] hover:border-border-hover text-text-primary',
      ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary',
      danger: 'bg-error/10 border border-error/20 hover:bg-error/20 text-error',
    }

    const sizes = {
      sm: 'h-9 min-h-[44px] px-3 text-[13px]',
      md: 'h-11 min-h-[44px] px-5 text-[14px]',
      lg: 'h-12 min-h-[44px] px-7 text-[15px]',
    }

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
