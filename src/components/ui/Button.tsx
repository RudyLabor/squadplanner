import { m, AnimatePresence, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode, type ElementType, type ComponentPropsWithRef } from 'react'
import { haptic } from '../../utils/haptics'

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
  loadingText?: string
  fullWidth?: boolean
  iconOnly?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  showSuccess?: boolean
}

// Polymorphic: when as="a", renders <m.a>; when as={Link}, renders a router Link wrapped in motion
type ButtonProps<C extends ElementType = 'button'> = ButtonBaseProps & {
  as?: C
} & Omit<ComponentPropsWithRef<C>, keyof ButtonBaseProps | 'as'>

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-interactive disabled:opacity-40 disabled:cursor-not-allowed'

const variantClasses: Record<string, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10',
  secondary:
    'bg-surface-card border border-border-default hover:bg-surface-card-hover hover:border-border-hover text-text-primary',
  ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary',
  danger: 'bg-error/10 border border-error/15 hover:bg-error/15 text-error',
  link: 'bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto',
}

const sizeClasses: Record<string, string> = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
}

const iconOnlySizeClasses: Record<string, string> = {
  xs: 'h-7 w-7 p-0 text-xs',
  sm: 'h-9 w-9 p-0 text-sm',
  md: 'h-11 w-11 p-0 text-sm',
  lg: 'h-12 w-12 p-0 text-base',
}

function ButtonInner<C extends ElementType = 'button'>(
  {
    as,
    variant = 'primary',
    size = 'md',
    children,
    isLoading,
    loadingText,
    fullWidth,
    iconOnly,
    leftIcon,
    rightIcon,
    showSuccess,
    className = '',
    ...props
  }: ButtonProps<C>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const sc = variant === 'link' ? '' : iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size]
  const wc = fullWidth ? 'w-full' : ''
  const cls = `${baseClasses} ${variantClasses[variant]} ${sc} ${wc} ${className}`

  const shouldHaptic = variant === 'primary' || variant === 'danger'
  const originalOnClick = (props as Record<string, unknown>).onClick as ((...args: unknown[]) => void) | undefined
  const handleClick = shouldHaptic
    ? (...args: unknown[]) => { try { haptic.light() } catch {} originalOnClick?.(...args) }
    : originalOnClick

  const content = (
    <AnimatePresence mode="wait">
      {showSuccess ? (
        <m.span
          key="success"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="text-success text-base"
          aria-label="Success"
        >
          &#10003;
        </m.span>
      ) : isLoading ? (
        <m.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          {loadingText && <span>{loadingText}</span>}
        </m.span>
      ) : (
        <m.span key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
          {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
        </m.span>
      )}
    </AnimatePresence>
  )

  // For non-button elements (a, Link), render motion.div wrapping the element
  if (as && as !== 'button') {
    const Component = as as ElementType
    return (
      <m.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="inline-flex"
      >
        <Component ref={ref} className={cls} aria-busy={isLoading || undefined} {...props} onClick={handleClick}>
          {content}
        </Component>
      </m.div>
    )
  }

  return (
    <m.button
      ref={ref}
      type={(props as HTMLMotionProps<'button'>).type || 'button'}
      className={cls}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading || undefined}
      aria-label={isLoading && !loadingText && typeof children === 'string' ? children : undefined}
      {...props}
      onClick={handleClick}
    >
      {content}
    </m.button>
  )
}

export const Button = forwardRef(ButtonInner as any) as <C extends ElementType = 'button'>(
  props: ButtonProps<C> & { ref?: React.Ref<HTMLButtonElement> }
) => React.ReactElement

(Button as any).displayName = 'Button'
