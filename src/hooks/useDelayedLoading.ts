import { useState, useEffect, useRef } from 'react'

/**
 * Returns `true` only after `isLoading` has been true for at least `delayMs`.
 *
 * This prevents a "flash of spinner" for fast operations: if the async
 * work completes before the delay, the spinner is never shown at all.
 *
 * @param isLoading - Whether the underlying operation is still in progress.
 * @param delayMs   - Minimum time (ms) `isLoading` must be true before
 *                    `showSpinner` becomes true.  Default: 300.
 *
 * @example
 * ```tsx
 * const { showSpinner } = useDelayedLoading(mutation.isPending)
 * return showSpinner ? <Spinner /> : <Button>Save</Button>
 * ```
 */
export function useDelayedLoading(isLoading: boolean, delayMs = 300) {
  const [showSpinner, setShowSpinner] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => setShowSpinner(true), delayMs)
    } else {
      clearTimeout(timerRef.current)
      setShowSpinner(false)
    }

    return () => clearTimeout(timerRef.current)
  }, [isLoading, delayMs])

  return { showSpinner }
}
