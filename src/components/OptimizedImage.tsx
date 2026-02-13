
import { useState, useCallback, memo, useRef, useEffect } from 'react'
import { getPlaceholderUrl, getOptimizedSrc } from './imageUtils'

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  width?: number
  height?: number
  fallback?: React.ReactNode
  priority?: boolean
  webpSrc?: string
  avifSrc?: string
  showPlaceholder?: boolean
  placeholder?: 'skeleton' | 'blur' | (string & {})
  srcSet?: string
  sizes?: string
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallback,
  priority = false,
  webpSrc,
  avifSrc,
  showPlaceholder = true,
  placeholder = 'skeleton',
  srcSet,
  sizes,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [priority])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (!src || hasError) {
    return <>{fallback}</> || null
  }

  const optimizedSrc = isInView ? getOptimizedSrc(src, width, webpSrc, avifSrc) : undefined

  const blurSrc =
    placeholder === 'blur'
      ? getPlaceholderUrl(src)
      : placeholder !== 'skeleton'
        ? placeholder
        : undefined

  return (
    <div
      ref={imgRef}
      className="relative overflow-hidden"
      style={{
        ...(width && height ? { aspectRatio: `${width}/${height}` } : {}),
      }}
    >
      {showPlaceholder && !isLoaded && !blurSrc && (
        <div
          className="absolute inset-0 bg-overlay-faint animate-pulse rounded-inherit"
          aria-hidden="true"
        />
      )}

      {showPlaceholder && !isLoaded && blurSrc && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          srcSet={srcSet}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
})

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
  const [isLoaded, setIsLoaded] = useState(false)

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const sizeClass = sizeClasses[size]
  const dimension = sizePx[size]

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-purple-10 flex items-center justify-center flex-shrink-0 ${className}`}
      >
        {fallbackIcon || (
          <span className="text-purple font-medium">{alt?.charAt(0)?.toUpperCase() || '?'}</span>
        )}
      </div>
    )
  }

  const placeholderSrc = getPlaceholderUrl(src, 10)

  return (
    <div
      className={`${sizeClass} rounded-full flex-shrink-0 relative overflow-hidden ${className}`}
    >
      {placeholderSrc && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover rounded-full"
          style={{ filter: 'blur(10px)', transform: 'scale(1.1)' }}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={dimension}
        height={dimension}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full rounded-full object-cover transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
})

export default OptimizedImage
