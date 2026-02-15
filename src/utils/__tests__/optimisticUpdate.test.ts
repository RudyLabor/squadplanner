/**
 * Comprehensive tests for src/utils/optimisticUpdate.ts
 * Covers: createOptimisticMutation (onMutate, onError, onSettled),
 *         optimisticId, isOptimisticId, resolveKeys
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { optimisticId, isOptimisticId, createOptimisticMutation } from '../optimisticUpdate'

// Mock toast
const mockShowError = vi.fn()
vi.mock('../../lib/toast', () => ({
  showError: (...args: unknown[]) => mockShowError(...args),
}))

// Mock QueryClient
function createMockQueryClient() {
  const data = new Map<string, unknown>()
  return {
    cancelQueries: vi.fn().mockResolvedValue(undefined),
    getQueryData: vi.fn((key: unknown[]) => data.get(JSON.stringify(key))),
    setQueryData: vi.fn((key: unknown[], value: unknown) => {
      data.set(JSON.stringify(key), value)
    }),
    invalidateQueries: vi.fn(),
    _setData: (key: unknown[], value: unknown) => data.set(JSON.stringify(key), value),
  }
}

describe('optimisticUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // optimisticId
  // =========================================================================
  describe('optimisticId', () => {
    it('generates string starting with "optimistic-"', () => {
      const id = optimisticId()
      expect(id).toMatch(/^optimistic-/)
    })

    it('generates unique ids', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(optimisticId())
      }
      expect(ids.size).toBe(100)
    })

    it('includes timestamp component', () => {
      const id = optimisticId()
      const parts = id.split('-')
      expect(parts.length).toBeGreaterThanOrEqual(2)
      // Second part should be a numeric timestamp
      expect(Number(parts[1])).toBeGreaterThan(0)
    })

    it('includes random suffix', () => {
      const id = optimisticId()
      // Format: optimistic-{timestamp}-{random}
      const parts = id.split('-')
      expect(parts.length).toBe(3)
      expect(parts[2].length).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // isOptimisticId
  // =========================================================================
  describe('isOptimisticId', () => {
    it('returns true for optimistic ids', () => {
      expect(isOptimisticId('optimistic-123-abc')).toBe(true)
    })

    it('returns true for generated optimistic ids', () => {
      const id = optimisticId()
      expect(isOptimisticId(id)).toBe(true)
    })

    it('returns false for regular UUIDs', () => {
      expect(isOptimisticId('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isOptimisticId('')).toBe(false)
    })

    it('returns false for "optimistic" without dash', () => {
      expect(isOptimisticId('optimistic')).toBe(false)
    })

    it('returns true for "optimistic-" with dash', () => {
      expect(isOptimisticId('optimistic-')).toBe(true)
    })

    it('returns false for numeric strings', () => {
      expect(isOptimisticId('12345')).toBe(false)
    })

    it('returns false for "OPTIMISTIC-123" (case sensitive)', () => {
      expect(isOptimisticId('OPTIMISTIC-123')).toBe(false)
    })
  })

  // =========================================================================
  // createOptimisticMutation
  // =========================================================================
  describe('createOptimisticMutation', () => {
    describe('with static queryKeys', () => {
      it('returns onMutate, onError, onSettled handlers', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads', 'list']],
          updateCache: vi.fn(),
        })

        expect(typeof handlers.onMutate).toBe('function')
        expect(typeof handlers.onError).toBe('function')
        expect(typeof handlers.onSettled).toBe('function')
      })

      it('onMutate cancels queries and takes snapshots', async () => {
        const qc = createMockQueryClient()
        qc._setData(['squads', 'list'], [{ id: '1', name: 'Squad A' }])

        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads', 'list']],
          updateCache: vi.fn(),
        })

        const context = await handlers.onMutate({ squadId: '1' })

        expect(qc.cancelQueries).toHaveBeenCalledWith({ queryKey: ['squads', 'list'] })
        expect(context.snapshots).toBeInstanceOf(Map)
        expect(context.snapshots.size).toBe(1)
      })

      it('onMutate calls updateCache', async () => {
        const qc = createMockQueryClient()
        const updateCache = vi.fn()

        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache,
        })

        await handlers.onMutate({ squadId: '1' })

        expect(updateCache).toHaveBeenCalledWith(qc, { squadId: '1' })
      })

      it('onMutate snapshots multiple query keys', async () => {
        const qc = createMockQueryClient()
        qc._setData(['squads', 'list'], ['data1'])
        qc._setData(['squads', 'detail', '1'], { name: 'Squad 1' })

        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads', 'list'], ['squads', 'detail', '1']],
          updateCache: vi.fn(),
        })

        const context = await handlers.onMutate({})
        expect(context.snapshots.size).toBe(2)
      })
    })

    describe('with function queryKeys', () => {
      it('resolves keys from function', async () => {
        const qc = createMockQueryClient()

        const handlers = createOptimisticMutation<unknown, { id: string }>(qc as any, {
          queryKeys: (vars) => [['squads', vars.id]],
          updateCache: vi.fn(),
        })

        await handlers.onMutate({ id: '42' })

        expect(qc.cancelQueries).toHaveBeenCalledWith({ queryKey: ['squads', '42'] })
      })
    })

    describe('onError', () => {
      it('rolls back cache from snapshots', async () => {
        const qc = createMockQueryClient()
        qc._setData(['squads'], [{ id: '1' }])

        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache: (queryClient) => {
            queryClient.setQueryData(['squads'], [{ id: '1' }, { id: 'optimistic-2' }])
          },
        })

        const context = await handlers.onMutate({})

        // Now simulate error - should roll back
        handlers.onError(new Error('Network error'), {}, context)

        expect(qc.setQueryData).toHaveBeenCalledWith(
          ['squads'],
          [{ id: '1' }]
        )
      })

      it('shows default error toast', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
        })

        handlers.onError(new Error('fail'), {}, undefined)

        expect(mockShowError).toHaveBeenCalledWith('Erreur de connexion. Reessaie.')
      })

      it('shows custom string error message', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
          errorMessage: 'Something went wrong',
        })

        handlers.onError(new Error('fail'), {}, undefined)

        expect(mockShowError).toHaveBeenCalledWith('Something went wrong')
      })

      it('shows error from function', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation<unknown, { name: string }>(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
          errorMessage: (error, vars) => `Failed to update ${vars.name}: ${error.message}`,
        })

        handlers.onError(new Error('timeout'), { name: 'Squad A' }, undefined)

        expect(mockShowError).toHaveBeenCalledWith('Failed to update Squad A: timeout')
      })

      it('handles undefined context gracefully', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
        })

        expect(() => handlers.onError(new Error('fail'), {}, undefined)).not.toThrow()
      })

      it('skips rollback for undefined snapshot data', async () => {
        const qc = createMockQueryClient()
        // Don't set any data — snapshot will contain undefined

        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['nonexistent']],
          updateCache: vi.fn(),
        })

        const context = await handlers.onMutate({})

        // setQueryData was called by updateCache (which is a mock/no-op here)
        qc.setQueryData.mockClear()

        handlers.onError(new Error('fail'), {}, context)

        // Should NOT call setQueryData because the snapshot data was undefined
        expect(qc.setQueryData).not.toHaveBeenCalled()
      })
    })

    describe('onSettled', () => {
      it('invalidates queries when invalidateKeys provided as array', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
          invalidateKeys: [['squads', 'list']],
        })

        handlers.onSettled(undefined, null, {})

        expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['squads', 'list'] })
      })

      it('invalidates queries from function', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation<unknown, { id: string }>(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
          invalidateKeys: (_data, vars) => [['squads', vars.id]],
        })

        handlers.onSettled(undefined, null, { id: '99' })

        expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['squads', '99'] })
      })

      it('does not invalidate when invalidateKeys not provided', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
        })

        handlers.onSettled(undefined, null, {})

        expect(qc.invalidateQueries).not.toHaveBeenCalled()
      })

      it('invalidates multiple keys', () => {
        const qc = createMockQueryClient()
        const handlers = createOptimisticMutation(qc as any, {
          queryKeys: [['squads']],
          updateCache: vi.fn(),
          invalidateKeys: [['squads', 'list'], ['squads', 'detail']],
        })

        handlers.onSettled(undefined, null, {})

        expect(qc.invalidateQueries).toHaveBeenCalledTimes(2)
      })
    })
  })
})
