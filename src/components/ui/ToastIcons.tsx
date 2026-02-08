import { motion } from 'framer-motion'

const iconSpring = { type: 'spring' as const, stiffness: 400, damping: 22 }
const drawTransition = { duration: 0.4, ease: [0.65, 0, 0.35, 1] as const }

interface IconProps {
  size?: number
}

export function AnimatedCheckmark({ size = 20 }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={iconSpring}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="#34d399"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.1 }}
      />
      <motion.path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.3 }}
      />
    </motion.svg>
  )
}

export function AnimatedXMark({ size = 20 }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={iconSpring}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="#f87171"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.1 }}
      />
      <motion.path
        d="M15 9l-6 6M9 9l6 6"
        stroke="#f87171"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.3 }}
      />
    </motion.svg>
  )
}

export function AnimatedWarning({ size = 20 }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={iconSpring}
    >
      <motion.path
        d="M12 3L2 21h20L12 3z"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.1 }}
      />
      <motion.line
        x1="12"
        y1="10"
        x2="12"
        y2="14"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.35 }}
      />
      <motion.circle
        cx="12"
        cy="17.5"
        r="0.5"
        fill="#fbbf24"
        stroke="#fbbf24"
        strokeWidth="1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...drawTransition, delay: 0.5 }}
      />
    </motion.svg>
  )
}

export function AnimatedInfo({ size = 20 }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={iconSpring}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="#6366f1"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.1 }}
      />
      <motion.line
        x1="12"
        y1="11"
        x2="12"
        y2="17"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.3 }}
      />
      <motion.circle
        cx="12"
        cy="8"
        r="0.5"
        fill="#6366f1"
        stroke="#6366f1"
        strokeWidth="1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...drawTransition, delay: 0.45 }}
      />
    </motion.svg>
  )
}
