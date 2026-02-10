/**
 * PHASE - Pull to Refresh Component
 *
 * Mobile-friendly pull-to-refresh with smooth animation.
 * Works on touch devices.
 */
import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { haptic } from '../utils/haptics'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  disabled?: boolean
  threshold?: number
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className = '',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const progress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance >= threshold

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return

    // Check if page is scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop > 0) return

    startY.current = e.touches[0].clientY
    isPulling.current = true
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    if (diff > 0) {
      const resistance = 0.5
      const distance = diff * resistance
      const newDistance = Math.min(distance, threshold * 1.5)

      // Haptic feedback when reaching threshold
      if (newDistance >= threshold && pullDistance < threshold) {
        haptic.light()
      }

      setPullDistance(newDistance)
    } else {
      // Scrolling up, cancel pull
      isPulling.current = false
      setPullDistance(0)
    }
  }, [disabled, isRefreshing, threshold, pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false

    if (shouldTrigger && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold / 2)
      haptic.medium()

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setPullDistance(0)
        setIsRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
  }, [shouldTrigger, isRefreshing, threshold, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10 transition-transform duration-200"
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
          opacity: progress,
        }}
      >
        <motion.div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            shouldTrigger
              ? 'bg-primary/20 border border-primary/30'
              : 'bg-overlay-light border border-border-default'
          }`}
          animate={{
            rotate: isRefreshing ? 360 : progress * 180,
          }}
          transition={
            isRefreshing
              ? { duration: 1, repeat: Infinity, ease: 'linear' }
              : { duration: 0 }
          }
        >
          <RefreshCw
            className={`w-5 h-5 ${
              shouldTrigger ? 'text-primary' : 'text-text-secondary'
            }`}
          />
        </motion.div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
