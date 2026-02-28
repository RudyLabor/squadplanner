import { type ReactNode } from 'react'

// =============================================================================
// BASE SKELETON COMPONENT
// =============================================================================

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

/**
 * Base Skeleton component with shimmer animation
 * Uses CSS gradient animation for smooth left-to-right shimmer effect
 */
export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    background: 'var(--gradient-shimmer)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }

  return (
    <div className={`${roundedClasses[rounded]} ${className}`} style={style} aria-hidden="true" />
  )
}

// =============================================================================
// PRIMITIVE SKELETON COMPONENTS
// =============================================================================

interface SkeletonTextProps {
  lines?: number
  className?: string
  /** Width of each line: 'full', 'lg' (75%), 'md' (50%), 'sm' (25%), or custom string */
  lineWidth?: 'full' | 'lg' | 'md' | 'sm' | string
  /** Last line width (often shorter) */
  lastLineWidth?: 'full' | 'lg' | 'md' | 'sm' | string
  /** Gap between lines */
  gap?: 'sm' | 'md' | 'lg'
}

/**
 * Multi-line text skeleton
 */
export function SkeletonText({
  lines = 3,
  className = '',
  lineWidth = 'full',
  lastLineWidth = 'lg',
  gap = 'md',
}: SkeletonTextProps) {
  const widthMap = {
    full: 'w-full',
    lg: 'w-3/4',
    md: 'w-1/2',
    sm: 'w-1/4',
  }

  const gapMap = {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-3',
  }

  const getWidth = (width: string) => widthMap[width as keyof typeof widthMap] || width

  return (
    <div className={`${gapMap[gap]} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? getWidth(lastLineWidth) : getWidth(lineWidth)}`}
          rounded="sm"
        />
      ))}
    </div>
  )
}

interface SkeletonAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Circular avatar skeleton
 */
export function SkeletonAvatar({ size = 'md', className = '' }: SkeletonAvatarProps) {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return <Skeleton className={`${sizeMap[size]} ${className}`} rounded="full" />
}

interface SkeletonButtonProps {
  size?: 'sm' | 'md' | 'lg'
  width?: 'auto' | 'full' | string
  className?: string
}

/**
 * Button-shaped skeleton
 */
export function SkeletonButton({
  size = 'md',
  width = 'auto',
  className = '',
}: SkeletonButtonProps) {
  const sizeMap = {
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-12',
  }

  const widthClass = width === 'full' ? 'w-full' : width === 'auto' ? 'w-24' : width

  return <Skeleton className={`${sizeMap[size]} ${widthClass} ${className}`} rounded="lg" />
}

interface SkeletonCardProps {
  className?: string
  children?: ReactNode
}

/**
 * Card-shaped skeleton container
 */
export function SkeletonCard({ className = '', children }: SkeletonCardProps) {
  return (
    <div
      className={`p-4 rounded-xl bg-bg-elevated border border-border-subtle ${className}`}
      aria-hidden="true"
    >
      {children || (
        <>
          <div className="flex items-center gap-3 mb-4">
            <SkeletonAvatar size="md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" rounded="sm" />
              <Skeleton className="h-3 w-24" rounded="sm" />
            </div>
          </div>
          <SkeletonText lines={2} gap="sm" />
        </>
      )}
    </div>
  )
}

// =============================================================================
// UTILITY WRAPPER
// =============================================================================

interface SkeletonWrapperProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
}

/**
 * Wrapper component that shows skeleton while loading
 */
export function SkeletonWrapper({ isLoading, skeleton, children }: SkeletonWrapperProps) {
  if (isLoading) {
    return <>{skeleton}</>
  }
  return <>{children}</>
}

export default Skeleton
