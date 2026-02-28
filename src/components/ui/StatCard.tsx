import { type ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  value: ReactNode
  label: string
  sub?: string
  className?: string
  /** 'vertical' stacks icon+label above value. 'horizontal' places icon left, value+label right. */
  layout?: 'vertical' | 'horizontal'
}

export function StatCard({
  icon,
  value,
  label,
  sub,
  className = '',
  layout = 'vertical',
}: StatCardProps) {
  if (layout === 'horizontal') {
    return (
      <div className={`p-4 rounded-xl bg-surface-card border border-border-subtle ${className}`}>
        <div className="flex items-center gap-3">
          <div className="shrink-0">{icon}</div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-sm text-text-quaternary">{label}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-xl bg-surface-card border border-border-subtle ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="shrink-0">{icon}</div>
        <span className="text-sm text-text-tertiary">{label}</span>
      </div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-tertiary">{sub}</p>}
    </div>
  )
}
