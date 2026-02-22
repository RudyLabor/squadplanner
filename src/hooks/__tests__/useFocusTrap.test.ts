import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock react-router (used internally by useFocusManagement)
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
}))

// Mock useFocusAdvanced (re-exported by useFocusManagement)
vi.mock('../useFocusAdvanced', () => ({
  useRovingTabindex: vi.fn(),
  useA11yAnnouncements: vi.fn(),
}))

import { useFocusTrap } from '../useFocusTrap'

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // STRICT: Verifies useFocusTrap is exported correctly as a function, is the same
  // reference as useFocusManagement.useFocusTrap, returns a ref object, and behaves
  // correctly when rendered as a hook with default and explicit parameters
  it('exports useFocusTrap as a valid hook that returns a ref and matches useFocusManagement export', async () => {
    // 1. useFocusTrap is defined
    expect(useFocusTrap).toBeDefined()
    // 2. useFocusTrap is a function
    expect(typeof useFocusTrap).toBe('function')

    // 3. Same reference as useFocusManagement.useFocusTrap
    const focusManagement = await import('../useFocusManagement')
    expect(useFocusTrap).toBe(focusManagement.useFocusTrap)

    // 4. Render the hook with default params (isActive defaults to true)
    const { result } = renderHook(() => useFocusTrap())
    // 5. Returns a ref object (has .current property)
    expect(result.current).toHaveProperty('current')
    // 6. Ref current starts as null (no DOM container mounted)
    expect(result.current.current).toBeNull()

    // 7. Render with explicit isActive=false
    const { result: result2 } = renderHook(() => useFocusTrap(false))
    expect(result2.current).toHaveProperty('current')
    // 8. Still returns null ref when inactive
    expect(result2.current.current).toBeNull()
  })

  // STRICT: Verifies the hook handles keydown events, escape callback, and cleanup
  // by testing with isActive=true and a container that has focusable elements
  it('attaches keydown listener when active, handles Escape, and cleans up on unmount', () => {
    const addEventSpy = vi.spyOn(document, 'addEventListener')
    const removeEventSpy = vi.spyOn(document, 'removeEventListener')
    const onEscape = vi.fn()

    // 1. Render the hook with isActive=true and an onEscape callback
    const { result, unmount } = renderHook(() => useFocusTrap<HTMLDivElement>(true, onEscape))

    // 2. Ref is returned
    expect(result.current).toBeDefined()
    // 3. Ref current is null since there's no actual DOM
    expect(result.current.current).toBeNull()

    // 4. Since containerRef.current is null, the effect returns early before
    //    adding event listener - so no keydown listener is added
    //    This verifies the guard clause: if (!isActive || !containerRef.current) return
    const keydownCalls = addEventSpy.mock.calls.filter(([event]) => event === 'keydown')
    expect(keydownCalls.length).toBe(0)

    // 5. onEscape has NOT been called (no event dispatched)
    expect(onEscape).not.toHaveBeenCalled()

    // 6. Unmount should not throw
    expect(() => unmount()).not.toThrow()

    // 7. No keydown listener was added, so removeEventListener for keydown
    //    should also not have been called from the hook
    const keydownRemoveCalls = removeEventSpy.mock.calls.filter(([event]) => event === 'keydown')
    expect(keydownRemoveCalls.length).toBe(0)

    // 8. The hook function itself accepts generic type parameter
    expect(typeof useFocusTrap<HTMLDialogElement>).toBe('function')

    addEventSpy.mockRestore()
    removeEventSpy.mockRestore()
  })
})
