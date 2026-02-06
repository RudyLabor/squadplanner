/**
 * PHASE - Pull to Refresh Component
 *
 * Mobile-friendly pull-to-refresh with smooth animation.
 * Works on touch devices.
 */
import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { motion, useAnimation } from 'framer-motion'
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
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const controls = useAnimation()

  const progress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = progress >= 1

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return

    const container = containerRef.current
    if (!container) return

    // Only enable pull-to-refresh when at the top of the scroll
    if (container.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    if (diff > 0) {
      // Apply resistance to make it feel more natural
      const resistance = 0.5
      const distance = diff * resistance
      setPullDistance(Math.min(distance, threshold * 1.5))

      // Haptic feedback when reaching threshold
      if (distance >= threshold && pullDistance < threshold) {
        haptic.light()
      }
    }
  }, [isPulling, disabled, isRefreshing, threshold, pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return

    setIsPulling(false)

    if (shouldTrigger && !isRefreshing) {
      setIsRefreshing(true)
      haptic.medium()

      // Animate to fixed position
      await controls.start({ y: threshold / 2 })

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        // Animate back
        await controls.start({ y: 0 })
        setPullDistance(0)
        setIsRefreshing(false)
      }
    } else {
      // Snap back
      controls.start({ y: 0 })
      setPullDistance(0)
    }
  }, [isPulling, shouldTrigger, isRefreshing, threshold, controls, onRefresh])

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
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
          opacity: progress,
        }}
      >
        <motion.div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            shouldTrigger
              ? 'bg-[#6366f1]/20 border border-[#6366f1]/30'
              : 'bg-white/10 border border-white/20'
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
              shouldTrigger ? 'text-[#6366f1]' : 'text-white/60'
            }`}
          />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        animate={controls}
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : undefined,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
