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
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-[#6366f1] hover:bg-[#818cf8] text-white shadow-md shadow-[#6366f1]/10',
      secondary: 'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] text-[#fafafa]',
      ghost: 'bg-transparent hover:bg-[rgba(255,255,255,0.04)] text-[#a1a1a6] hover:text-[#fafafa]',
      danger: 'bg-[#fb7185]/10 border border-[#fb7185]/15 hover:bg-[#fb7185]/15 text-[#fb7185]',
    }

    const sizes = {
      sm: 'h-9 min-h-[44px] px-4 text-[13px]',
      md: 'h-11 min-h-[44px] px-5 text-[14px]',
      lg: 'h-12 min-h-[44px] px-7 text-[15px]',
    }

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
