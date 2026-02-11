import { m, AnimatePresence } from 'framer-motion'
import {
  createContext,
  useContext,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { ChevronDown } from '../icons'
import { haptic } from '../../utils/haptics'

// --- Context ---

interface AccordionContextValue {
  expandedItems: string[]
  toggle: (value: string) => void
  type: 'single' | 'multiple'
  baseId: string
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordionContext() {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('Accordion compound components must be used within <Accordion>')
  return ctx
}

interface AccordionItemContextValue {
  value: string
  isExpanded: boolean
  disabled: boolean
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext)
  if (!ctx) throw new Error('AccordionTrigger/Content must be used within <AccordionItem>')
  return ctx
}

// --- Accordion Root ---

interface AccordionProps {
  type?: 'single' | 'multiple'
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  children: ReactNode
}

export function Accordion({
  type = 'single',
  value,
  onChange,
  children,
}: AccordionProps) {
  const baseId = useId()

  const expandedItems: string[] = value
    ? Array.isArray(value)
      ? value
      : [value]
    : []

  const toggle = useCallback(
    (itemValue: string) => {
      if (!onChange) return

      if (type === 'single') {
        const next = expandedItems.includes(itemValue) ? '' : itemValue
        onChange(next)
      } else {
        const next = expandedItems.includes(itemValue)
          ? expandedItems.filter((v) => v !== itemValue)
          : [...expandedItems, itemValue]
        onChange(next)
      }
    },
    [type, expandedItems, onChange]
  )

  return (
    <AccordionContext.Provider value={{ expandedItems, toggle, type, baseId }}>
      <div className="w-full divide-y divide-border-subtle">{children}</div>
    </AccordionContext.Provider>
  )
}

// --- AccordionItem ---

interface AccordionItemProps {
  value: string
  children: ReactNode
  disabled?: boolean
}

export function AccordionItem({ value, children, disabled = false }: AccordionItemProps) {
  const { expandedItems } = useAccordionContext()
  const isExpanded = expandedItems.includes(value)

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded, disabled }}>
      <div className="w-full">{children}</div>
    </AccordionItemContext.Provider>
  )
}

// --- AccordionTrigger ---

interface AccordionTriggerProps {
  children: ReactNode
  className?: string
}

export function AccordionTrigger({ children, className = '' }: AccordionTriggerProps) {
  const { toggle, baseId } = useAccordionContext()
  const { value, isExpanded, disabled } = useAccordionItemContext()

  const triggerId = `${baseId}-trigger-${value}`
  const contentId = `${baseId}-content-${value}`

  const handleClick = useCallback(() => {
    if (!disabled) {
      try { haptic.selection() } catch {}
      toggle(value)
    }
  }, [disabled, toggle, value])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault()
        toggle(value)
      }
    },
    [disabled, toggle, value]
  )

  return (
    <button
      id={triggerId}
      type="button"
      aria-expanded={isExpanded}
      aria-controls={contentId}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        flex w-full items-center justify-between py-4 text-left
        text-sm font-medium text-text-primary
        transition-colors
        hover:text-text-primary
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-lg
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span className="flex-1">{children}</span>
      <m.span
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="ml-2 flex-shrink-0 text-text-tertiary"
        aria-hidden="true"
      >
        <ChevronDown className="w-4 h-4" />
      </m.span>
    </button>
  )
}

// --- AccordionContent ---

interface AccordionContentProps {
  children: ReactNode
  className?: string
}

export function AccordionContent({ children, className = '' }: AccordionContentProps) {
  const { baseId } = useAccordionContext()
  const { value, isExpanded } = useAccordionItemContext()

  const triggerId = `${baseId}-trigger-${value}`
  const contentId = `${baseId}-content-${value}`

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <m.div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className={`pb-4 text-sm text-text-secondary ${className}`}>
            {children}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
