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
import { m, AnimatePresence } from 'framer-motion'

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
  inline: 'inline-block ml-1.5',
}

export const OnlineIndicator = memo(function OnlineIndicator({
  isOnline,
  size = 'sm',
  position = 'inline',
  pulse = true,
  className = '',
}: OnlineIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      <m.span
        key={isOnline ? 'online' : 'offline'}
        className={`
          ${sizeClasses[size]}
          ${positionClasses[position]}
          rounded-full
          border-2 border-bg-base
          ${isOnline ? 'bg-success shadow-glow-success' : 'bg-text-tertiary'}
          ${className}
        `.trim()}
        role="status"
        aria-label={isOnline ? 'En ligne' : 'Hors ligne'}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{
          scale: isOnline && pulse ? [1, 1.3, 1] : 1,
          opacity: isOnline && pulse ? [1, 0.7, 1] : 1,
        }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={
          isOnline && pulse
            ? {
                scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
                opacity: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
              }
            : { type: 'spring', stiffness: 400, damping: 20 }
        }
      >
        <span className="sr-only">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
      </m.span>
    </AnimatePresence>
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
          className={`${avatarSizeClasses[size]} rounded-full object-cover bg-overlay-faint`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className={`${avatarSizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-medium`}
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
