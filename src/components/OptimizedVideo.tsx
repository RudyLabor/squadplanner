import { useState, useCallback, memo, useRef, useEffect } from 'react'

interface OptimizedVideoProps {
  /** WebM source (preferred — smaller, VP9) */
  webmSrc: string
  /** MP4 source (Safari fallback — H.264) */
  mp4Src: string
  /** Poster image shown instantly before video loads */
  posterSrc: string
  /** Accessible description */
  alt: string
  width?: number
  height?: number
  className?: string
  /** Loop the video (default: true) */
  loop?: boolean
  /** Load immediately without IntersectionObserver — for above-the-fold only (default: false) */
  priority?: boolean
}

/**
 * Check if the user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if the connection is too slow for video
 */
function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false
  const conn = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection
  if (!conn) return false
  if (conn.saveData) return true
  if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') return true
  return false
}

/**
 * Optimized Video component with:
 * - IntersectionObserver lazy loading (200px rootMargin)
 * - Poster image shown instantly (no video decode needed)
 * - prefers-reduced-motion: poster only, zero video download
 * - Network-aware: no video on 2G/saveData
 * - Fade-in transition when video is ready
 * - WebM + MP4 dual source for cross-browser support
 * - Explicit dimensions to prevent CLS
 * - Memoized to prevent unnecessary re-renders
 */
export const OptimizedVideo = memo(function OptimizedVideo({
  webmSrc,
  mp4Src,
  posterSrc,
  alt,
  width,
  height,
  className = '',
  loop = true,
  priority = false,
}: OptimizedVideoProps) {
  const [isInView, setIsInView] = useState(priority)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine if video should load (runs once on mount/inView)
  useEffect(() => {
    if (!isInView) return
    // Never load video if user prefers reduced motion or slow connection
    if (prefersReducedMotion() || isSlowConnection()) {
      setShouldLoadVideo(false)
      return
    }
    setShouldLoadVideo(true)
  }, [isInView])

  // IntersectionObserver for lazy loading (skip for priority)
  useEffect(() => {
    if (priority || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [priority])

  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...(width && height ? { width, height, aspectRatio: `${width}/${height}` } : {}),
      }}
      role="img"
      aria-label={alt}
    >
      {/* Poster image — always rendered, always visible initially */}
      <img
        src={posterSrc}
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
          isVideoReady ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Skeleton placeholder while poster loads */}
      {!isInView && (
        <div
          className="absolute inset-0 bg-white/5 animate-pulse rounded-inherit"
          aria-hidden="true"
        />
      )}

      {/* Video — only loaded when in view + motion allowed + fast connection */}
      {shouldLoadVideo && (
        <video
          autoPlay
          muted
          playsInline
          loop={loop}
          onCanPlay={handleCanPlay}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <source src={webmSrc} type="video/webm" />
          <source src={mp4Src} type="video/mp4" />
        </video>
      )}
    </div>
  )
})

export default OptimizedVideo
