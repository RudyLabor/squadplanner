interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'subtle' | 'default' | 'strong'
  label?: string
  className?: string
}

const variantClasses = {
  subtle: 'border-border-subtle',
  default: 'border-border-default',
  strong: 'border-border-hover',
} as const

export function Divider({
  orientation = 'horizontal',
  variant = 'default',
  label,
  className = '',
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`self-stretch w-px border-l ${variantClasses[variant]} ${className}`}
      />
    )
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={`flex items-center gap-3 w-full ${className}`}
      >
        <div className={`flex-1 border-t ${variantClasses[variant]}`} />
        <span className="text-xs text-text-tertiary uppercase tracking-wider shrink-0">
          {label}
        </span>
        <div className={`flex-1 border-t ${variantClasses[variant]}`} />
      </div>
    )
  }

  return (
    <hr
      role="separator"
      aria-orientation="horizontal"
      className={`border-t ${variantClasses[variant]} w-full ${className}`}
    />
  )
}
