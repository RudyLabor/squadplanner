/**
 * Chantier 12 - Generic optimistic update utilities for TanStack Query
 *
 * Provides a factory function that generates onMutate/onError/onSettled handlers
 * following the same pattern used in useSessionsQuery.ts RSVP mutations.
 */
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { showError } from '../lib/toast'

interface OptimisticMutationConfig<TData, TVariables> {
  /** Query keys to cancel and snapshot before the optimistic update */
  queryKeys: QueryKey[] | ((variables: TVariables) => QueryKey[])
  /** Apply the optimistic update to the cache */
  updateCache: (
    queryClient: QueryClient,
    variables: TVariables
  ) => void
  /** Optional error message (defaults to generic French message) */
  errorMessage?: string | ((error: Error, variables: TVariables) => string)
  /** Query keys to invalidate on success (refetch for consistency) */
  invalidateKeys?: QueryKey[] | ((data: unknown, variables: TVariables) => QueryKey[])
}

interface OptimisticHandlers<TData, TVariables> {
  onMutate: (variables: TVariables) => Promise<{ snapshots: Map<string, unknown> }>
  onError: (
    error: Error,
    variables: TVariables,
    context: { snapshots: Map<string, unknown> } | undefined
  ) => void
  onSettled: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void
}

/**
 * Factory that generates onMutate/onError/onSettled handlers for optimistic mutations.
 *
 * Usage:
 * ```ts
 * const handlers = createOptimisticMutation<MyData, MyVars>(queryClient, {
 *   queryKeys: (vars) => [queryKeys.squads.list()],
 *   updateCache: (qc, vars) => {
 *     qc.setQueryData(queryKeys.squads.list(), (old) => ...)
 *   },
 *   invalidateKeys: (data, vars) => [queryKeys.squads.list()],
 * })
 *
 * useMutation({ mutationFn, ...handlers })
 * ```
 */
export function createOptimisticMutation<TData = unknown, TVariables = unknown>(
  queryClient: QueryClient,
  config: OptimisticMutationConfig<TData, TVariables>
): OptimisticHandlers<TData, TVariables> {
  const resolveKeys = (
    keysOrFn: QueryKey[] | ((arg: any, arg2?: any) => QueryKey[]),
    ...args: unknown[]
  ): QueryKey[] => {
    if (typeof keysOrFn === 'function') {
      return (keysOrFn as (...a: unknown[]) => QueryKey[])(...args)
    }
    return keysOrFn
  }

  return {
    onMutate: async (variables: TVariables) => {
      const keys = resolveKeys(config.queryKeys, variables)

      // Cancel outgoing refetches for all affected queries
      await Promise.all(
        keys.map((key) => queryClient.cancelQueries({ queryKey: key }))
      )

      // Snapshot all affected query data for rollback
      const snapshots = new Map<string, unknown>()
      for (const key of keys) {
        const keyStr = JSON.stringify(key)
        snapshots.set(keyStr, queryClient.getQueryData(key))
      }

      // Apply optimistic cache update
      config.updateCache(queryClient, variables)

      return { snapshots }
    },

    onError: (
      error: Error,
      variables: TVariables,
      context: { snapshots: Map<string, unknown> } | undefined
    ) => {
      // Rollback all affected queries to their previous state
      if (context?.snapshots) {
        for (const [keyStr, data] of context.snapshots) {
          const key = JSON.parse(keyStr) as QueryKey
          if (data !== undefined) {
            queryClient.setQueryData(key, data)
          }
        }
      }

      // Show error toast
      const message =
        typeof config.errorMessage === 'function'
          ? config.errorMessage(error, variables)
          : config.errorMessage || 'Erreur de connexion. Reessaie.'
      showError(message)
    },

    onSettled: (
      data: TData | undefined,
      error: Error | null,
      variables: TVariables
    ) => {
      // Always refetch to ensure cache is consistent with server
      if (config.invalidateKeys) {
        const keys = resolveKeys(config.invalidateKeys, data, variables)
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }
    },
  }
}

/**
 * Helper to generate a temporary optimistic ID for new entities.
 * Prefixed with 'optimistic-' to distinguish from real server IDs.
 */
export function optimisticId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Check if an entity ID is an optimistic (not yet server-confirmed) ID.
 */
export function isOptimisticId(id: string): boolean {
  return id.startsWith('optimistic-')
}
