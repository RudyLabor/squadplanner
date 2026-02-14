import { describe, it, expect, vi } from 'vitest'
import { optimisticId, isOptimisticId } from '../optimisticUpdate'

// Mock toast
vi.mock('../../lib/toast', () => ({
  showError: vi.fn(),
}))

describe('optimisticUpdate', () => {
  describe('optimisticId', () => {
    it('generates string starting with optimistic-', () => {
      const id = optimisticId()
      expect(id).toMatch(/^optimistic-/)
    })

    it('generates unique ids', () => {
      const id1 = optimisticId()
      const id2 = optimisticId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('isOptimisticId', () => {
    it('returns true for optimistic ids', () => {
      expect(isOptimisticId('optimistic-123-abc')).toBe(true)
    })

    it('returns false for regular UUIDs', () => {
      expect(isOptimisticId('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isOptimisticId('')).toBe(false)
    })
  })
})
