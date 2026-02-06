import { lazy, Suspense, memo } from 'react'
import type { ComponentProps } from 'react'

// Lazy load react-confetti only when needed
const ReactConfetti = lazy(() => import('react-confetti'))

type ConfettiProps = ComponentProps<typeof ReactConfetti>

/**
 * Lazy-loaded Confetti component
 * Only loads the react-confetti library when the component is actually rendered
 * This saves ~20KB from the initial bundle
 */
export const LazyConfetti = memo(function LazyConfetti(props: ConfettiProps) {
  return (
    <Suspense fallback={null}>
      <ReactConfetti {...props} />
    </Suspense>
  )
})

export default LazyConfetti
