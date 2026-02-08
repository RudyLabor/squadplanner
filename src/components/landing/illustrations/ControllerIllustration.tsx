import { motion } from 'framer-motion'

interface Props {
  size?: number
  className?: string
}

const draw = { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }
const drawTransition = { duration: 0.8, ease: [0.65, 0, 0.35, 1] as const }

export function ControllerIllustration({ size = 64, className = '' }: Props) {
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
        {/* Controller body */}
        <motion.path
          d="M12 24C12 20 16 16 22 16H42C48 16 52 20 52 24V36C52 44 46 48 40 48H36L32 44L28 48H24C18 48 12 44 12 36V24Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0 }}
        />
        {/* D-pad vertical */}
        <motion.line
          x1="24" y1="26" x2="24" y2="38"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.3 }}
        />
        {/* D-pad horizontal */}
        <motion.line
          x1="18" y1="32" x2="30" y2="32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.35 }}
        />
        {/* Button A */}
        <motion.circle
          cx="40" cy="28" r="2.5"
          stroke="var(--color-success, #34d399)"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.5 }}
        />
        {/* Button B */}
        <motion.circle
          cx="46" cy="32" r="2.5"
          stroke="var(--color-error, #f87171)"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.55 }}
        />
        {/* Button X */}
        <motion.circle
          cx="34" cy="32" r="2.5"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.6 }}
        />
        {/* Button Y */}
        <motion.circle
          cx="40" cy="36" r="2.5"
          stroke="var(--color-warning, #f5a623)"
          strokeWidth="2"
          variants={draw}
          transition={{ ...drawTransition, delay: 0.65 }}
        />
      </motion.svg>
    </div>
  )
}
