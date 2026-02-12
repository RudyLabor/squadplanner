'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  separator?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  children: ReactNode
  disabled?: boolean
}

export function ContextMenu({ items, children, disabled }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = useCallback(
    (x: number, y: number) => {
      // Adjust position to stay within viewport
      const menuWidth = 220
      const menuHeight =
        items.filter((i) => !i.separator).length * 40 +
        items.filter((i) => i.separator).length * 9 +
        12
      const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8)
      const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8)

      setPosition({ x: Math.max(8, adjustedX), y: Math.max(8, adjustedY) })
      setIsOpen(true)
    },
    [items]
  )

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Right-click handler (desktop)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      open(e.clientX, e.clientY)
    },
    [disabled, open]
  )

  // Long press handlers (mobile)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      const touch = e.touches[0]
      const x = touch.clientX
      const y = touch.clientY
      longPressTimer.current = setTimeout(() => {
        open(x, y)
        // Prevent text selection on mobile
        if (navigator.vibrate) navigator.vibrate(10)
      }, 500)
    },
    [disabled, open]
  )

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Close on click outside or escape
  useEffect(() => {
    if (!isOpen) return

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleScroll = () => close()

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen, close])

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="contents"
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile touch dismiss) */}
            <div
              className="fixed inset-0 z-[60]"
              onClick={close}
              onTouchEnd={close}
              aria-hidden="true"
            />

            {/* Menu */}
            <m.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.12 }}
              style={{ left: position.x, top: position.y }}
              className="fixed z-[61] min-w-[200px] py-1.5 bg-surface-dark border border-border-hover rounded-xl shadow-2xl shadow-black/50 backdrop-blur-sm"
              role="menu"
              aria-orientation="vertical"
            >
              {items.map((item) => {
                if (item.separator) {
                  return (
                    <div key={item.id} className="my-1 h-px bg-border-default" role="separator" />
                  )
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick()
                        close()
                      }
                    }}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 text-left text-base transition-colors ${
                      item.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : item.danger
                          ? 'text-error hover:bg-error-10'
                          : 'text-text-primary hover:bg-border-default'
                    }`}
                    role="menuitem"
                  >
                    {item.icon && (
                      <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-sm text-text-tertiary ml-4 font-mono">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                )
              })}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default ContextMenu
