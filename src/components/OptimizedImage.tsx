import { useState, useCallback, memo, useRef, useEffect } from 'react'

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  width?: number
  height?: number
  fallback?: React.ReactNode
  priority?: boolean
  /** WebP version URL (auto-detected from src if not provided) */
  webpSrc?: string
  /** AVIF version URL (optional) */
  avifSrc?: string
  /** Show skeleton placeholder while loading */
  showPlaceholder?: boolean
  /** Placeholder type: 'skeleton' (default), 'blur' (tiny blurred thumbnail), or a custom URL */
  placeholder?: 'skeleton' | 'blur' | (string & {})
  /** Responsive image srcSet */
  srcSet?: string
  /** Responsive image sizes hint */
  sizes?: string
}

/**
 * Generate a tiny placeholder URL for Supabase storage images.
 * Returns a 10px wide, low-quality WebP version for blur-up effect.
 */
function getPlaceholderUrl(src: string, width: number = 10): string | undefined {
  if (src.includes('supabase') && src.includes('/storage/')) {
    try {
      const url = new URL(src)
      url.searchParams.set('width', String(width))
      url.searchParams.set('quality', '20')
      url.searchParams.set('format', 'webp')
      return url.toString()
    } catch {
      return undefined
    }
  }
  return undefined
}

// Check format support (cached)
let webpSupported: boolean | null = null
let avifSupported: boolean | null = null

function checkWebPSupport(): boolean {
  if (webpSupported !== null) return webpSupported
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  return webpSupported
}

function checkAVIFSupport(): boolean {
  if (avifSupported !== null) return avifSupported
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  avifSupported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  return avifSupported
}

/**
 * Get optimized image source with WebP/AVIF fallback
 */
function getOptimizedSrc(src: string, webpSrc?: string, avifSrc?: string): string {
  // Explicit sources take priority
  if (avifSrc && checkAVIFSupport()) return avifSrc
  if (webpSrc && checkWebPSupport()) return webpSrc

  // Auto-convert jpg/png URLs to webp/avif if supported
  const isConvertible = /\.(jpe?g|png)$/i.test(src)
  if (!isConvertible) return src

  if (checkAVIFSupport()) return src.replace(/\.(jpe?g|png)$/i, '.avif')
  if (checkWebPSupport()) return src.replace(/\.(jpe?g|png)$/i, '.webp')

  return src
}

/**
 * Optimized Image component with:
 * - Native lazy loading with Intersection Observer
 * - WebP/AVIF format support
 * - Fade-in animation on load
 * - Skeleton placeholder
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

  // Lazy loading with Intersection Observer for better performance
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

  // If no src or error occurred, show fallback
  if (!src || hasError) {
    return <>{fallback}</> || null
  }

  const optimizedSrc = isInView ? getOptimizedSrc(src, webpSrc, avifSrc) : undefined

  // Determine blur placeholder URL
  const blurSrc = placeholder === 'blur'
    ? getPlaceholderUrl(src)
    : placeholder !== 'skeleton'
      ? placeholder // custom URL string
      : undefined

  return (
    <div
      ref={imgRef}
      className="relative overflow-hidden"
      style={{
        ...(width && height ? { aspectRatio: `${width}/${height}` } : {}),
      }}
    >
      {/* Skeleton placeholder (default) */}
      {showPlaceholder && !isLoaded && !blurSrc && (
        <div
          className="absolute inset-0 bg-white/5 animate-pulse rounded-inherit"
          aria-hidden="true"
        />
      )}

      {/* Blur-up placeholder */}
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
      <div className={`${sizeClass} rounded-full bg-purple-10 flex items-center justify-center flex-shrink-0 ${className}`}>
        {fallbackIcon || (
          <span className="text-purple font-medium">
            {alt?.charAt(0)?.toUpperCase() || '?'}
          </span>
        )}
      </div>
    )
  }

  const placeholderSrc = getPlaceholderUrl(src, 10)

  return (
    <div className={`${sizeClass} rounded-full flex-shrink-0 relative overflow-hidden ${className}`}>
      {/* Blurred tiny placeholder */}
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
