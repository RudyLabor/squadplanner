import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardVisible } from '../useKeyboardVisible'

describe('useKeyboardVisible', () => {
  const originalUserAgent = navigator.userAgent

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
  })

  it('returns false by default on desktop', () => {
    const { result } = renderHook(() => useKeyboardVisible())
    expect(result.current).toBe(false)
  })

  it('returns false on mobile without visualViewport', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'iPhone',
      configurable: true,
    })
    const { result } = renderHook(() => useKeyboardVisible())
    expect(result.current).toBe(false)
  })
})
