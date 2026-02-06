import { type ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-[#1f2023] text-[#8b8d90]',
    success: 'bg-[rgba(52,211,153,0.15)] text-[#34d399]',
    warning: 'bg-[rgba(251,191,36,0.15)] text-[#fbbf24]',
    error: 'bg-[rgba(251,113,133,0.15)] text-[#fb7185]',
    danger: 'bg-[rgba(251,113,133,0.15)] text-[#fb7185]',
    info: 'bg-[rgba(96,165,250,0.15)] text-[#60a5fa]',
    primary: 'bg-[rgba(99,102,241,0.15)] text-[#6366f1]',
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
