import { describe, it, expect, vi, beforeEach } from 'vitest'
import { colorMix, colorMixBlend } from '../colorMix'

// Reset the internal _supported cache between tests
function resetSupportCache() {
  // Force re-evaluation by clearing the module-level cache
  // We do this by manipulating CSS.supports mock
}

describe('colorMix', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Reset module to clear _supported cache
    vi.resetModules()
  })

  describe('when color-mix() is supported', () => {
    beforeEach(() => {
      vi.stubGlobal('CSS', { supports: vi.fn().mockReturnValue(true) })
    })

    it('returns color-mix() expression with transparent', async () => {
      const { colorMix } = await import('../colorMix')
      expect(colorMix('red', 50)).toBe('color-mix(in srgb, red 50%, transparent)')
    })

    it('works with CSS variables', async () => {
      const { colorMix } = await import('../colorMix')
      expect(colorMix('var(--color-gold)', 80)).toBe(
        'color-mix(in srgb, var(--color-gold) 80%, transparent)'
      )
    })

    it('ignores fallback when supported', async () => {
      const { colorMix } = await import('../colorMix')
      expect(colorMix('red', 50, 'rgba(255,0,0,0.5)')).toBe(
        'color-mix(in srgb, red 50%, transparent)'
      )
    })

    it('supports 0% opacity', async () => {
      const { colorMix } = await import('../colorMix')
      expect(colorMix('blue', 0)).toBe('color-mix(in srgb, blue 0%, transparent)')
    })

    it('supports 100% opacity', async () => {
      const { colorMix } = await import('../colorMix')
      expect(colorMix('blue', 100)).toBe('color-mix(in srgb, blue 100%, transparent)')
    })
  })

  describe('when color-mix() is NOT supported', () => {
    beforeEach(() => {
      vi.stubGlobal('CSS', { supports: vi.fn().mockReturnValue(false) })
    })

    it('returns fallback when provided', async () => {
      const { colorMix } = await import('../colorMix')
      expect(colorMix('red', 50, 'rgba(255,0,0,0.5)')).toBe('rgba(255,0,0,0.5)')
    })

    it('returns the original color when no fallback', async () => {
      const { colorMix } = await import('../colorMix')
      expect(colorMix('red', 50)).toBe('red')
    })
  })

  describe('SSR (no window/CSS)', () => {
    it('assumes support in SSR and returns color-mix()', async () => {
      // In SSR (typeof window === "undefined"), it assumes modern browser
      vi.stubGlobal('CSS', undefined)
      const { colorMix } = await import('../colorMix')
      expect(colorMix('red', 50)).toBe('color-mix(in srgb, red 50%, transparent)')
    })
  })
})

describe('colorMixBlend', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  describe('when color-mix() is supported', () => {
    beforeEach(() => {
      vi.stubGlobal('CSS', { supports: vi.fn().mockReturnValue(true) })
    })

    it('blends two colors at given percentage', async () => {
      const { colorMixBlend } = await import('../colorMix')
      expect(colorMixBlend('red', 60, 'blue')).toBe('color-mix(in srgb, red 60%, blue)')
    })

    it('works with CSS variables', async () => {
      const { colorMixBlend } = await import('../colorMix')
      expect(colorMixBlend('var(--primary)', 50, 'var(--secondary)')).toBe(
        'color-mix(in srgb, var(--primary) 50%, var(--secondary))'
      )
    })

    it('ignores fallback when supported', async () => {
      const { colorMixBlend } = await import('../colorMix')
      expect(colorMixBlend('red', 50, 'blue', 'purple')).toBe('color-mix(in srgb, red 50%, blue)')
    })
  })

  describe('when color-mix() is NOT supported', () => {
    beforeEach(() => {
      vi.stubGlobal('CSS', { supports: vi.fn().mockReturnValue(false) })
    })

    it('returns fallback when provided', async () => {
      const { colorMixBlend } = await import('../colorMix')
      expect(colorMixBlend('red', 50, 'blue', 'purple')).toBe('purple')
    })

    it('returns color1 when no fallback', async () => {
      const { colorMixBlend } = await import('../colorMix')
      expect(colorMixBlend('red', 50, 'blue')).toBe('red')
    })
  })
})
