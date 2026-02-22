import { useEffect, useRef, useState } from 'react'

/**
 * A thin horizontal progress bar at the top of the page showing scroll progress.
 * Only appears on pages with content taller than 2x viewport.
 * Uses requestAnimationFrame for smooth, performant animation (no React state on every scroll).
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const checkHeight = () => {
      const docHeight = document.documentElement.scrollHeight
      const viewHeight = window.innerHeight
      setVisible(docHeight > viewHeight * 2)
    }

    const updateProgress = () => {
      if (!barRef.current) return
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      barRef.current.style.transform = `scaleX(${progress})`
    }

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateProgress)
    }

    checkHeight()
    updateProgress()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', checkHeight, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', checkHeight)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none"
      role="progressbar"
      aria-label="Scroll progress"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left will-change-transform"
        style={{
          backgroundColor: 'var(--color-primary, #6366f1)',
          transform: 'scaleX(0)',
          transition: 'none',
        }}
      />
    </div>
  )
}
