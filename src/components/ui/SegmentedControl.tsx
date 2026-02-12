import { m } from 'framer-motion'
import { type ElementType } from 'react'

interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: ElementType
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  layoutId?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  layoutId = 'segment-indicator',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'h-8 text-sm px-3 gap-1.5',
    md: 'h-10 text-base px-4 gap-2',
  }

  const containerPadding = {
    sm: 'p-0.5',
    md: 'p-1',
  }

  return (
    <div
      className={`inline-flex bg-bg-surface border border-border-subtle rounded-xl ${containerPadding[size]}`}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = value === option.value
        const Icon = option.icon

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`relative inline-flex items-center justify-center rounded-lg font-medium transition-colors ${sizeClasses[size]} ${
              isActive ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {isActive && (
              <m.div
                layoutId={layoutId}
                className="absolute inset-0 bg-bg-active border border-border-default rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
