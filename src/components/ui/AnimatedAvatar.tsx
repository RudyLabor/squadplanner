import { motion } from 'framer-motion'
import { memo } from 'react'

export type AvatarStatus = 'online' | 'in-party' | 'in-session' | 'in-call' | 'busy' | 'dnd' | 'away' | 'offline'
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AnimatedAvatarProps {
  src?: string | null
  alt: string
  size?: AvatarSize
  status?: AvatarStatus
  showRing?: boolean
  className?: string
  layoutId?: string
}

const sizeConfig: Record<AvatarSize, { container: number; ring: number; strokeWidth: number; dotSize: string }> = {
  sm: { container: 32, ring: 36, strokeWidth: 2, dotSize: 'w-2 h-2' },
  md: { container: 40, ring: 44, strokeWidth: 2.5, dotSize: 'w-2.5 h-2.5' },
  lg: { container: 48, ring: 52, strokeWidth: 3, dotSize: 'w-3 h-3' },
  xl: { container: 64, ring: 70, strokeWidth: 3, dotSize: 'w-3.5 h-3.5' },
}

const statusColors: Record<AvatarStatus, string> = {
  online: 'var(--color-success)',
  'in-party': 'var(--color-purple)',
  'in-session': 'var(--color-info)',
  'in-call': 'var(--color-success)',
  busy: 'var(--color-warning)',
  dnd: 'var(--color-error)',
  away: 'var(--color-warning)',
  offline: 'var(--color-text-quaternary)',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const AnimatedAvatar = memo(function AnimatedAvatar({
  src,
  alt,
  size = 'md',
  status = 'offline',
  showRing = true,
  className = '',
  layoutId,
}: AnimatedAvatarProps) {
  const config = sizeConfig[size]
  const color = statusColors[status]
  const isActive = status === 'online' || status === 'in-party' || status === 'in-session' || status === 'in-call'
  const circumference = Math.PI * (config.ring - config.strokeWidth)

  return (
    <motion.div
      {...(layoutId ? { layoutId, layout: 'position' as const } : {})}
      className={`relative inline-flex items-center justify-center shrink-0 group ${className}`}
      style={{ width: config.ring, height: config.ring }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Animated ring */}
      {showRing && status !== 'offline' && (
        <svg
          className="absolute inset-0"
          width={config.ring}
          height={config.ring}
          viewBox={`0 0 ${config.ring} ${config.ring}`}
          fill="none"
          aria-hidden="true"
        >
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={(config.ring - config.strokeWidth) / 2}
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference, opacity: 0 }}
            animate={
              isActive
                ? {
                    strokeDashoffset: 0,
                    opacity: [0.6, 1, 0.6],
                  }
                : {
                    strokeDashoffset: 0,
                    opacity: 0.5,
                  }
            }
            transition={
              isActive
                ? {
                    strokeDashoffset: { duration: 1, ease: 'easeOut' },
                    opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                  }
                : {
                    strokeDashoffset: { duration: 0.8, ease: 'easeOut' },
                  }
            }
          />
        </svg>
      )}

      {/* Avatar image or initials */}
      <div
        className="rounded-full overflow-hidden bg-bg-surface flex items-center justify-center ring-0 group-hover:shadow-glow-primary-sm transition-shadow duration-200"
        style={{ width: config.container, height: config.container }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-text-secondary font-medium text-xs select-none">
            {getInitials(alt)}
          </span>
        )}
      </div>

      {/* Status dot */}
      {showRing && (
        <span
          className={`absolute bottom-0 right-0 ${config.dotSize} rounded-full border-2 border-bg-base`}
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      <span className="sr-only">{alt} ({status})</span>
    </motion.div>
  )
})
