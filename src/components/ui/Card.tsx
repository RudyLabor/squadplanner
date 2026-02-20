import { type ReactNode, type KeyboardEvent } from 'react'
import { colorMix, colorMixBlend } from '../../utils/colorMix'

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'gradient'
  padding?: 'default' | 'compact' | 'none'
  loading?: boolean
  selected?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
  id?: string
  hoverable?: boolean
  onClick?: () => void
  'aria-label'?: string
}

export function Card({
  variant = 'default',
  padding: _padding = 'default',
  loading,
  selected,
  disabled,
  children,
  className = '',
  id,
  hoverable = false,
  onClick,
  'aria-label': ariaLabel,
}: CardProps) {
  const paddingClasses: Record<string, string> = {
    default: 'p-6',
    compact: 'p-4',
    none: '',
  }

  const variants: Record<string, string> = {
    default: 'bg-surface-card border border-border-subtle',
    elevated: 'bg-surface-card border border-border-subtle shadow-lg shadow-black/5 transition-shadow hover:shadow-xl hover:shadow-black/10',
    outlined: 'bg-surface-card border-2 border-border-default',
    ghost: 'bg-transparent border-none',
    gradient: 'card-gradient-border',
  }

  const hoverClasses =
    hoverable && !disabled
      ? 'hover:bg-surface-card-hover hover:border-border-hover hover:shadow-sm hover:-translate-y-px active:scale-[0.995] cursor-pointer'
      : ''

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  const isClickable = !!onClick && !disabled

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      id={id}
      className={`
        relative rounded-2xl transition-interactive
        ${variants[variant]}
        ${paddingClasses[_padding]}
        ${hoverClasses}
        ${disabledClasses}
        ${className}
      `}
      style={{
        borderColor: selected ? 'var(--color-primary)' : undefined,
        boxShadow: selected
          ? `0 0 0 1px ${colorMix('var(--color-primary)', 20, 'var(--color-primary-20)')}`
          : undefined,
        backgroundColor: selected
          ? colorMixBlend('var(--color-primary)', 5, 'var(--color-surface-card)', 'var(--color-surface-card)')
          : undefined,
      }}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      aria-disabled={disabled || undefined}
      aria-selected={selected || undefined}
    >
      {loading && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-surface-card/80 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {loading ? <div className="relative opacity-40">{children}</div> : children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`px-5 py-4 border-b border-border-subtle ${className}`}>{children}</div>
}

interface CardContentProps {
  children: ReactNode
  className?: string
  compact?: boolean
}

export function CardContent({ children, className = '', compact }: CardContentProps) {
  return <div className={`${compact ? 'p-3' : 'p-5'} ${className}`}>{children}</div>
}
