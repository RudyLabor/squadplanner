import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center mb-4 text-[#6366f1]">
        {icon}
      </div>
      <p className="text-[15px] font-medium text-text-primary mb-1">{title}</p>
      {description && (
        <p className="text-[13px] text-text-tertiary mb-4 max-w-xs">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link to={actionTo}>
          <Button type="button" size="sm">{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button type="button" size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
