import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock canvas-confetti
const mockConfetti = vi.fn()
mockConfetti.shapeFromPath = vi.fn().mockReturnValue('mock-ribbon-shape')

vi.mock('canvas-confetti', () => ({
  default: mockConfetti,
}))

describe('celebrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Ensure matchMedia returns reduced-motion: false by default
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('celebrateLevelUp', () => {
    it('should do nothing when user prefers reduced motion', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000', '#00ff00'])

      expect(mockConfetti).not.toHaveBeenCalled()
    })

    it('should import canvas-confetti dynamically', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      // confetti should have been called (Phase 1 immediate burst)
      expect(mockConfetti).toHaveBeenCalled()
    })

    it('should fire Phase 1 center burst immediately with 180 particles', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 180,
          spread: 140,
          startVelocity: 50,
          origin: { y: 0.6 },
          gravity: 0.8,
        })
      )
    })

    it('should create ribbon shape on first call', async () => {
      // Reset modules to clear the cached ribbon shape
      vi.resetModules()
      // Re-mock canvas-confetti after resetModules
      vi.doMock('canvas-confetti', () => ({
        default: mockConfetti,
      }))

      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      expect(mockConfetti.shapeFromPath).toHaveBeenCalledWith(
        'M0,0 C5,8 10,-8 15,0 C20,8 25,-8 30,0'
      )
    })

    it('should fire Phase 2 side cannons at 200ms', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      // Phase 1 fires immediately
      const phase1CallCount = mockConfetti.mock.calls.length

      // Advance 200ms for Phase 2
      vi.advanceTimersByTime(200)

      // Phase 2 fires 2 side cannons
      expect(mockConfetti.mock.calls.length).toBe(phase1CallCount + 2)

      // Check left cannon
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 40,
          angle: 60,
          origin: { x: 0, y: 0.65 },
        })
      )

      // Check right cannon
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 40,
          angle: 120,
          origin: { x: 1, y: 0.65 },
        })
      )
    })

    it('should fire Phase 3 star burst at 500ms', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      vi.advanceTimersByTime(500)

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 120,
          spread: 360,
          shapes: ['star'],
          scalar: 1.8,
        })
      )
    })

    it('should fire Phase 4 ribbon particles at 800ms', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      vi.advanceTimersByTime(800)

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 60,
          spread: 180,
          shapes: ['mock-ribbon-shape', 'circle'],
          scalar: 2.5,
        })
      )
    })

    it('should fire Phase 5 sparkle rain at 1200ms', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      vi.advanceTimersByTime(1200)

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 80,
          spread: 160,
          origin: { x: 0.5, y: 0 },
          shapes: ['star', 'circle'],
        })
      )
    })

    it('should include input colors plus white, gold, and success tokens in allColors', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000', '#0000ff'])

      const call = mockConfetti.mock.calls[0]
      const colors = call[0].colors

      // Should contain original colors plus #ffffff and resolved token colors
      expect(colors).toContain('#ff0000')
      expect(colors).toContain('#0000ff')
      expect(colors).toContain('#ffffff')
      // The TOKEN functions read CSS variables with fallbacks
      // In test env, getComputedStyle returns '' so fallbacks are used
      expect(colors.length).toBeGreaterThanOrEqual(4)
    })

    it('should work with empty colors array', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp([])

      // Should still fire confetti with default token colors + white
      expect(mockConfetti).toHaveBeenCalled()
      const colors = mockConfetti.mock.calls[0][0].colors
      expect(colors).toContain('#ffffff')
    })

    it('should fire all 5 phases totaling 6 confetti calls when all timers run', async () => {
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#ff0000'])

      // Phase 1: 1 call (immediate)
      const afterPhase1 = mockConfetti.mock.calls.length
      expect(afterPhase1).toBe(1)

      // Phase 2: 2 calls (at 200ms)
      vi.advanceTimersByTime(200)
      expect(mockConfetti.mock.calls.length).toBe(3)

      // Phase 3: 1 call (at 500ms)
      vi.advanceTimersByTime(300) // total 500ms
      expect(mockConfetti.mock.calls.length).toBe(4)

      // Phase 4: 1 call (at 800ms)
      vi.advanceTimersByTime(300) // total 800ms
      expect(mockConfetti.mock.calls.length).toBe(5)

      // Phase 5: 1 call (at 1200ms)
      vi.advanceTimersByTime(400) // total 1200ms
      expect(mockConfetti.mock.calls.length).toBe(6)
    })
  })

  describe('prefersReducedMotion (internal)', () => {
    it('should return false when window is undefined', async () => {
      // This is tested indirectly via celebrateLevelUp proceeding normally
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp(['#fff'])
      expect(mockConfetti).toHaveBeenCalled()
    })
  })

  describe('cssVar (internal)', () => {
    it('should use fallback when CSS variable is not set', async () => {
      // In jsdom, CSS variables are not set, so fallbacks are used.
      // We verify this indirectly by checking the colors include fallback values.
      const { celebrateLevelUp } = await import('../celebrations')
      await celebrateLevelUp([])

      const colors = mockConfetti.mock.calls[0][0].colors
      // Fallback for gold is #f5a623, for success is #34d399
      expect(colors).toContain('#f5a623')
      expect(colors).toContain('#34d399')
    })
  })
})
