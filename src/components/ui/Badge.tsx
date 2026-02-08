import { type ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-bg-active text-text-tertiary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
    danger: 'bg-error/15 text-error',
    info: 'bg-info/15 text-info',
    primary: 'bg-primary/15 text-primary',
  }

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-lg
        text-[12px] font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
