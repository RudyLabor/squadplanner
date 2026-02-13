
import { useState, useRef, useEffect, memo } from 'react'
import { useAdaptiveLoading } from '../../hooks/useAdaptiveLoading'

interface AdaptiveImageProps {
  /** High quality image source */
  src: string
  /** Medium quality source (optional, falls back to src) */
  srcMedium?: string
  /** Low quality / thumbnail source (optional, falls back to placeholder) */
  srcLow?: string
  /** Tiny base64 placeholder for blur-up effect */
  placeholder?: string
  alt: string
  width?: number
  height?: number
  className?: string
  /** Whether to skip adaptive behavior and always load full quality */
  eager?: boolean
}

/**
 * AdaptiveImage - Loads different image qualities based on network conditions.
 * - Slow/2g: shows placeholder only (or low quality thumbnail)
 * - 3g: loads regular quality
 * - 4g/wifi: loads high quality
 * - Blur-up effect: tiny base64 placeholder transitions to full image
 */
export const AdaptiveImage = memo(function AdaptiveImage({
  src,
  srcMedium,
  srcLow,
  placeholder,
  alt,
  width,
  height,
  className = '',
  eager = false,
}: AdaptiveImageProps) {
  const { tier } = useAdaptiveLoading()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Pick source based on quality tier
  const resolvedSrc = eager
    ? src
    : tier === 'low'
      ? srcLow || placeholder || src
      : tier === 'medium'
        ? srcMedium || src
        : src

  // Skip placeholder on low tier when no real low-quality source
  const showPlaceholderOnly = !eager && tier === 'low' && !srcLow && !!placeholder

  // Reset loaded state when source changes
  useEffect(() => {
    setLoaded(false)
    setError(false)
  }, [resolvedSrc])

  // If the image is already cached, mark as loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [resolvedSrc])

  const defaultPlaceholder =
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 1 1%27%3E%3Crect fill=%27%23141518%27 width=%271%27 height=%271%27/%3E%3C/svg%3E'

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder / blur-up background */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {/* Fallback background when no placeholder */}
      {!placeholder && !loaded && (
        <div className="absolute inset-0 bg-bg-hover" aria-hidden="true" />
      )}

      {/* Actual image */}
      {!showPlaceholderOnly && (
        <img
          ref={imgRef}
          src={error ? placeholder || defaultPlaceholder : resolvedSrc}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Low-tier overlay hint */}
      {showPlaceholderOnly && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-hover/80">
          <span className="text-xs text-text-tertiary">Connexion lente</span>
        </div>
      )}
    </div>
  )
})
