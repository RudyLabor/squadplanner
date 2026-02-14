import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockAnnounce = vi.fn()

vi.mock('../useFocusManagement', () => ({
  useAnnounce: () => mockAnnounce,
}))

import { useA11yAnnouncements } from '../useFocusAdvanced'

describe('useA11yAnnouncements', () => {
  beforeEach(() => {
    mockAnnounce.mockClear()
  })

  it('announceAction calls announce with polite', () => {
    const { result } = renderHook(() => useA11yAnnouncements())

    act(() => {
      result.current.announceAction('Item saved')
    })

    expect(mockAnnounce).toHaveBeenCalledWith('Item saved', 'polite')
  })

  it('announceError calls announce with assertive', () => {
    const { result } = renderHook(() => useA11yAnnouncements())

    act(() => {
      result.current.announceError('Something went wrong')
    })

    expect(mockAnnounce).toHaveBeenCalledWith('Something went wrong', 'assertive')
  })

  it('announceLoading with true sends loading message', () => {
    const { result } = renderHook(() => useA11yAnnouncements())

    act(() => {
      result.current.announceLoading(true)
    })

    expect(mockAnnounce).toHaveBeenCalledWith('Loading...', 'polite')
  })

  it('announceLoading with true and context sends contextual loading message', () => {
    const { result } = renderHook(() => useA11yAnnouncements())

    act(() => {
      result.current.announceLoading(true, 'messages')
    })

    expect(mockAnnounce).toHaveBeenCalledWith('Loading messages...', 'polite')
  })

  it('announceLoading with false sends loaded message', () => {
    const { result } = renderHook(() => useA11yAnnouncements())

    act(() => {
      result.current.announceLoading(false)
    })

    expect(mockAnnounce).toHaveBeenCalledWith('Loaded', 'polite')
  })

  it('announceLoading with false and context sends contextual loaded message', () => {
    const { result } = renderHook(() => useA11yAnnouncements())

    act(() => {
      result.current.announceLoading(false, 'messages')
    })

    expect(mockAnnounce).toHaveBeenCalledWith('messages loaded', 'polite')
  })

  it('announceNavigation sends navigation message', () => {
    const { result } = renderHook(() => useA11yAnnouncements())

    act(() => {
      result.current.announceNavigation('Dashboard')
    })

    expect(mockAnnounce).toHaveBeenCalledWith('Navigated to Dashboard', 'polite')
  })
})
