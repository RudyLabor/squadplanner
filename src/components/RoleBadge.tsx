import { memo } from 'react'
import { getRoleConfig } from '../lib/roles'
import { Tooltip } from './ui'

const ROLE_DESCRIPTIONS: Record<string, string> = {
  leader: 'Le leader gere la squad : il peut inviter, promouvoir et supprimer des membres.',
  co_leader: 'Le co-leader aide a gerer la squad et peut moderer les membres.',
  moderator: 'Le moderateur peut epingler et supprimer des messages.',
}

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
  const description = ROLE_DESCRIPTIONS[role]

  const sizeClasses = size === 'sm'
    ? 'text-xs px-1.5 py-0.5 gap-0.5'
    : 'text-sm px-2 py-0.5 gap-1'

  const badge = (
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

  if (description) {
    return (
      <Tooltip content={description} position="top" delay={200}>
        {badge}
      </Tooltip>
    )
  }

  return badge
})

export default RoleBadge
