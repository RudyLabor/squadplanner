import { m } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingMoreProps {
  text?: string
}

/**
 * Subtle "loading more" indicator for infinite scroll / pagination.
 * Shows a Loader2 spinner + text, centered, with fade-in animation.
 */
export function LoadingMore({ text = 'Chargement...' }: LoadingMoreProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center gap-2 py-4"
    >
      <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />
      <span className="text-sm text-text-tertiary">{text}</span>
    </m.div>
  )
}
