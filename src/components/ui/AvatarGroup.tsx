import { m } from 'framer-motion'

interface AvatarData {
  src?: string
  name: string
  status?: 'online' | 'offline' | 'away' | 'dnd'
}

interface AvatarGroupProps {
  avatars: AvatarData[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  onOverflowClick?: () => void
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
} as const

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4',
} as const

const statusSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
} as const

const statusColors = {
  online: 'bg-success',
  offline: 'bg-text-tertiary',
  away: 'bg-warning',
  dnd: 'bg-error',
} as const

const bgColors = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'] as const

function getInitialBg(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return bgColors[Math.abs(hash) % bgColors.length]
}

function SingleAvatar({
  avatar,
  size,
  index,
}: {
  avatar: AvatarData
  size: 'sm' | 'md' | 'lg'
  index: number
}) {
  const initial = avatar.name.charAt(0).toUpperCase()

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`relative inline-block ${index > 0 ? overlapClasses[size] : ''}`}
      style={{ zIndex: index }}
      title={avatar.name}
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-bg-base overflow-hidden flex items-center justify-center shrink-0`}
      >
        {avatar.src ? (
          <img
            src={avatar.src}
            alt={avatar.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${getInitialBg(avatar.name)} text-white font-semibold`}
          >
            {initial}
          </div>
        )}
      </div>

      {avatar.status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} ${statusColors[avatar.status]} rounded-full border-2 border-bg-base`}
          aria-label={avatar.status}
        />
      )}
    </m.div>
  )
}

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  onOverflowClick,
  className = '',
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div
      className={`flex items-center ${className}`}
      role="group"
      aria-label={`${avatars.length} members`}
    >
      <span className="sr-only">{`${avatars.length} members: ${visible.map((a) => a.name).join(', ')}${overflow > 0 ? ` and ${overflow} more` : ''}`}</span>
      {visible.map((avatar, i) => (
        <SingleAvatar key={`${avatar.name}-${i}`} avatar={avatar} size={size} index={i} />
      ))}

      {overflow > 0 && (
        <m.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: visible.length * 0.05 }}
          onClick={onOverflowClick}
          className={`${sizeClasses[size]} ${overlapClasses[size]} rounded-full border-2 border-bg-base bg-bg-active text-text-secondary font-semibold flex items-center justify-center shrink-0 hover:bg-bg-hover transition-colors`}
          style={{ zIndex: visible.length }}
          title={`${overflow} more`}
          aria-label={`${overflow} more members`}
          type="button"
        >
          +{overflow}
        </m.button>
      )}
    </div>
  )
}
