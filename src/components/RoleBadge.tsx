import { memo } from 'react'
import { getRoleConfig } from '../lib/roles'

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md'
  showIcon?: boolean
}

/**
 * RoleBadge — Phase 3.3
 * Displays a member's role with color coding.
 * Only shows for non-member roles (leader, co_leader, moderator).
 */
export const RoleBadge = memo(function RoleBadge({ role, size = 'sm', showIcon = true }: RoleBadgeProps) {
  if (role === 'member') return null

  const config = getRoleConfig(role)

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
    : 'text-[11px] px-2 py-0.5 gap-1'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${sizeClasses}`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {showIcon && config.icon && <span>{config.icon}</span>}
      <span>{config.shortLabel}</span>
    </span>
  )
})

export default RoleBadge
