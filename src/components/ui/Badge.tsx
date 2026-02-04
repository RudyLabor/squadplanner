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
    success: 'bg-[rgba(74,222,128,0.15)] text-[#4ade80]',
    warning: 'bg-[rgba(245,166,35,0.15)] text-[#f5a623]',
    error: 'bg-[rgba(248,113,113,0.15)] text-[#f87171]',
    danger: 'bg-[rgba(248,113,113,0.15)] text-[#f87171]',
    info: 'bg-[rgba(96,165,250,0.15)] text-[#60a5fa]',
    primary: 'bg-[rgba(94,109,210,0.15)] text-[#5e6dd2]',
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
