import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoRetry } from '../useAutoRetry'

describe('useAutoRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns initial state', () => {
    const retryFn = vi.fn()
    const { result } = renderHook(() => useAutoRetry(retryFn, false))
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.countdown).toBe(0)
    expect(result.current.hasExhaustedRetries).toBe(false)
  })

  it('manual retry increments count', () => {
    const retryFn = vi.fn()
    const { result } = renderHook(() => useAutoRetry(retryFn, false))
    act(() => {
      result.current.retry()
    })
    expect(result.current.retryCount).toBe(1)
    expect(retryFn).toHaveBeenCalled()
  })

  it('reset clears all state', () => {
    const retryFn = vi.fn()
    const { result } = renderHook(() => useAutoRetry(retryFn, false))
    act(() => {
      result.current.retry()
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.retryCount).toBe(0)
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.countdown).toBe(0)
  })

  it('hasExhaustedRetries is true after max retries', () => {
    const retryFn = vi.fn()
    const { result } = renderHook(() => useAutoRetry(retryFn, false, { maxRetries: 2 }))
    act(() => {
      result.current.retry()
    })
    act(() => {
      result.current.retry()
    })
    expect(result.current.hasExhaustedRetries).toBe(true)
  })

  it('cancel stops countdown', () => {
    const retryFn = vi.fn()
    const { result } = renderHook(() => useAutoRetry(retryFn, true))
    act(() => {
      result.current.cancel()
    })
    expect(result.current.countdown).toBe(0)
    expect(result.current.isRetrying).toBe(false)
  })

  vi.useRealTimers()
})
