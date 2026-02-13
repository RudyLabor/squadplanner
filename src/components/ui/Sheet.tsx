
import { type ReactNode, useEffect, useRef, useCallback, useState } from 'react'
import {
  m,
  AnimatePresence,
  useDragControls,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion'
import { createPortal } from 'react-dom'
import { X } from '../icons'
/* ---------- Types ---------- */

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  snapPoints?: number[]
  defaultSnap?: number
  side?: 'bottom' | 'right'
}

/* ---------- Component ---------- */

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  snapPoints = [50, 100],
  defaultSnap,
  side = 'bottom',
}: SheetProps) {
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const [currentSnap, setCurrentSnap] = useState(defaultSnap ?? snapPoints[0])

  // Motion values for bottom sheet
  const y = useMotionValue(0)
  const overlayOpacity = useTransform(y, [0, window.innerHeight], [1, 0])

  // Capture trigger on open
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
    }
  }, [open])

  // Focus trap + escape
  useEffect(() => {
    if (!open || !sheetRef.current) return

    const container = sheetRef.current

    const focusFirst = () => {
      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable[0]?.focus()
    }

    const raf = requestAnimationFrame(focusFirst)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Restore focus
  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [open])

  // Reset snap on open
  useEffect(() => {
    if (open) {
      setCurrentSnap(defaultSnap ?? snapPoints[0])
    }
  }, [open, defaultSnap, snapPoints])

  // Bottom drag end
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const viewH = window.innerHeight
      const currentPx = viewH * (1 - currentSnap / 100)
      const newPx = currentPx + info.offset.y

      // Close if dragged below first snap
      const lowestSnapPx = viewH * (1 - snapPoints[0] / 100)
      if (newPx > lowestSnapPx + 80 || info.velocity.y > 500) {
        onClose()
        return
      }

      // Find nearest snap
      let nearest = snapPoints[0]
      let minDist = Infinity
      for (const sp of snapPoints) {
        const snapPx = viewH * (1 - sp / 100)
        const dist = Math.abs(newPx - snapPx)
        if (dist < minDist) {
          minDist = dist
          nearest = sp
        }
      }

      setCurrentSnap(nearest)
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 })
    },
    [currentSnap, snapPoints, onClose, y]
  )

  if (typeof document === 'undefined') return null

  const isBottom = side === 'bottom'
  const sheetHeight = isBottom ? `${currentSnap}vh` : '100vh'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          {isBottom ? (
            <m.div
              style={{ opacity: overlayOpacity }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />
          ) : (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />
          )}

          {/* Sheet panel */}
          {isBottom ? (
            <m.div
              ref={sheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                height: sheetHeight,
                y,
              }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="absolute bottom-0 left-0 right-0 bg-bg-elevated border-t border-border-default rounded-t-2xl flex flex-col safe-area-pb"
            >
              {/* Drag handle */}
              <div
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-text-quaternary" />
              </div>

              {/* Header */}
              {(title || description) && (
                <div className="flex items-start justify-between gap-4 px-5 pb-3">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h3 className="text-base font-semibold text-text-primary font-display">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors touch-target-sm"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-hide">{children}</div>
            </m.div>
          ) : (
            /* Right side panel (desktop) */
            <m.div
              ref={sheetRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="absolute top-0 right-0 bottom-0 w-[400px] max-w-[90vw] bg-bg-elevated border-l border-border-default flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border-subtle">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h3 className="text-lg font-semibold text-text-primary font-display">
                      {title}
                    </h3>
                  )}
                  {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors touch-target-sm"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">{children}</div>
            </m.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
