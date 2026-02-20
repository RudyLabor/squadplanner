import { m, type Variants } from 'framer-motion'
import { Children, type ReactNode } from 'react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
    },
  },
}

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
}

interface AnimatedListProps {
  children: ReactNode
  className?: string
  /** Custom stagger delay between items (default: 0.04s) */
  stagger?: number
  /** Disable animation (e.g. for virtualized lists) */
  disabled?: boolean
  /** As HTML element */
  as?: 'div' | 'ul' | 'ol' | 'section'
}

/**
 * Wraps a list of children with staggered entrance animation.
 * Each direct child animates in with a slight delay after the previous.
 * Respects prefers-reduced-motion automatically via framer-motion.
 *
 * @example
 * <AnimatedList>
 *   {sessions.map(s => <SessionCard key={s.id} session={s} />)}
 * </AnimatedList>
 */
export function AnimatedList({
  children,
  className = '',
  stagger = 0.04,
  disabled = false,
  as = 'div',
}: AnimatedListProps) {
  if (disabled) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const MotionTag = m[as]
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const customContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.02,
      },
    },
  }

  return (
    <MotionTag
      className={className}
      variants={customContainer}
      initial="hidden"
      animate="visible"
    >
      {Children.map(children, (child) =>
        child ? (
          <m.div variants={prefersReduced ? itemVariantsReduced : itemVariants}>
            {child}
          </m.div>
        ) : null
      )}
    </MotionTag>
  )
}

/**
 * Individual animated item — use inside AnimatedList or standalone
 */
export { AnimatedItem as AnimatedListItem }

export function AnimatedItem({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {children}
    </m.div>
  )
}

export default AnimatedList
