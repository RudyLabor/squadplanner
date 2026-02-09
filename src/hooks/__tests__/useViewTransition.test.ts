import { describe, it, expect, vi } from 'vitest'
import { isViewTransitionSupported, withViewTransition } from '../useViewTransition'

describe('isViewTransitionSupported', () => {
  it('returns false when startViewTransition is not available', () => {
    expect(isViewTransitionSupported()).toBe(false)
  })

  it('returns true when startViewTransition is available', () => {
    ;(document as any).startViewTransition = vi.fn()
    expect(isViewTransitionSupported()).toBe(true)
    delete (document as any).startViewTransition
  })
})

describe('withViewTransition', () => {
  it('calls callback directly when not supported', () => {
    const callback = vi.fn()
    withViewTransition(callback)
    expect(callback).toHaveBeenCalled()
  })

  it('calls startViewTransition when supported', () => {
    const startViewTransition = vi.fn((cb: () => void) => cb())
    ;(document as any).startViewTransition = startViewTransition
    const callback = vi.fn()
    withViewTransition(callback)
    expect(startViewTransition).toHaveBeenCalled()
    expect(callback).toHaveBeenCalled()
    delete (document as any).startViewTransition
  })
})
