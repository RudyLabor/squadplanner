import { motion, type HTMLMotionProps } from 'framer-motion'

interface SharedElementProps extends Omit<HTMLMotionProps<'div'>, 'id'> {
  id: string
  children: React.ReactNode
  className?: string
}

/**
 * V3 - Shared Element wrapper for cross-page morph transitions
 * Wrap matching elements on source and target pages with the same `id`
 * to enable smooth morphing animation between page navigations.
 */
export function SharedElement({ id, children, className, ...props }: SharedElementProps) {
  return (
    <motion.div
      layoutId={id}
      layout="position"
      transition={{ type: 'spring', stiffness: 350, damping: 30, duration: 0.3 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
