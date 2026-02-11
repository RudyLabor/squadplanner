"use client";

/**
 * PHASE - Tooltip Component
 *
 * Accessible tooltip with keyboard support and animations.
 * Includes a "help" variant that renders a "?" icon trigger.
 */
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { HelpCircle } from '../icons'
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
type TooltipVariant = 'default' | 'help'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: TooltipPosition
  delay?: number
  disabled?: boolean
  className?: string
  /** "help" variant renders a small "?" icon as the trigger */
  variant?: TooltipVariant
  /** Size of the help icon (default 14) */
  helpIconSize?: number
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false,
  className = '',
  variant = 'default',
  helpIconSize = 14,
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

  const triggerContent = variant === 'help' ? (
    <span className="inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        aria-label="Aide"
        className="inline-flex items-center justify-center rounded-full text-text-tertiary hover:text-text-secondary hover:bg-surface-card transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        style={{ width: helpIconSize + 6, height: helpIconSize + 6 }}
        tabIndex={0}
      >
        <HelpCircle style={{ width: helpIconSize, height: helpIconSize }} />
      </button>
    </span>
  ) : (
    children
  )

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
        {triggerContent}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <m.div
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
                className={`px-3 py-2 text-base font-medium text-text-primary bg-bg-active border border-border-hover rounded-lg shadow-dropdown max-w-xs ${className}`}
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
              </m.div>
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

/**
 * HelpTooltip - Shortcut for variant="help" tooltips.
 * Renders children with a small "?" icon that shows the help text on hover.
 */
export function HelpTooltip({
  content,
  children,
  position = 'top',
  ...props
}: Omit<TooltipProps, 'variant'>) {
  return (
    <Tooltip content={content} position={position} variant="help" {...props}>
      {children}
    </Tooltip>
  )
}
