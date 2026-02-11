import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

type PopoverSide = 'top' | 'bottom' | 'left' | 'right'
type PopoverAlign = 'start' | 'center' | 'end'

interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: PopoverSide
  align?: PopoverAlign
  triggerMode?: 'click' | 'hover'
  showArrow?: boolean
  className?: string
}

interface Coords {
  x: number
  y: number
  actualSide: PopoverSide
}

const PADDING = 8
const ARROW_SIZE = 8

function computePosition(
  triggerRect: DOMRect,
  popoverRect: DOMRect,
  side: PopoverSide,
  align: PopoverAlign
): Coords {
  let x = 0
  let y = 0
  let actualSide = side

  // Primary axis positioning
  switch (side) {
    case 'top':
      y = triggerRect.top - popoverRect.height - PADDING
      break
    case 'bottom':
      y = triggerRect.bottom + PADDING
      break
    case 'left':
      x = triggerRect.left - popoverRect.width - PADDING
      break
    case 'right':
      x = triggerRect.right + PADDING
      break
  }

  // Flip if out of viewport
  if (side === 'top' && y < 0) {
    y = triggerRect.bottom + PADDING
    actualSide = 'bottom'
  } else if (side === 'bottom' && y + popoverRect.height > window.innerHeight) {
    y = triggerRect.top - popoverRect.height - PADDING
    actualSide = 'top'
  } else if (side === 'left' && x < 0) {
    x = triggerRect.right + PADDING
    actualSide = 'right'
  } else if (side === 'right' && x + popoverRect.width > window.innerWidth) {
    x = triggerRect.left - popoverRect.width - PADDING
    actualSide = 'left'
  }

  // Alignment axis
  if (actualSide === 'top' || actualSide === 'bottom') {
    switch (align) {
      case 'start':
        x = triggerRect.left
        break
      case 'center':
        x = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2
        break
      case 'end':
        x = triggerRect.right - popoverRect.width
        break
    }
  } else {
    switch (align) {
      case 'start':
        y = triggerRect.top
        break
      case 'center':
        y = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2
        break
      case 'end':
        y = triggerRect.bottom - popoverRect.height
        break
    }
  }

  // Shift to stay in viewport
  x = Math.max(PADDING, Math.min(x, window.innerWidth - popoverRect.width - PADDING))
  y = Math.max(PADDING, Math.min(y, window.innerHeight - popoverRect.height - PADDING))

  return { x, y, actualSide }
}

function getTransformOrigin(side: PopoverSide, align: PopoverAlign): string {
  const alignMap = { start: '0%', center: '50%', end: '100%' }
  switch (side) {
    case 'top':
      return `${alignMap[align]} 100%`
    case 'bottom':
      return `${alignMap[align]} 0%`
    case 'left':
      return `100% ${alignMap[align]}`
    case 'right':
      return `0% ${alignMap[align]}`
  }
}

function getArrowStyle(
  side: PopoverSide,
  triggerRect: DOMRect,
  popoverX: number,
  popoverY: number
): React.CSSProperties {
  const half = ARROW_SIZE / 2
  const base: React.CSSProperties = {
    position: 'absolute',
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    transform: 'rotate(45deg)',
  }

  switch (side) {
    case 'top': {
      const arrowX = triggerRect.left + triggerRect.width / 2 - popoverX - half
      return { ...base, bottom: -half, left: Math.max(8, Math.min(arrowX, 200)), borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'inherit' }
    }
    case 'bottom': {
      const arrowX = triggerRect.left + triggerRect.width / 2 - popoverX - half
      return { ...base, top: -half, left: Math.max(8, Math.min(arrowX, 200)), borderLeft: '1px solid', borderTop: '1px solid', borderColor: 'inherit' }
    }
    case 'left': {
      const arrowY = triggerRect.top + triggerRect.height / 2 - popoverY - half
      return { ...base, right: -half, top: Math.max(8, Math.min(arrowY, 200)), borderRight: '1px solid', borderTop: '1px solid', borderColor: 'inherit' }
    }
    case 'right': {
      const arrowY = triggerRect.top + triggerRect.height / 2 - popoverY - half
      return { ...base, left: -half, top: Math.max(8, Math.min(arrowY, 200)), borderLeft: '1px solid', borderBottom: '1px solid', borderColor: 'inherit' }
    }
  }
}

export function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  triggerMode = 'click',
  showArrow = false,
  className = '',
}: PopoverProps) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = isControlled ? controlledOpen : internalOpen

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [coords, setCoords] = useState<Coords>({ x: 0, y: 0, actualSide: side })

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value)
      onOpenChange?.(value)
    },
    [isControlled, onOpenChange]
  )

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const popoverRect = popoverRef.current.getBoundingClientRect()
    setCoords(computePosition(triggerRect, popoverRect, side, align))
  }, [side, align])

  // Update position when open
  useEffect(() => {
    if (!isOpen) return
    // Delay to ensure popover is rendered before measuring
    const frame = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(frame)
  }, [isOpen, updatePosition])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, setOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, setOpen])

  // Cleanup hover timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const handleTriggerClick = () => {
    if (triggerMode === 'click') setOpen(!isOpen)
  }

  const handleMouseEnter = () => {
    if (triggerMode !== 'hover') return
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    if (triggerMode !== 'hover') return
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  const triggerRect = triggerRef.current?.getBoundingClientRect()

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <m.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                  position: 'fixed',
                  left: coords.x,
                  top: coords.y,
                  transformOrigin: getTransformOrigin(coords.actualSide, align),
                  zIndex: 50,
                }}
                role="dialog"
                className={`bg-surface-card border border-border-default rounded-xl shadow-dropdown ${className}`}
              >
                {children}
                {showArrow && triggerRect && (
                  <div
                    className="bg-surface-card border-border-default"
                    style={getArrowStyle(coords.actualSide, triggerRect, coords.x, coords.y)}
                    aria-hidden="true"
                  />
                )}
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
