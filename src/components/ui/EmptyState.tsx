import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { Button } from './Button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  variant?: 'full' | 'compact'
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  variant = 'full',
  actionLabel,
  actionTo,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const isCompact = variant === 'compact'

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center text-center ${
        isCompact ? 'py-6 px-3' : 'justify-center py-10 px-4'
      }`}
      aria-live="polite"
    >
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
        className={`rounded-2xl bg-primary/10 flex items-center justify-center text-primary ${
          isCompact ? 'w-10 h-10 mb-3' : 'w-14 h-14 mb-4'
        }`}
      >
        {icon}
      </m.div>
      <p
        className={`font-medium text-text-primary ${
          isCompact ? 'text-sm mb-0.5' : 'text-base mb-1'
        }`}
      >
        {title}
      </p>
      {description && (
        <p
          className={`text-text-tertiary max-w-xs ${
            isCompact ? 'text-xs mb-3' : 'text-sm mb-4'
          }`}
        >
          {description}
        </p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2">
          {actionLabel && actionTo && (
            <Link to={actionTo}>
              <Button type="button" size="sm">
                {actionLabel}
              </Button>
            </Link>
          )}
          {actionLabel && onAction && !actionTo && (
            <Button type="button" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button type="button" size="sm" variant="ghost" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </m.div>
  )
}
