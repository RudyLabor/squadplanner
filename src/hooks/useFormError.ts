import { useState, useCallback } from 'react'
import { humanizeError, getRetryDelay } from '../lib/errorMessages'

interface UseFormErrorOptions {
  maxRetries?: number
  onMaxRetriesExceeded?: () => void
}

/**
 * Manages form error state with retry logic.
 * Automatically handles exponential backoff for retries.
 */
export function useFormError(options: UseFormErrorOptions = {}) {
  const { maxRetries = 3, onMaxRetriesExceeded } = options
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err : new Error(String(err)))
    setAttempt(0)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setAttempt(0)
    setIsRetrying(false)
  }, [])

  const retry = useCallback(async (fn: () => Promise<void>) => {
    if (attempt >= maxRetries) {
      onMaxRetriesExceeded?.()
      return
    }

    setIsRetrying(true)
    const delay = getRetryDelay(attempt)

    try {
      await new Promise((resolve) => setTimeout(resolve, delay))
      await fn()
      clearError()
    } catch (err) {
      setAttempt((prev) => prev + 1)
      handleError(err)
    } finally {
      setIsRetrying(false)
    }
  }, [attempt, maxRetries, onMaxRetriesExceeded, clearError, handleError])

  return {
    error,
    humanMessage: error ? humanizeError(error) : null,
    handleError,
    clearError,
    retry,
    isRetrying,
    attempt,
    canRetry: attempt < maxRetries,
  }
}
