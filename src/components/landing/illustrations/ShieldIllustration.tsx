import { m } from 'framer-motion'

interface Props {
  size?: number
  className?: string
}

const draw = { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }
const drawTransition = { duration: 0.8, ease: [0.65, 0, 0.35, 1] as const }

export function ShieldIllustration({ size = 64, className = '' }: Props) {
  return (
    <div className={`illustration-themed ${className}`}>
      <m.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {/* Shield outline */}
        <m.path
          d="M32 8L12 18V32C12 44 20 52 32 56C44 52 52 44 52 32V18L32 8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0 }}
        />
        {/* Inner glow shield */}
        <m.path
          d="M32 14L18 22V32C18 41 24 48 32 51C40 48 46 41 46 32V22L32 14Z"
          fill="var(--color-primary, #6366f1)"
          fillOpacity="0.1"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="1"
          strokeOpacity="0.3"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
        {/* Checkmark */}
        <m.path
          d="M24 32L30 38L42 26"
          stroke="var(--color-success, #34d399)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.6 }}
        />
        {/* Sparkle top-right */}
        <m.path
          d="M48 14L49 11L50 14L53 15L50 16L49 19L48 16L45 15Z"
          fill="var(--color-warning, #f5a623)"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, type: 'spring', stiffness: 400, damping: 15 }}
        />
      </m.svg>
    </div>
  )
}
