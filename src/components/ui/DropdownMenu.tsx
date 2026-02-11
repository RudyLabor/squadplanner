import { type ReactNode, useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
}

interface DropdownMenuItemProps {
  icon?: ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  onSelect: () => void
  children: ReactNode
}

interface DropdownMenuLabelProps { children: ReactNode }

const DropdownCtx = createContext<{ close: () => void }>({ close: () => {} })

export function DropdownMenu({ trigger, children, align = 'start', side = 'bottom' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)

  const close = useCallback(() => {
    setOpen(false)
    setActiveIdx(-1)
    triggerRef.current?.querySelector<HTMLElement>('button, [tabindex]')?.focus()
  }, [])

  const toggle = useCallback(() => {
    if (open) close()
    else setOpen(true)
  }, [open, close])

  // Position menu when opening
  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const mW = 220, mH = 300
    let x = align === 'start' ? rect.left : align === 'end' ? rect.right - mW : rect.left + rect.width / 2 - mW / 2
    let y = side === 'bottom' ? rect.bottom + 4 : rect.top - mH - 4
    if (side === 'bottom' && y + mH > window.innerHeight) y = rect.top - mH - 4
    if (side === 'top' && y < 0) y = rect.bottom + 4
    setPos({ x: Math.max(8, Math.min(x, window.innerWidth - mW - 8)), y: Math.max(8, y) })
  }, [open, align, side])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[]
      const enabled = items.filter((el) => !el.disabled)
      if (e.key === 'Escape') { e.preventDefault(); close(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = activeIdx < enabled.length - 1 ? activeIdx + 1 : 0
        setActiveIdx(next); enabled[next]?.focus(); return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = activeIdx > 0 ? activeIdx - 1 : enabled.length - 1
        setActiveIdx(prev); enabled[prev]?.focus(); return
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enabled[activeIdx]?.click() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, activeIdx, close])

  // Focus first item on open
  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => {
      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[]
      const first = items.find((el) => !el.disabled)
      if (first) { setActiveIdx(items.indexOf(first)); first.focus() }
    })
    return () => cancelAnimationFrame(raf)
  }, [open])

  const originY = side === 'bottom' ? 'top' : 'bottom'

  return (
    <DropdownCtx.Provider value={{ close }}>
      <div ref={triggerRef} className="inline-flex">
        <div
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
              e.preventDefault()
              if (!open) setOpen(true)
            }
          }}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {trigger}
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <m.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: side === 'bottom' ? -4 : 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: side === 'bottom' ? -4 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.15 }}
                style={{ position: 'fixed', left: pos.x, top: pos.y, transformOrigin: `${align} ${originY}`, zIndex: 9999 }}
                role="menu"
                aria-orientation="vertical"
                className="min-w-[200px] py-1.5 bg-bg-elevated border border-border-hover rounded-xl shadow-dropdown"
              >
                <ItemRefCollector itemRefs={itemRefs}>{children}</ItemRefCollector>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </DropdownCtx.Provider>
  )
}

function ItemRefCollector({ children, itemRefs }: { children: ReactNode; itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]> }) {
  itemRefs.current = []
  return <>{children}</>
}

export function DropdownMenuItem({ icon, shortcut, disabled = false, danger = false, onSelect, children }: DropdownMenuItemProps) {
  const { close } = useContext(DropdownCtx)

  return (
    <button
      onClick={() => { if (!disabled) { onSelect(); close() } }}
      disabled={disabled}
      role="menuitem"
      tabIndex={-1}
      className={`w-full flex items-center gap-3 px-3.5 py-2 text-left text-sm transition-colors outline-none ${
        disabled ? 'opacity-40 cursor-not-allowed'
          : danger ? 'text-error hover:bg-error-10 focus-visible:bg-error-10'
          : 'text-text-primary hover:bg-bg-hover focus-visible:bg-bg-hover'
      }`}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-text-tertiary">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="text-xs text-text-quaternary ml-4 font-mono">{shortcut}</span>}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border-default" role="separator" />
}

export function DropdownMenuLabel({ children }: DropdownMenuLabelProps) {
  return <div className="px-3.5 py-1.5 text-xs font-medium text-text-quaternary uppercase tracking-wider" role="none">{children}</div>
}
