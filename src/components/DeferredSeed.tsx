import { useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Seeds a React Query cache key when deferred/streamed data arrives.
 * Used inside <Await> to bridge SSR streaming with React Query.
 */
export function DeferredSeed({
  queryKey,
  data,
  children,
}: {
  queryKey: unknown[]
  data: unknown
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const seeded = useRef(false)

  if (!seeded.current && data != null) {
    queryClient.setQueryData(queryKey, data)
    seeded.current = true
  }

  return <>{children}</>
}
