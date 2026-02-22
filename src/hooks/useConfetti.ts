import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Unified confetti hook — replaces boilerplate useState + setTimeout pattern.
 * Pages still render <LazyConfetti active={active} /> themselves so that
 * existing test mocks (vi.mock('../../components/LazyConfetti')) keep working.
 *
 * @param defaultDuration - auto-dismiss duration in ms (default 3500)
 *
 * @example
 * const { active, fire } = useConfetti()
 * // on success: fire()          → 3500ms
 * // custom:    fire(5000)       → 5000ms
 * // render:    <LazyConfetti active={active} />
 */
export function useConfetti(defaultDuration = 3500) {
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fire = useCallback(
    (duration?: number) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setActive(true)
      timerRef.current = setTimeout(() => setActive(false), duration ?? defaultDuration)
    },
    [defaultDuration]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setActive(false)
  }, [])

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return { active, fire, cancel }
}
