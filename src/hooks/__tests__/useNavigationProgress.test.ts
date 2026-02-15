import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'

const { mockUseLocation } = vi.hoisted(() => {
  const mockUseLocation = vi.fn().mockReturnValue({ pathname: '/' })
  return { mockUseLocation }
})

vi.mock('react-router', () => ({
  useLocation: mockUseLocation,
}))

import { useNavigationProgressStore, useNavigationProgress } from '../useNavigationProgress'

describe('useNavigationProgressStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useNavigationProgressStore.setState({ isNavigating: false })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // STRICT: Verifies the store has correct initial state, start() sets isNavigating
  // to true, done() sets it back to false, and state transitions are idempotent
  it('has correct initial state and start/done toggle isNavigating correctly', () => {
    // 1. Initial isNavigating is false
    const initialState = useNavigationProgressStore.getState()
    expect(initialState.isNavigating).toBe(false)

    // 2. start is a function
    expect(typeof initialState.start).toBe('function')
    // 3. done is a function
    expect(typeof initialState.done).toBe('function')

    // 4. start() sets isNavigating to true
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)

    // 5. Calling start() again is idempotent (still true)
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)

    // 6. done() sets isNavigating to false
    act(() => {
      useNavigationProgressStore.getState().done()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 7. Calling done() again is idempotent (still false)
    act(() => {
      useNavigationProgressStore.getState().done()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 8. Rapid toggle: start -> done -> start
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)
    act(() => {
      useNavigationProgressStore.getState().done()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)
  })

  // STRICT: Verifies subscribers receive state updates when start/done are called
  it('notifies subscribers on state change and getState always returns latest', () => {
    const stateChanges: boolean[] = []
    // 1. Subscribe to state changes
    const unsub = useNavigationProgressStore.subscribe((state) => {
      stateChanges.push(state.isNavigating)
    })

    // 2. Initial state is false
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 3. start triggers subscriber with true
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(stateChanges).toContain(true)

    // 4. done triggers subscriber with false
    act(() => {
      useNavigationProgressStore.getState().done()
    })
    expect(stateChanges).toContain(false)

    // 5. At least 2 state changes were recorded
    expect(stateChanges.length).toBeGreaterThanOrEqual(2)

    // 6. Last state change is false (after done)
    expect(stateChanges[stateChanges.length - 1]).toBe(false)

    // 7. getState returns current state
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)

    // 8. Unsubscribe works (no more updates after unsub)
    const lengthBefore = stateChanges.length
    unsub()
    act(() => {
      useNavigationProgressStore.getState().done()
    })
    // No new entries after unsubscribe
    expect(stateChanges.length).toBe(lengthBefore)
  })
})

describe('useNavigationProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ pathname: '/' })
    act(() => {
      useNavigationProgressStore.setState({ isNavigating: false })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // STRICT: Verifies the hook renders without error, returns void, and does
  // not trigger navigation progress on initial render (same pathname)
  it('renders without error, returns void, and does not navigate on initial render', () => {
    // 1. Hook renders without error
    const { result } = renderHook(() => useNavigationProgress())
    // 2. The hook returns void
    expect(result.current).toBeUndefined()

    // 3. isNavigating should still be false (no pathname change)
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 4. Even after advancing timers, still not navigating
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 5. start and done functions still exist on the store
    expect(typeof useNavigationProgressStore.getState().start).toBe('function')
    expect(typeof useNavigationProgressStore.getState().done).toBe('function')

    // 6. Re-rendering with same pathname does not trigger navigation
    mockUseLocation.mockReturnValue({ pathname: '/' })
    const { rerender } = renderHook(() => useNavigationProgress())
    rerender()
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 7. Hook is importable as named export
    expect(useNavigationProgress).toBeDefined()
    // 8. Is a function
    expect(typeof useNavigationProgress).toBe('function')
  })

  // STRICT: Verifies the hook detects pathname change, starts navigation,
  // and auto-finishes with the 80ms timer delay
  it('detects pathname change, starts isNavigating, and auto-finishes after timer', () => {
    // Initial render at '/'
    const { rerender } = renderHook(() => useNavigationProgress())

    // 1. No navigation on first render
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 2. Simulate navigation to '/home'
    mockUseLocation.mockReturnValue({ pathname: '/home' })
    rerender()

    // 3. start() should have been called, isNavigating is true
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)

    // 4. Before the 80ms timer fires, still navigating
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)

    // 5. After 80ms, done() is called via timer, isNavigating is false
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 6. Navigate to another page
    mockUseLocation.mockReturnValue({ pathname: '/squads' })
    rerender()
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)

    // 7. Timer clears previous and sets new
    act(() => {
      vi.advanceTimersByTime(80)
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)

    // 8. Navigating to same page does NOT trigger
    mockUseLocation.mockReturnValue({ pathname: '/squads' })
    rerender()
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)
  })
})
