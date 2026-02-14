import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
}))

import {
  useAnnounce,
  useFocusTrap,
  useSkipLink,
  useAutoFocus,
} from '../useFocusManagement'

describe('useAnnounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clean up any leftover aria-live regions
    document.getElementById('aria-live-polite')?.remove()
    document.getElementById('aria-live-assertive')?.remove()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.getElementById('aria-live-polite')?.remove()
    document.getElementById('aria-live-assertive')?.remove()
  })

  it('creates aria-live region and sets message', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('Hello, world!', 'polite')
    })

    const liveRegion = document.getElementById('aria-live-polite')
    expect(liveRegion).not.toBeNull()
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite')
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('true')

    // Message is set after 100ms timeout
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(liveRegion?.textContent).toBe('Hello, world!')
  })

  it('creates assertive aria-live region', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('Error occurred!', 'assertive')
    })

    const liveRegion = document.getElementById('aria-live-assertive')
    expect(liveRegion).not.toBeNull()
    expect(liveRegion?.getAttribute('aria-live')).toBe('assertive')

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(liveRegion?.textContent).toBe('Error occurred!')
  })

  it('reuses existing aria-live region', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('First message', 'polite')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    act(() => {
      result.current('Second message', 'polite')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const regions = document.querySelectorAll('#aria-live-polite')
    expect(regions.length).toBe(1)
    expect(regions[0]?.textContent).toBe('Second message')
  })
})

describe('useFocusTrap', () => {
  it('returns a ref', () => {
    const { result } = renderHook(() => useFocusTrap(false))
    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })

  it('returns a ref when active', () => {
    const { result } = renderHook(() => useFocusTrap(true))
    expect(result.current).toBeDefined()
  })
})

describe('useSkipLink', () => {
  it('returns a function', () => {
    const { result } = renderHook(() => useSkipLink())
    expect(typeof result.current).toBe('function')
  })
})

describe('useAutoFocus', () => {
  it('returns a ref', () => {
    const { result } = renderHook(() => useAutoFocus())
    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })
})
