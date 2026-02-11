"use client";

import { useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface SeedConfig {
  key: unknown[]
  data: unknown
}

/**
 * Client boundary wrapper for RSC routes.
 * Seeds React Query cache with server-loaded data on first render.
 * This enables server → client data transfer without useLoaderData hooks.
 */
export function ClientRouteWrapper({
  children,
  seeds,
}: {
  children: ReactNode
  seeds?: SeedConfig[]
}) {
  const queryClient = useQueryClient()
  const seeded = useRef(false)

  if (!seeded.current && seeds?.length) {
    seeds.forEach(({ key, data }) => {
      if (data != null) queryClient.setQueryData(key, data)
    })
    seeded.current = true
  }

  return <>{children}</>
}
