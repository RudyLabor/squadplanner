import { motion } from 'framer-motion'

interface TourOverlayProps {
  targetRect: DOMRect | null
  onSkip: () => void
}

export function TourOverlay({ targetRect, onSkip }: TourOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] pointer-events-auto"
      onClick={onSkip}
    >
      {/* Dark overlay with cutout for target */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="var(--color-overlay-dark-50)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight ring around target */}
      {targetRect && (
        <motion.div
          className="absolute border-2 border-primary rounded-xl pointer-events-none"
          animate={{
            boxShadow: ['0 0 0 0 var(--color-primary-20)', '0 0 0 8px transparent', '0 0 0 0 var(--color-primary-20)'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
    </motion.div>
  )
}
