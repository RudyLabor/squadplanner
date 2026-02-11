"use client";

/**
 * Pull to Refresh Component
 *
 * Mobile-friendly pull-to-refresh with smooth animation.
 * Uses refs to avoid stale closure issues with touch handlers.
 */
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { RefreshCw } from './icons'
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
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentPull = useRef(0)
  const pulling = useRef(false)
  const refreshing = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const progress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance >= threshold

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onTouchStart = (e: TouchEvent) => {
      if (disabled || refreshing.current) return
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      if (scrollTop > 5) return // 5px tolerance

      startY.current = e.touches[0].clientY
      pulling.current = true
      currentPull.current = 0
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || disabled || refreshing.current) return

      const diff = e.touches[0].clientY - startY.current
      if (diff <= 0) {
        // Only cancel if we haven't started pulling yet
        if (currentPull.current === 0) {
          pulling.current = false
        }
        return
      }

      const distance = Math.min(diff * 0.5, threshold * 1.5)
      currentPull.current = distance
      setPullDistance(distance)

      if (distance >= threshold) {
        haptic.light()
      }
    }

    const onTouchEnd = async () => {
      if (!pulling.current) return
      pulling.current = false

      const dist = currentPull.current
      currentPull.current = 0

      if (dist >= threshold && !refreshing.current) {
        refreshing.current = true
        setIsRefreshing(true)
        setPullDistance(threshold * 0.4)
        haptic.medium()

        try {
          await onRefreshRef.current()
        } catch (error) {
          console.error('Refresh failed:', error)
        } finally {
          setPullDistance(0)
          setIsRefreshing(false)
          refreshing.current = false
        }
      } else {
        setPullDistance(0)
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [disabled, threshold])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
          style={{
            top: -40,
            transform: `translateY(${pullDistance}px)`,
            opacity: progress,
            transition: !pulling.current ? 'transform 0.3s ease, opacity 0.3s ease' : undefined,
          }}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              shouldTrigger || isRefreshing
                ? 'bg-primary/20 border border-primary/30'
                : 'bg-overlay-light border border-border-default'
            }`}
          >
            <RefreshCw
              className={`w-5 h-5 ${
                shouldTrigger || isRefreshing ? 'text-primary' : 'text-text-secondary'
              } ${isRefreshing ? 'animate-spin' : ''}`}
              style={!isRefreshing ? { transform: `rotate(${progress * 180}deg)` } : undefined}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: !pulling.current ? 'transform 0.3s ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
