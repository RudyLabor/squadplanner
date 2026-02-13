
import { m, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { type ReactNode, useEffect, useCallback } from 'react'
import { X } from '../icons'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
}

export function Drawer({ isOpen, onClose, children, title, className = '' }: DrawerProps) {
  const dragControls = useDragControls()
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.velocity.y > 300 || info.offset.y > 100) {
        onClose()
      }
    },
    [onClose]
  )

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <m.div
            ref={focusTrapRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated border-t border-border-default rounded-t-2xl max-h-[85vh] flex flex-col safe-area-pb ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-border-hover" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="text-text-primary font-semibold text-base">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors touch-target"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}
