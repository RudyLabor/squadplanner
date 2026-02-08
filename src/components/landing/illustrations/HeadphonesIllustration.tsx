import { motion } from 'framer-motion'

interface Props {
  size?: number
  className?: string
}

const draw = { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }
const drawTransition = { duration: 0.8, ease: [0.65, 0, 0.35, 1] as const }

export function HeadphonesIllustration({ size = 64, className = '' }: Props) {
  return (
    <div className={`illustration-themed ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {/* Headband arc */}
        <motion.path
          d="M14 36V32C14 22 22 14 32 14C42 14 50 22 50 32V36"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0 }}
        />
        {/* Left ear cup */}
        <motion.rect
          x="10" y="34" width="8" height="14" rx="4"
          stroke="currentColor"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.3 }}
        />
        {/* Right ear cup */}
        <motion.rect
          x="46" y="34" width="8" height="14" rx="4"
          stroke="currentColor"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.35 }}
        />
        {/* Sound waves from left */}
        <motion.path
          d="M6 38C4 36 4 44 6 42"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.6, 0],
          }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.8, repeat: 2, repeatDelay: 0.5 }}
        />
        {/* Sound waves from right */}
        <motion.path
          d="M58 38C60 36 60 44 58 42"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.6, 0],
          }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 1, repeat: 2, repeatDelay: 0.5 }}
        />
        {/* Mic boom */}
        <motion.path
          d="M18 44L18 50C18 52 20 54 22 54"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.5 }}
        />
        {/* Mic tip */}
        <motion.circle
          cx="24" cy="54" r="2"
          stroke="var(--color-success, #34d399)"
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 400, damping: 15 }}
        />
      </motion.svg>
    </div>
  )
}
