import { useState, useCallback, memo } from 'react'

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  width?: number
  height?: number
  fallback?: React.ReactNode
  priority?: boolean
}

/**
 * Optimized Image component with:
 * - Native lazy loading
 * - Fade-in animation on load
 * - Fallback support
 * - Error handling
 * - Prevents layout shift with explicit dimensions
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallback,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  // If no src or error occurred, show fallback
  if (!src || hasError) {
    return <>{fallback}</> || null
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{
        // Prevent layout shift
        ...(width && height ? { aspectRatio: `${width}/${height}` } : {}),
      }}
    />
  )
})

/**
 * Avatar component with optimized loading and fallback
 */
interface AvatarProps {
  src: string | null | undefined
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: React.ReactNode
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
} as const

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
} as const

export const Avatar = memo(function Avatar({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackIcon,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  const sizeClass = sizeClasses[size]
  const dimension = sizePx[size]

  if (!src || hasError) {
    return (
      <div className={`${sizeClass} rounded-full bg-[rgba(167,139,250,0.08)] flex items-center justify-center flex-shrink-0 ${className}`}>
        {fallbackIcon || (
          <span className="text-[#a78bfa] font-medium">
            {alt?.charAt(0)?.toUpperCase() || '?'}
          </span>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
    />
  )
})

export default OptimizedImage
