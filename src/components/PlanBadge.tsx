import { Link } from 'react-router'
import { Zap, Crown } from './icons'
import type { SubscriptionTier } from '../types/database'

const TIER_CONFIG: Record<
  SubscriptionTier,
  { label: string; icon: typeof Zap | null; bg: string; border: string; text: string }
> = {
  free: { label: 'Free', icon: null, bg: 'bg-bg-surface', border: 'border-border-subtle', text: 'text-text-tertiary' },
  premium: { label: 'Premium', icon: Zap, bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning' },
  squad_leader: { label: 'Squad Leader', icon: Crown, bg: 'bg-purple/10', border: 'border-purple/20', text: 'text-purple' },
  club: { label: 'Club', icon: Crown, bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary' },
}

interface PlanBadgeProps {
  tier: SubscriptionTier
  size?: 'sm' | 'md'
  className?: string
}

export function PlanBadge({ tier, size = 'sm', className = '' }: PlanBadgeProps) {
  const config = TIER_CONFIG[tier]
  const Icon = config.icon

  if (tier === 'free' && size === 'sm') {
    return (
      <Link
        to="/premium"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15 text-xs text-primary font-medium hover:bg-primary/15 transition-colors ${className}`}
      >
        <Zap className="w-3 h-3" />
        <span>Passer Premium</span>
      </Link>
    )
  }

  if (tier === 'free' && size === 'md') {
    return (
      <Link
        to="/premium"
        className={`flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-primary/8 to-purple/5 border border-primary/15 hover:border-primary/25 transition-colors ${className}`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">Plan Free</div>
          <div className="text-xs text-text-tertiary">Passer Premium pour tout d{'é'}bloquer</div>
        </div>
        <span className="text-xs font-medium text-primary shrink-0">{'→'}</span>
      </Link>
    )
  }

  // Paid tiers
  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} border ${config.border} ${className}`}
      >
        {Icon && <Icon className={`w-3 h-3 ${config.text}`} />}
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
      </div>
    )
  }

  // md — card style with manage link
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-xl ${config.bg} border ${config.border} ${className}`}
    >
      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
        {Icon && <Icon className={`w-4 h-4 ${config.text}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">Plan {config.label}</div>
      </div>
      <span className={`text-xs font-medium ${config.text} shrink-0`}>Abonnement actif</span>
    </div>
  )
}
