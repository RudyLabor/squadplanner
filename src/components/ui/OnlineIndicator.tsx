/**
 * PHASE 5.4 - Online Status Indicator Component
 *
 * Visual indicator showing user's online status.
 * Green dot = online, gray dot = offline
 *
 * Usage:
 * <OnlineIndicator isOnline={true} />
 * <OnlineIndicator isOnline={false} size="lg" />
 */
import { memo } from 'react'

interface OnlineIndicatorProps {
  /** Whether the user is currently online */
  isOnline: boolean
  /** Size of the indicator dot */
  size?: 'sm' | 'md' | 'lg'
  /** Position relative to parent (for avatar overlays) */
  position?: 'bottom-right' | 'top-right' | 'inline'
  /** Show pulse animation when online */
  pulse?: boolean
  /** Additional CSS classes */
  className?: string
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
}

const positionClasses = {
  'bottom-right': 'absolute bottom-0 right-0 translate-x-0.5 translate-y-0.5',
  'top-right': 'absolute top-0 right-0 translate-x-0.5 -translate-y-0.5',
  'inline': 'inline-block ml-1.5',
}

export const OnlineIndicator = memo(function OnlineIndicator({
  isOnline,
  size = 'sm',
  position = 'inline',
  pulse = true,
  className = '',
}: OnlineIndicatorProps) {
  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${positionClasses[position]}
        rounded-full
        border-2 border-[#08090a]
        ${isOnline
          ? 'bg-emerald-500 shadow-glow-success'
          : 'bg-zinc-600'
        }
        ${isOnline && pulse ? 'animate-pulse' : ''}
        ${className}
      `.trim()}
      role="status"
      aria-label={isOnline ? 'En ligne' : 'Hors ligne'}
    />
  )
})

/**
 * Avatar wrapper with online indicator
 */
interface AvatarWithStatusProps {
  src?: string | null
  alt: string
  isOnline: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarSizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const indicatorSizeForAvatar = {
  sm: 'sm' as const,
  md: 'sm' as const,
  lg: 'md' as const,
  xl: 'lg' as const,
}

export const AvatarWithStatus = memo(function AvatarWithStatus({
  src,
  alt,
  isOnline,
  size = 'md',
  className = '',
}: AvatarWithStatusProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${avatarSizeClasses[size]} rounded-full object-cover bg-white/5`}
        />
      ) : (
        <div
          className={`${avatarSizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium`}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
      <OnlineIndicator
        isOnline={isOnline}
        size={indicatorSizeForAvatar[size]}
        position="bottom-right"
        pulse={false}
      />
    </div>
  )
})

export default OnlineIndicator
