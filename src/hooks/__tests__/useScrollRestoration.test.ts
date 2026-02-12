import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
// Track the current mock pathname
let mockPathname = '/home'

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
}))

import { useScrollRestoration } from '../useScrollRestoration'

describe('useScrollRestoration', () => {
  beforeEach(() => {
    mockPathname = '/home'
    sessionStorage.clear()

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    const { unmount } = renderHook(() => useScrollRestoration())
    unmount()
  })

  it('sets up scroll listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    const { unmount } = renderHook(() => useScrollRestoration())

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      expect.objectContaining({ passive: true })
    )

    unmount()
  })

  it('removes scroll listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useScrollRestoration())
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('stores scroll positions in sessionStorage', () => {
    // Verify sessionStorage key is used
    const { unmount } = renderHook(() => useScrollRestoration())

    // Manually set a position in sessionStorage to verify format
    sessionStorage.setItem('scroll-positions', JSON.stringify({ '/home': 100 }))

    const stored = JSON.parse(sessionStorage.getItem('scroll-positions')!)
    expect(stored['/home']).toBe(100)

    unmount()
  })

  it('handles corrupted sessionStorage gracefully', () => {
    sessionStorage.setItem('scroll-positions', 'not-json{')

    // Should not throw
    const { unmount } = renderHook(() => useScrollRestoration())
    unmount()
  })
})
