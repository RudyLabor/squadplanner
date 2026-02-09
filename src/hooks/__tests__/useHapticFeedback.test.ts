import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock haptics module before importing the hook
vi.mock('../../utils/haptics', () => ({
  haptic: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    selection: vi.fn(),
    notification: vi.fn(),
    achievement: vi.fn(),
    levelUp: vi.fn(),
  },
  getHapticEnabled: vi.fn(() => true),
  setHapticEnabled: vi.fn(),
  isHapticSupported: vi.fn(() => true),
}))

import { useHapticFeedback } from '../useHapticFeedback'
import { haptic } from '../../utils/haptics'

describe('useHapticFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns enabled status', () => {
    const { result } = renderHook(() => useHapticFeedback())
    expect(result.current.isEnabled).toBe(true)
  })

  it('returns supported status', () => {
    const { result } = renderHook(() => useHapticFeedback())
    expect(result.current.isSupported).toBe(true)
  })

  it('triggers haptic feedback', () => {
    const { result } = renderHook(() => useHapticFeedback())
    act(() => {
      result.current.triggerHaptic('light')
    })
    expect(haptic.light).toHaveBeenCalled()
  })

  it('triggers medium haptic', () => {
    const { result } = renderHook(() => useHapticFeedback())
    act(() => {
      result.current.triggerHaptic('medium')
    })
    expect(haptic.medium).toHaveBeenCalled()
  })

  it('toggles haptic preference', () => {
    const { result } = renderHook(() => useHapticFeedback())
    act(() => {
      result.current.toggleHaptic()
    })
    expect(result.current.isEnabled).toBe(false)
  })

  it('sets haptic preference', () => {
    const { result } = renderHook(() => useHapticFeedback())
    act(() => {
      result.current.setHaptic(false)
    })
    expect(result.current.isEnabled).toBe(false)
  })
})
