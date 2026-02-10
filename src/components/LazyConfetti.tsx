import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'

const ReactConfetti = lazy(() => import('react-confetti'))

type ConfettiProps = ComponentProps<typeof ReactConfetti>

export default function LazyConfetti(props: ConfettiProps) {
  return (
    <Suspense fallback={null}>
      <ReactConfetti {...props} />
    </Suspense>
  )
}

// Re-export for convenience
export { LazyConfetti }
