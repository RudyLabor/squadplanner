import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useRateLimitStore } from '../useRateLimit'

describe('useRateLimitStore', () => {
  beforeEach(() => {
    act(() => {
      useRateLimitStore.getState().reset()
    })
  })

  it('starts not rate limited', () => {
    expect(useRateLimitStore.getState().isRateLimited).toBe(false)
  })

  it('defaults retryAfter to 60', () => {
    expect(useRateLimitStore.getState().retryAfter).toBe(60)
  })

  it('triggers rate limit', () => {
    act(() => {
      useRateLimitStore.getState().triggerRateLimit(30)
    })
    expect(useRateLimitStore.getState().isRateLimited).toBe(true)
    expect(useRateLimitStore.getState().retryAfter).toBe(30)
  })

  it('triggers rate limit with default retryAfter', () => {
    act(() => {
      useRateLimitStore.getState().triggerRateLimit()
    })
    expect(useRateLimitStore.getState().isRateLimited).toBe(true)
    expect(useRateLimitStore.getState().retryAfter).toBe(60)
  })

  it('dismisses rate limit', () => {
    act(() => {
      useRateLimitStore.getState().triggerRateLimit(30)
      useRateLimitStore.getState().dismiss()
    })
    expect(useRateLimitStore.getState().isRateLimited).toBe(false)
  })

  it('resets to initial state', () => {
    act(() => {
      useRateLimitStore.getState().triggerRateLimit(120)
      useRateLimitStore.getState().reset()
    })
    expect(useRateLimitStore.getState().isRateLimited).toBe(false)
    expect(useRateLimitStore.getState().retryAfter).toBe(60)
  })
})
