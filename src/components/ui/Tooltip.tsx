/**
 * PHASE - Tooltip Component
 *
 * Accessible tooltip with keyboard support and animations.
 */
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: TooltipPosition
  delay?: number
  disabled?: boolean
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const padding = 8

    let x = 0
    let y = 0

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2
        y = rect.top - padding
        break
      case 'bottom':
        x = rect.left + rect.width / 2
        y = rect.bottom + padding
        break
      case 'left':
        x = rect.left - padding
        y = rect.top + rect.height / 2
        break
      case 'right':
        x = rect.right + padding
        y = rect.top + rect.height / 2
        break
    }

    setCoords({ x, y })
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getTransformOrigin = () => {
    switch (position) {
      case 'top':
        return 'bottom center'
      case 'bottom':
        return 'top center'
      case 'left':
        return 'right center'
      case 'right':
        return 'left center'
    }
  }

  const getTranslate = () => {
    switch (position) {
      case 'top':
        return 'translate(-50%, -100%)'
      case 'bottom':
        return 'translate(-50%, 0)'
      case 'left':
        return 'translate(-100%, -50%)'
      case 'right':
        return 'translate(0, -50%)'
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  left: coords.x,
                  top: coords.y,
                  transform: getTranslate(),
                  transformOrigin: getTransformOrigin(),
                  zIndex: 9999,
                }}
                role="tooltip"
                className={`px-3 py-2 text-[13px] font-medium text-text-primary bg-bg-active border border-border-hover rounded-lg shadow-dropdown max-w-xs ${className}`}
              >
                {content}
                {/* Arrow */}
                <div
                  className="absolute w-2 h-2 bg-bg-active border-border-hover rotate-45"
                  style={{
                    ...(position === 'top' && {
                      bottom: -4,
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      borderRight: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'inherit',
                    }),
                    ...(position === 'bottom' && {
                      top: -4,
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      borderLeft: '1px solid',
                      borderTop: '1px solid',
                      borderColor: 'inherit',
                    }),
                    ...(position === 'left' && {
                      right: -4,
                      top: '50%',
                      transform: 'translateY(-50%) rotate(45deg)',
                      borderRight: '1px solid',
                      borderTop: '1px solid',
                      borderColor: 'inherit',
                    }),
                    ...(position === 'right' && {
                      left: -4,
                      top: '50%',
                      transform: 'translateY(-50%) rotate(45deg)',
                      borderLeft: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'inherit',
                    }),
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}

/**
 * Accessible tooltip for keyboard users
 * Shows tooltip content in a visually hidden span for screen readers
 */
export function TooltipTrigger({
  content,
  children,
  ...props
}: TooltipProps) {
  return (
    <Tooltip content={content} {...props}>
      <span className="relative">
        {children}
        <span className="sr-only">{content}</span>
      </span>
    </Tooltip>
  )
}
