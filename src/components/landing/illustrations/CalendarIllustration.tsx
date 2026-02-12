import { m } from 'framer-motion'

interface Props {
  size?: number
  className?: string
}

const draw = { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }
const drawTransition = { duration: 0.8, ease: [0.65, 0, 0.35, 1] as const }

export function CalendarIllustration({ size = 64, className = '' }: Props) {
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
        {/* Calendar body */}
        <m.rect
          x="10"
          y="16"
          width="44"
          height="38"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0 }}
        />
        {/* Top bar */}
        <m.line
          x1="10"
          y1="26"
          x2="54"
          y2="26"
          stroke="currentColor"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.2 }}
        />
        {/* Left hook */}
        <m.line
          x1="22"
          y1="12"
          x2="22"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.15 }}
        />
        {/* Right hook */}
        <m.line
          x1="42"
          y1="12"
          x2="42"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.15 }}
        />
        {/* Grid dots (date cells) */}
        {[
          [20, 33],
          [32, 33],
          [44, 33],
          [20, 41],
          [32, 41],
          [44, 41],
          [20, 49],
          [32, 49],
        ].map(([cx, cy], i) => (
          <m.circle
            key={i}
            cx={cx}
            cy={cy}
            r="2"
            fill="currentColor"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.4 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
          />
        ))}
        {/* Selected date highlight */}
        <m.rect
          x="38"
          y="44"
          width="12"
          height="10"
          rx="3"
          fill="var(--color-primary, #6366f1)"
          fillOpacity="0.2"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="1.5"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 300, damping: 20 }}
        />
        {/* Checkmark in selected date */}
        <m.path
          d="M41 49L43.5 51.5L47 47"
          stroke="var(--color-success, #34d399)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ ...drawTransition, delay: 1 }}
        />
      </m.svg>
    </div>
  )
}
