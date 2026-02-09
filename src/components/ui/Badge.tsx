import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  count?: number
  max?: number
  closable?: boolean
  onClose?: () => void
  children?: ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot,
  count,
  max = 99,
  closable,
  onClose,
  children,
  className = '',
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-bg-active text-text-tertiary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
    danger: 'bg-error/15 text-error',
    info: 'bg-info/15 text-info',
    primary: 'bg-primary/15 text-primary',
  }

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-text-tertiary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    danger: 'bg-error',
    info: 'bg-info',
    primary: 'bg-primary',
  }

  const sizes: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-1.5',
  }

  const displayCount = count !== undefined ? (count > max ? `${max}+` : `${count}`) : null

  const ariaLabel =
    count !== undefined ? `${count} ${count === 1 ? 'notification' : 'notifications'}` : undefined

  return (
    <AnimatePresence>
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`
          inline-flex items-center rounded-lg font-medium
          ${sizes[size]}
          ${variants[variant]}
          ${className}
        `}
        aria-label={ariaLabel}
      >
        {dot && (
          <span
            className={`shrink-0 w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
            aria-hidden="true"
          />
        )}
        {displayCount !== null ? displayCount : children}
        {closable && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mr-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.span>
    </AnimatePresence>
  )
}
