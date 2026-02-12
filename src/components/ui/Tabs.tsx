import { m, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useId,
  useState,
  useEffect,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { haptic, getHapticEnabled } from '../../utils/haptics'

// --- Context ---

interface TabsContextValue {
  value: string
  onChange: (value: string) => void
  variant: 'underline' | 'pills' | 'enclosed'
  baseId: string
  tabKeys: string[]
  swipeable: boolean
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>')
  return ctx
}

// --- Tabs Root ---

interface TabsProps {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  variant?: 'underline' | 'pills' | 'enclosed'
  /** Ordered list of tab values for swipe navigation */
  tabKeys?: string[]
  /** Enable swipe gestures between tabs (default: true) */
  swipeable?: boolean
}

export function Tabs({
  value,
  onChange,
  children,
  variant = 'underline',
  tabKeys = [],
  swipeable = true,
}: TabsProps) {
  const baseId = useId()
  return (
    <TabsContext.Provider value={{ value, onChange, variant, baseId, tabKeys, swipeable }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  )
}

// --- TabsList ---

interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className = '' }: TabsListProps) {
  const { variant } = useTabsContext()
  const listRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current
    if (!list) return

    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
    )
    const currentIndex = tabs.findIndex((t) => t === document.activeElement)
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus()
      tabs[nextIndex].click()
    }
  }, [])

  const variantClasses: Record<string, string> = {
    underline: 'border-b border-border-subtle',
    pills: 'bg-bg-surface rounded-xl p-1 border border-border-subtle',
    enclosed: 'border border-border-subtle rounded-t-xl bg-bg-surface',
  }

  return (
    <div className="relative">
      {/* Fade masks for horizontal scroll */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-bg-base to-transparent z-10 opacity-0 peer-scroll-left:opacity-100" />
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={handleKeyDown}
        className={`flex overflow-x-auto scrollbar-hide gap-0.5 ${variantClasses[variant]} ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

// --- Tab ---

interface TabProps {
  value: string
  icon?: ReactNode
  disabled?: boolean
  children: ReactNode
}

export function Tab({ value, icon, disabled = false, children }: TabProps) {
  const { value: activeValue, onChange, variant, baseId } = useTabsContext()
  const isActive = activeValue === value

  const handleClick = useCallback(() => {
    if (!disabled) onChange(value)
  }, [disabled, onChange, value])

  const tabId = `${baseId}-tab-${value}`
  const panelId = `${baseId}-panel-${value}`

  const baseClasses =
    'relative inline-flex items-center gap-2 font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1'

  const disabledClasses = disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'

  const variantClasses: Record<string, string> = {
    underline: `px-4 py-2.5 text-sm ${
      isActive ? 'text-primary' : 'text-text-tertiary hover:text-text-primary'
    }`,
    pills: `px-4 py-2 text-sm rounded-lg ${
      isActive ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
    }`,
    enclosed: `px-4 py-2.5 text-sm ${
      isActive
        ? 'text-text-primary bg-bg-base border-b-2 border-b-transparent -mb-px'
        : 'text-text-tertiary hover:text-text-secondary'
    }`,
  }

  return (
    <button
      id={tabId}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
    >
      {/* Animated indicator */}
      {isActive && variant === 'underline' && (
        <m.div
          layoutId={`${baseId}-underline`}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {isActive && variant === 'pills' && (
        <m.div
          layoutId={`${baseId}-pill`}
          className="absolute inset-0 bg-bg-active border border-border-default rounded-lg"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {isActive && variant === 'enclosed' && (
        <m.div
          layoutId={`${baseId}-enclosed`}
          className="absolute inset-0 bg-bg-base rounded-t-lg border border-border-subtle border-b-transparent"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </button>
  )
}

// --- TabsContent ---

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { value: activeValue, baseId, tabKeys, onChange, swipeable } = useTabsContext()

  const x = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const opacity = useTransform(x, [-containerWidth, 0, containerWidth], [0.5, 1, 0.5])

  const reducedMotion = useReducedMotion()

  // Track container width for drag constraints and opacity mapping
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [activeValue])

  if (activeValue !== value) return null

  const tabId = `${baseId}-tab-${value}`
  const panelId = `${baseId}-panel-${value}`

  const currentIndex = tabKeys.indexOf(value)
  const canSwipe = swipeable && !reducedMotion && tabKeys.length > 1 && currentIndex !== -1

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (!canSwipe) return

    const swipeThreshold = 50
    const { offset, velocity } = info
    const swipedLeft = offset.x < -swipeThreshold || velocity.x < -200
    const swipedRight = offset.x > swipeThreshold || velocity.x > 200

    if (swipedLeft && currentIndex < tabKeys.length - 1) {
      if (getHapticEnabled()) haptic.selection()
      onChange(tabKeys[currentIndex + 1])
    } else if (swipedRight && currentIndex > 0) {
      if (getHapticEnabled()) haptic.selection()
      onChange(tabKeys[currentIndex - 1])
    }

    // Snap back to center
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
  }

  if (!canSwipe) {
    return (
      <div id={panelId} role="tabpanel" aria-labelledby={tabId} tabIndex={0} className={className}>
        {children}
      </div>
    )
  }

  return (
    <m.div
      ref={containerRef}
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={`touch-pan-y ${className}`}
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
    >
      {children}
    </m.div>
  )
}
