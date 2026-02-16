import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAutoRetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number) => void
  onMaxRetriesReached?: () => void
}

interface UseAutoRetryReturn {
  retry: () => void
  isRetrying: boolean
  retryCount: number
  countdown: number
  reset: () => void
  cancel: () => void
  hasExhaustedRetries: boolean
}

/**
 * Manages automatic retry logic with exponential backoff.
 * Tracks countdown between retries and exposes manual retry/reset controls.
 * Backs off exponentially: baseDelay × 2^attempt (capped at maxRetries).
 */
export function useAutoRetry(
  retryFn: () => void | Promise<void>,
  shouldRetry: boolean,
  options: UseAutoRetryOptions = {}
): UseAutoRetryReturn {
  const {
    maxRetries = 3,
    baseDelay = 2000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached,
  } = options

  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const hasExhaustedRetries = retryCount >= maxRetries

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    clearTimers()
    setCountdown(0)
    setIsRetrying(false)
  }, [clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    setRetryCount(0)
    setCountdown(0)
    setIsRetrying(false)
  }, [clearTimers])

  const executeRetry = useCallback(
    async (attempt: number) => {
      if (!mountedRef.current) return
      setIsRetrying(true)
      setCountdown(0)
      onRetry?.(attempt)
      try {
        await retryFn()
      } finally {
        if (mountedRef.current) {
          setIsRetrying(false)
        }
      }
    },
    [retryFn, onRetry]
  )

  const scheduleRetry = useCallback(
    (attempt: number) => {
      if (attempt >= maxRetries) {
        onMaxRetriesReached?.()
        return
      }

      const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay)
      const seconds = Math.ceil(delay / 1000)
      setCountdown(seconds)

      // Countdown ticker
      let remaining = seconds
      countdownRef.current = setInterval(() => {
        remaining -= 1
        if (mountedRef.current) {
          setCountdown(Math.max(0, remaining))
        }
        if (remaining <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }, 1000)

      // Actual retry trigger
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setRetryCount((prev) => prev + 1)
          executeRetry(attempt + 1)
        }
      }, delay)
    },
    [maxRetries, baseDelay, backoffMultiplier, maxDelay, onMaxRetriesReached, executeRetry]
  )

  // Manual retry - resets countdown and fires immediately
  const retry = useCallback(() => {
    clearTimers()
    setCountdown(0)
    const nextAttempt = retryCount + 1
    setRetryCount(nextAttempt)
    executeRetry(nextAttempt)
  }, [clearTimers, retryCount, executeRetry])

  // Auto-schedule retry when shouldRetry becomes true
  useEffect(() => {
    if (shouldRetry && !hasExhaustedRetries && !isRetrying) {
      scheduleRetry(retryCount)
    }
    return clearTimers
  }, [shouldRetry, hasExhaustedRetries, isRetrying, retryCount, scheduleRetry, clearTimers])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimers()
    }
  }, [clearTimers])

  return {
    retry,
    isRetrying,
    retryCount,
    countdown,
    reset,
    cancel,
    hasExhaustedRetries,
  }
}
