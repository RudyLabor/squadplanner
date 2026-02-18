
import { type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface SeedConfig {
  key: unknown[]
  data: unknown
}

/**
 * Client boundary wrapper for routes.
 * Seeds React Query cache with loader data on every navigation.
 * setQueryData is cheap and only triggers re-renders if data actually changed,
 * so it's safe to call on each render to keep cache in sync with loaders.
 */
export function ClientRouteWrapper({
  children,
  seeds,
}: {
  children: ReactNode
  seeds?: SeedConfig[]
}) {
  const queryClient = useQueryClient()

  if (seeds?.length) {
    seeds.forEach(({ key, data }) => {
      if (data != null) queryClient.setQueryData(key, data)
    })
  }

  return <>{children}</>
}
