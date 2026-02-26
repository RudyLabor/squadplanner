import { m, AnimatePresence } from 'framer-motion'
import { forwardRef, type ReactNode, type ElementType, type ComponentPropsWithRef } from 'react'
import { haptic } from '../../utils/haptics'

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'gradient'
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
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl cursor-pointer transition-interactive disabled:opacity-40 disabled:cursor-not-allowed'

// CSS fallback for non-motion rendered elements (as prop)
const cssMotionClasses = 'hover:-translate-y-px active:scale-[0.97]'

const variantClasses: Record<string, string> = {
  primary:
    'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10 shadow-[0_0_20px_rgba(92,96,239,0.15)] hover:shadow-[0_0_30px_rgba(92,96,239,0.25)]',
  secondary:
    'bg-surface-card border border-border-default hover:bg-surface-card-hover hover:border-border-hover text-text-primary',
  ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary',
  danger: 'bg-error/10 border border-error/15 hover:bg-error/15 text-error',
  link: 'bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto',
  gradient: 'btn-gradient',
}

const sizeClasses: Record<string, string> = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
}

const iconOnlySizeClasses: Record<string, string> = {
  xs: 'h-9 w-9 p-0 text-xs', // WCAG 2.5.5: min 36px (visual), 44px hit area via touch-target
  sm: 'h-11 w-11 p-0 text-sm', // WCAG 2.5.5: 44px touch target
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
  const originalOnClick = (props as Record<string, unknown>).onClick as
    | ((...args: unknown[]) => void)
    | undefined
  const handleClick = shouldHaptic
    ? (...args: unknown[]) => {
        try {
          haptic.light()
        } catch {}
        originalOnClick?.(...args)
      }
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
        <m.span
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-2"
        >
          <div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          {loadingText && <span>{loadingText}</span>}
        </m.span>
      ) : (
        <m.span
          key="content"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-2"
        >
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
        </m.span>
      )}
    </AnimatePresence>
  )

  // For non-button elements (a, Link), render with CSS-only motion fallback
  if (as && as !== 'button') {
    const Component = as as ElementType
    return (
      <Component
        ref={ref}
        className={`${cls} ${cssMotionClasses}`}
        aria-busy={isLoading || undefined}
        {...props}
        onClick={handleClick}
      >
        {content}
      </Component>
    )
  }

  return (
    <m.button
      ref={ref}
      type={(props as any).type || 'button'}
      className={cls}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading || undefined}
      aria-label={isLoading && !loadingText && typeof children === 'string' ? children : undefined}
      whileHover={
        props.disabled
          ? undefined
          : {
              y: -1,
              boxShadow: variant === 'gradient' ? '0 6px 28px rgba(99, 102, 241, 0.4)' : undefined,
            }
      }
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
      onClick={handleClick}
    >
      {content}
    </m.button>
  )
}

export const Button = forwardRef(ButtonInner as any) as unknown as <
  C extends ElementType = 'button',
>(
  props: ButtonProps<C> & { ref?: React.Ref<HTMLButtonElement> }
) => React.ReactElement
;(Button as any).displayName = 'Button'
