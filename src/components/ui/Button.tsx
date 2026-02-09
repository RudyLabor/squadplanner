import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
  loadingText?: string
  fullWidth?: boolean
  iconOnly?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      isLoading,
      loadingText,
      fullWidth,
      iconOnly,
      leftIcon,
      rightIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-interactive disabled:opacity-40 disabled:cursor-not-allowed'

    const variants: Record<string, string> = {
      primary: 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10',
      secondary:
        'bg-surface-card border border-border-default hover:bg-surface-card-hover hover:border-border-hover text-text-primary',
      ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary',
      danger: 'bg-error/10 border border-error/15 hover:bg-error/15 text-error',
      link: 'bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto',
    }

    const sizes: Record<string, string> = {
      xs: 'h-7 px-2.5 text-xs',
      sm: 'h-9 px-3.5 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-7 text-base',
    }

    const iconOnlySizes: Record<string, string> = {
      xs: 'h-7 w-7 p-0 text-xs',
      sm: 'h-9 w-9 p-0 text-sm',
      md: 'h-11 w-11 p-0 text-sm',
      lg: 'h-12 w-12 p-0 text-base',
    }

    const sizeClasses = variant === 'link' ? '' : iconOnly ? iconOnlySizes[size] : sizes[size]
    const widthClass = fullWidth ? 'w-full' : ''

    return (
      <motion.button
        ref={ref}
        type={(props as any).type || 'button'}
        className={`${baseClasses} ${variants[variant]} ${sizeClasses} ${widthClass} ${className}`}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={isLoading || props.disabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
