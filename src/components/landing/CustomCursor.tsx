import { useEffect, useState } from 'react'
import { m, useMotionValue, useSpring } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const TRAIL_COUNT = 5

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const reducedMotion = useReducedMotion()

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  // Main cursor with responsive spring
  const springX = useSpring(cursorX, { stiffness: 500, damping: 28 })
  const springY = useSpring(cursorY, { stiffness: 500, damping: 28 })

  // Trail dots with progressively softer springs
  const trail = Array.from({ length: TRAIL_COUNT }, (_, i) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    x: useSpring(cursorX, { stiffness: 350 - i * 55, damping: 28 + i * 3 }),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    y: useSpring(cursorY, { stiffness: 350 - i * 55, damping: 28 + i * 3 }),
    opacity: 1 - (i / TRAIL_COUNT) * 0.75,
    scale: 1 - (i / TRAIL_COUNT) * 0.6,
  }))

  useEffect(() => {
    // Check support: no touch, no reduced motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch || reducedMotion) return

    setIsSupported(true)

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [cursorX, cursorY, isVisible, reducedMotion])

  if (!isSupported) return null

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.2s' }}
    >
      {/* Trail dots */}
      {trail.map((dot, i) => (
        <m.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary-bg"
          style={{
            x: dot.x,
            y: dot.y,
            opacity: dot.opacity,
            scale: dot.scale,
            translateX: '-50%',
            translateY: '-50%',
          }}
        />
      ))}
      {/* Main cursor */}
      <m.div
        className="absolute w-4 h-4 rounded-full border-2 border-primary bg-primary/15"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </div>
  )
}
