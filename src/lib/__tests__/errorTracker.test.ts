import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setUser, addBreadcrumb, startTransaction, destroyErrorTracker } from '../errorTracker'

describe('errorTracker', () => {
  beforeEach(() => {
    destroyErrorTracker()
  })

  it('setUser does not throw', () => {
    expect(() => setUser({ id: 'user-1', username: 'test' })).not.toThrow()
  })

  it('setUser with null does not throw', () => {
    expect(() => setUser(null)).not.toThrow()
  })

  it('addBreadcrumb does not throw', () => {
    expect(() => addBreadcrumb('test action', 'manual')).not.toThrow()
  })

  it('startTransaction returns null', () => {
    expect(startTransaction('test')).toBeNull()
  })

  it('destroyErrorTracker does not throw', () => {
    expect(() => destroyErrorTracker()).not.toThrow()
  })
})
