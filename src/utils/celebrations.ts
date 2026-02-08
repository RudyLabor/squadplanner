import confetti from 'canvas-confetti'

/**
 * V3 - Enhanced celebration presets with physics-based particles
 * Uses canvas-confetti for all celebrations (consistent API)
 */

// Respect reduced motion preference
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Custom ribbon shape via shapeFromPath
const ribbonShape = confetti.shapeFromPath('M0,0 C5,8 10,-8 15,0 C20,8 25,-8 30,0')

/**
 * Level Up celebration - 5 phase spectacular
 */
export function celebrateLevelUp(colors: string[]) {
  if (prefersReducedMotion()) return

  const allColors = [...colors, '#ffffff', '#f5a623', '#4ade80']

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

/**
 * Milestone celebration - dramatic burst + sustained shower
 */
export function celebrateMilestone(colors: string[] = ['#6366f1', '#34d399', '#f5a623']) {
  if (prefersReducedMotion()) return

  // Big initial burst
  confetti({
    particleCount: 200,
    spread: 180,
    startVelocity: 45,
    origin: { y: 0.55 },
    colors,
    gravity: 0.6,
    drift: 0.5,
    ticks: 250,
    shapes: ['star', 'circle', ribbonShape],
    scalar: 1.5,
  })

  // Sustained shower
  let count = 0
  const maxCount = 4
  const interval = setInterval(() => {
    if (count >= maxCount) {
      clearInterval(interval)
      return
    }
    confetti({
      particleCount: 20,
      spread: 100,
      startVelocity: 20,
      origin: { x: 0.2 + Math.random() * 0.6, y: -0.1 },
      colors,
      gravity: 0.4,
      drift: (Math.random() - 0.5) * 2,
      ticks: 250,
    })
    count++
  }, 300)
}

/**
 * Achievement celebration - compact satisfying burst
 */
export function celebrateAchievement(color: string = '#a78bfa') {
  if (prefersReducedMotion()) return

  confetti({
    particleCount: 60,
    spread: 80,
    startVelocity: 25,
    origin: { y: 0.7 },
    colors: [color, '#ffffff', '#fbbf24'],
    shapes: ['star', 'circle'],
    scalar: 1.3,
    gravity: 0.6,
    ticks: 180,
  })
}

/**
 * RSVP confirmed - mini pop
 */
export function celebrateRSVP() {
  if (prefersReducedMotion()) return

  confetti({
    particleCount: 30,
    spread: 50,
    startVelocity: 22,
    origin: { y: 0.65, x: 0.5 },
    colors: ['#34d399', '#4ade80', '#ffffff'],
    gravity: 0.7,
    ticks: 120,
    scalar: 0.9,
  })
}

/**
 * Squad created - side cannons
 */
export function celebrateSquadCreated() {
  if (prefersReducedMotion()) return

  // Left cannon
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    startVelocity: 35,
    origin: { x: 0, y: 0.6 },
    colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#ffffff'],
    gravity: 0.7,
    ticks: 180,
  })

  // Right cannon (slight delay)
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      startVelocity: 35,
      origin: { x: 1, y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#ffffff'],
      gravity: 0.7,
      ticks: 180,
    })
  }, 150)
}
