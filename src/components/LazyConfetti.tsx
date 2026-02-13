
import { useEffect, useRef } from 'react'

interface LazyConfettiProps {
  /** If true, the confetti fires. Treated as "active" trigger. */
  active?: boolean
  /** Number of particles (maps to particleCount). Default 100. */
  numberOfPieces?: number
  /** Gravity factor (canvas-confetti uses 1 = normal). Default 0.25. */
  gravity?: number
  /** Spread angle in degrees. Default 70. */
  spread?: number
  /** Array of color strings. */
  colors?: string[]
  /** If true, confetti keeps firing. If false, one-shot. Default false. */
  recycle?: boolean
  /** Ignored (compat with old react-confetti API). */
  width?: number
  /** Ignored (compat with old react-confetti API). */
  height?: number
  /** Ignored (compat with old react-confetti API). */
  style?: React.CSSProperties
}

export default function LazyConfetti({
  active = true,
  numberOfPieces = 100,
  gravity = 0.25,
  spread = 70,
  colors,
  recycle = false,
}: LazyConfettiProps) {
  const hasFired = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active) {
      hasFired.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Avoid double-fire in strict mode for one-shot
    if (!recycle && hasFired.current) return
    hasFired.current = true

    const fire = async () => {
      const { default: confetti } = await import('canvas-confetti')
      confetti({
        particleCount: numberOfPieces,
        spread,
        gravity,
        origin: { y: 0.6 },
        ...(colors ? { colors } : {}),
      })
    }

    fire()

    if (recycle) {
      intervalRef.current = setInterval(fire, 2500)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [active, numberOfPieces, gravity, spread, colors, recycle])

  return null
}

// Re-export for convenience
export { LazyConfetti }
export type { LazyConfettiProps }
