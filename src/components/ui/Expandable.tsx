import { useState, useRef, type ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface ExpandableProps {
  children: ReactNode
  /** Number of visible lines before truncation (default 3) */
  previewLines?: number
  /** Label for expand trigger (default "Voir plus") */
  expandLabel?: string
  /** Label for collapse trigger (default "Voir moins") */
  collapseLabel?: string
  /** Additional className for the wrapper */
  className?: string
}

/**
 * Expandable - Progressive disclosure component.
 * Shows essential content first with a "Voir plus" trigger.
 * Smooth height animation using framer-motion.
 */
export function Expandable({
  children,
  previewLines = 3,
  expandLabel = 'Voir plus',
  collapseLabel = 'Voir moins',
  className = '',
}: ExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Check if content overflows the preview height
  const checkOverflow = (el: HTMLDivElement | null) => {
    if (!el) return
    // line-height ~1.5 * font-size ~14px = ~21px per line
    const maxHeight = previewLines * 21
    setNeedsTruncation(el.scrollHeight > maxHeight + 4)
  }

  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="wait">
        {!isExpanded ? (
          <m.div
            key="preview"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              ref={(el) => {
                previewRef.current = el
                checkOverflow(el)
              }}
              className="overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: previewLines,
                WebkitBoxOrient: 'vertical' as const,
              }}
            >
              {children}
            </div>
          </m.div>
        ) : (
          <m.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div ref={contentRef}>
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {needsTruncation && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span>{isExpanded ? collapseLabel : expandLabel}</span>
          <m.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </m.div>
        </button>
      )}
    </div>
  )
}
