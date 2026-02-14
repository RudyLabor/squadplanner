/**
 * V3 - Enhanced celebration presets with physics-based particles
 * Uses canvas-confetti for all celebrations (consistent API)
 * canvas-confetti is dynamically imported to reduce initial bundle size.
 */

// Respect reduced motion preference
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Read a CSS custom property value from the document root.
 * Falls back to the provided default if the variable is not set or
 * we are running outside a browser context.
 */
function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/**
 * Design-token colour helpers for canvas-based APIs (confetti).
 * CSS variables cannot be used directly as canvas paint values, so we
 * resolve them at call-time via getComputedStyle.
 */
const TOKEN = {
  success: () => cssVar('--color-success', '#34d399'),
  gold: () => cssVar('--color-gold', '#f5a623'),
} as const

// Cached ribbon shape (created on first use)
type ConfettiShape = import('canvas-confetti').Shape
let ribbonShapeCache: ConfettiShape | null = null

/**
 * Level Up celebration - 5 phase spectacular
 */
export async function celebrateLevelUp(colors: string[]) {
  if (prefersReducedMotion()) return

  const { default: confetti } = await import('canvas-confetti')

  // Create ribbon shape on first use
  if (!ribbonShapeCache) {
    ribbonShapeCache = confetti.shapeFromPath('M0,0 C5,8 10,-8 15,0 C20,8 25,-8 30,0')
  }
  const ribbonShape = ribbonShapeCache

  const allColors = [...colors, '#ffffff', TOKEN.gold(), TOKEN.success()]

  // Phase 1 (0ms): Big center burst with arc
  confetti({
    particleCount: 180,
    spread: 140,
    startVelocity: 50,
    origin: { y: 0.6 },
    colors: allColors,
    gravity: 0.8,
    drift: 0.3,
    ticks: 250,
  })

  // Phase 2 (200ms): Side cannons
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 60,
      startVelocity: 40,
      origin: { x: 0, y: 0.65 },
      colors: allColors,
      gravity: 0.7,
      drift: 0.5,
      ticks: 200,
    })
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 60,
      startVelocity: 40,
      origin: { x: 1, y: 0.65 },
      colors: allColors,
      gravity: 0.7,
      drift: -0.5,
      ticks: 200,
    })
  }, 200)

  // Phase 3 (500ms): Star burst from center
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 360,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.5 },
      colors: allColors,
      shapes: ['star'],
      scalar: 1.8,
      gravity: 0.3,
      ticks: 200,
    })
  }, 500)

  // Phase 4 (800ms): Ribbon-like drifting particles
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 180,
      startVelocity: 25,
      origin: { x: 0.5, y: 0.3 },
      colors: allColors,
      shapes: [ribbonShape, 'circle'],
      scalar: 2.5,
      gravity: 0.15,
      drift: 1.5,
      ticks: 350,
    })
  }, 800)

  // Phase 5 (1200ms): Final sparkle rain
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 160,
      startVelocity: 15,
      origin: { x: 0.5, y: 0 },
      colors: allColors,
      shapes: ['star', 'circle'],
      scalar: 1.2,
      gravity: 0.5,
      drift: 0.8,
      ticks: 300,
    })
  }, 1200)
}
