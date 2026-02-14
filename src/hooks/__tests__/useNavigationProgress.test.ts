import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
}))

import { useNavigationProgressStore, useNavigationProgress } from '../useNavigationProgress'

describe('useNavigationProgressStore', () => {
  beforeEach(() => {
    act(() => {
      useNavigationProgressStore.setState({ isNavigating: false })
    })
  })

  it('initial isNavigating is false', () => {
    const { isNavigating } = useNavigationProgressStore.getState()
    expect(isNavigating).toBe(false)
  })

  it('start sets isNavigating to true', () => {
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)
  })

  it('done sets isNavigating to false', () => {
    act(() => {
      useNavigationProgressStore.getState().start()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(true)

    act(() => {
      useNavigationProgressStore.getState().done()
    })
    expect(useNavigationProgressStore.getState().isNavigating).toBe(false)
  })
})

describe('useNavigationProgress', () => {
  beforeEach(() => {
    act(() => {
      useNavigationProgressStore.setState({ isNavigating: false })
    })
  })

  it('hook renders without error', () => {
    const { result } = renderHook(() => useNavigationProgress())
    // The hook returns void, just verify it does not throw
    expect(result.current).toBeUndefined()
  })
})
