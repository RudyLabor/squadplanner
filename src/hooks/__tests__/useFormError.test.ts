import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormError } from '../useFormError'

describe('useFormError', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no error', () => {
    const { result } = renderHook(() => useFormError())
    expect(result.current.error).toBeNull()
    expect(result.current.humanMessage).toBeNull()
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.attempt).toBe(0)
    expect(result.current.canRetry).toBe(true)
  })

  it('handleError sets error state', () => {
    const { result } = renderHook(() => useFormError())
    act(() => {
      result.current.handleError(new Error('Something went wrong'))
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toBe('Something went wrong')
  })

  it('handleError converts string to Error', () => {
    const { result } = renderHook(() => useFormError())
    act(() => {
      result.current.handleError('string error')
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toBe('string error')
  })

  it('handleError resets attempt to 0', () => {
    const { result } = renderHook(() => useFormError())
    act(() => {
      result.current.handleError(new Error('fail'))
    })
    expect(result.current.attempt).toBe(0)
  })

  it('humanMessage returns French message for known errors', () => {
    const { result } = renderHook(() => useFormError())
    act(() => {
      result.current.handleError(new Error('Failed to fetch'))
    })
    expect(result.current.humanMessage).toBe('Connexion perdue. On réessaie automatiquement...')
  })

  it('humanMessage returns generic message for unknown errors', () => {
    const { result } = renderHook(() => useFormError())
    act(() => {
      result.current.handleError(new Error('Some random error'))
    })
    expect(result.current.humanMessage).toBe('Une erreur est survenue. Réessaie ou contacte le support.')
  })

  it('clearError resets everything', () => {
    const { result } = renderHook(() => useFormError())
    act(() => {
      result.current.handleError(new Error('fail'))
    })
    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.clearError()
    })
    expect(result.current.error).toBeNull()
    expect(result.current.humanMessage).toBeNull()
    expect(result.current.attempt).toBe(0)
    expect(result.current.isRetrying).toBe(false)
  })

  it('canRetry is true when attempt < maxRetries', () => {
    const { result } = renderHook(() => useFormError({ maxRetries: 3 }))
    expect(result.current.canRetry).toBe(true)
  })

  it('retry succeeds and clears error', async () => {
    const { result } = renderHook(() => useFormError())

    // Set an initial error
    act(() => {
      result.current.handleError(new Error('fail'))
    })
    expect(result.current.error).not.toBeNull()

    // Retry with a succeeding function
    let retryPromise: Promise<void>
    act(() => {
      retryPromise = result.current.retry(async () => {
        // success - do nothing
      })
    })

    // Advance past the exponential backoff delay (1000ms for attempt 0)
    await act(async () => {
      vi.advanceTimersByTime(1100)
      await retryPromise!
    })

    expect(result.current.error).toBeNull()
    expect(result.current.isRetrying).toBe(false)
  })

  it('retry fails and increments attempt', async () => {
    const { result } = renderHook(() => useFormError())

    act(() => {
      result.current.handleError(new Error('initial error'))
    })

    let retryPromise: Promise<void>
    act(() => {
      retryPromise = result.current.retry(async () => {
        throw new Error('still failing')
      })
    })

    await act(async () => {
      vi.advanceTimersByTime(1100)
      await retryPromise!
    })

    expect(result.current.attempt).toBe(1)
    expect(result.current.error!.message).toBe('still failing')
    expect(result.current.isRetrying).toBe(false)
  })

  it('retry does not execute when maxRetries exceeded', async () => {
    const onMaxRetriesExceeded = vi.fn()
    const { result } = renderHook(() =>
      useFormError({ maxRetries: 0, onMaxRetriesExceeded })
    )

    const fn = vi.fn()
    await act(async () => {
      await result.current.retry(fn)
    })

    expect(fn).not.toHaveBeenCalled()
    expect(onMaxRetriesExceeded).toHaveBeenCalledOnce()
  })

  it('defaults maxRetries to 3', () => {
    const { result } = renderHook(() => useFormError())
    expect(result.current.canRetry).toBe(true) // attempt 0 < 3
  })
})
