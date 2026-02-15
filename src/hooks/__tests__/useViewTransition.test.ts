import { describe, it, expect, vi, afterEach } from 'vitest'
import { isViewTransitionSupported, withViewTransition } from '../useViewTransition'

describe('isViewTransitionSupported', () => {
  afterEach(() => {
    delete (document as any).startViewTransition
  })

  // STRICT: Verifies the function returns false when startViewTransition is not
  // available on document, and returns true when it is available
  it('returns correct boolean based on document.startViewTransition availability', () => {
    // 1. Function is defined
    expect(isViewTransitionSupported).toBeDefined()
    // 2. Function is a function
    expect(typeof isViewTransitionSupported).toBe('function')

    // 3. Returns false when startViewTransition is not on document
    delete (document as any).startViewTransition
    expect(isViewTransitionSupported()).toBe(false)

    // 4. Return type is boolean
    expect(typeof isViewTransitionSupported()).toBe('boolean')

    // 5. Returns true when startViewTransition is available
    ;(document as any).startViewTransition = vi.fn()
    expect(isViewTransitionSupported()).toBe(true)

    // 6. Still returns true when it's a different kind of function
    ;(document as any).startViewTransition = () => {}
    expect(isViewTransitionSupported()).toBe(true)

    // 7. Cleanup: remove it, returns false again
    delete (document as any).startViewTransition
    expect(isViewTransitionSupported()).toBe(false)

    // 8. Calling multiple times is stable
    expect(isViewTransitionSupported()).toBe(false)
    expect(isViewTransitionSupported()).toBe(false)
  })

  // STRICT: Verifies the function checks both typeof document and 'startViewTransition' in document
  it('checks document exists and startViewTransition property correctly', () => {
    // 1. document is defined in jsdom
    expect(typeof document).not.toBe('undefined')

    // 2. Without startViewTransition, returns false
    delete (document as any).startViewTransition
    expect(isViewTransitionSupported()).toBe(false)

    // 3. 'startViewTransition' is not in document
    expect('startViewTransition' in document).toBe(false)

    // 4. Add startViewTransition
    ;(document as any).startViewTransition = vi.fn()
    // 5. Now 'startViewTransition' is in document
    expect('startViewTransition' in document).toBe(true)

    // 6. Function returns true
    expect(isViewTransitionSupported()).toBe(true)

    // 7. The check is done each call (not cached)
    delete (document as any).startViewTransition
    expect(isViewTransitionSupported()).toBe(false)
    ;(document as any).startViewTransition = vi.fn()
    expect(isViewTransitionSupported()).toBe(true)
  })
})

describe('withViewTransition', () => {
  afterEach(() => {
    delete (document as any).startViewTransition
  })

  // STRICT: Verifies the callback is called directly when View Transitions API
  // is not supported (graceful fallback behavior)
  it('calls callback directly as fallback when startViewTransition is not supported', () => {
    delete (document as any).startViewTransition

    const callback = vi.fn()

    // 1. withViewTransition is defined
    expect(withViewTransition).toBeDefined()
    // 2. It's a function
    expect(typeof withViewTransition).toBe('function')

    // 3. Call with callback
    withViewTransition(callback)
    // 4. Callback was called
    expect(callback).toHaveBeenCalled()
    // 5. Callback was called exactly once
    expect(callback).toHaveBeenCalledTimes(1)

    // 6. Call again
    withViewTransition(callback)
    // 7. Callback called twice total
    expect(callback).toHaveBeenCalledTimes(2)

    // 8. Works with async callbacks too
    const asyncCallback = vi.fn().mockResolvedValue(undefined)
    withViewTransition(asyncCallback)
    expect(asyncCallback).toHaveBeenCalledTimes(1)
  })

  // STRICT: Verifies startViewTransition is invoked when supported, the callback
  // is passed through, and both startViewTransition and callback are called
  it('uses startViewTransition when supported and passes the callback through', () => {
    const startViewTransition = vi.fn((cb: () => void) => cb())
    ;(document as any).startViewTransition = startViewTransition

    const callback = vi.fn()

    // 1. startViewTransition exists
    expect((document as any).startViewTransition).toBeDefined()

    // 2. Call withViewTransition
    withViewTransition(callback)

    // 3. startViewTransition was called
    expect(startViewTransition).toHaveBeenCalled()
    // 4. startViewTransition was called once
    expect(startViewTransition).toHaveBeenCalledTimes(1)
    // 5. startViewTransition received a function argument
    expect(startViewTransition).toHaveBeenCalledWith(expect.any(Function))

    // 6. The callback was executed (startViewTransition invokes it)
    expect(callback).toHaveBeenCalled()
    // 7. Callback was called once
    expect(callback).toHaveBeenCalledTimes(1)

    // 8. Call again to verify no stale state
    const callback2 = vi.fn()
    withViewTransition(callback2)
    expect(startViewTransition).toHaveBeenCalledTimes(2)
    expect(callback2).toHaveBeenCalledTimes(1)

    // 9. The original callback wasn't called again
    expect(callback).toHaveBeenCalledTimes(1)

    // 10. Works when startViewTransition doesn't invoke callback immediately
    const lazyTransition = vi.fn()
    ;(document as any).startViewTransition = lazyTransition
    const callback3 = vi.fn()
    withViewTransition(callback3)
    expect(lazyTransition).toHaveBeenCalledWith(expect.any(Function))
    // callback3 not called because lazyTransition didn't invoke it
    expect(callback3).not.toHaveBeenCalled()
  })
})
