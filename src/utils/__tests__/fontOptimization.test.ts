/**
 * Tests for src/utils/fontOptimization.ts
 * Covers: initFontOptimization
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { initFontOptimization } from '../fontOptimization'

describe('fontOptimization', () => {
  let addClassSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Clear any previously added class
    document.documentElement.classList.remove('fonts-loaded')
    addClassSpy = vi.spyOn(document.documentElement.classList, 'add')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should export initFontOptimization as a function', () => {
    expect(typeof initFontOptimization).toBe('function')
  })

  it('should not throw when called', () => {
    expect(() => initFontOptimization()).not.toThrow()
  })

  it('should add fonts-loaded class when Font Loading API is available', async () => {
    // jsdom provides document.fonts with a ready promise
    // Mock document.fonts to control behavior
    const mockFonts = {
      ready: Promise.resolve(),
      check: vi.fn().mockReturnValue(true),
      load: vi.fn().mockResolvedValue([]),
    }

    Object.defineProperty(document, 'fonts', {
      value: mockFonts,
      writable: true,
      configurable: true,
    })

    initFontOptimization()

    // Wait for the async fonts.ready to resolve
    await mockFonts.ready
    // Wait for microtask queue to flush
    await new Promise((r) => setTimeout(r, 0))

    expect(addClassSpy).toHaveBeenCalledWith('fonts-loaded')
  })

  it('should check if Inter font is loaded', async () => {
    const checkSpy = vi.fn().mockReturnValue(true)
    const mockFonts = {
      ready: Promise.resolve(),
      check: checkSpy,
      load: vi.fn().mockResolvedValue([]),
    }

    Object.defineProperty(document, 'fonts', {
      value: mockFonts,
      writable: true,
      configurable: true,
    })

    initFontOptimization()
    await mockFonts.ready
    await new Promise((r) => setTimeout(r, 0))

    expect(checkSpy).toHaveBeenCalledWith('16px Inter')
  })

  it('should load font families via document.fonts.load', async () => {
    const loadSpy = vi.fn().mockResolvedValue([])
    const mockFonts = {
      ready: Promise.resolve(),
      check: vi.fn().mockReturnValue(true),
      load: loadSpy,
    }

    Object.defineProperty(document, 'fonts', {
      value: mockFonts,
      writable: true,
      configurable: true,
    })

    initFontOptimization()
    await mockFonts.ready
    await new Promise((r) => setTimeout(r, 0))

    expect(loadSpy).toHaveBeenCalledWith('16px "Inter"')
    expect(loadSpy).toHaveBeenCalledWith('16px "Space Grotesk"')
  })

  it('should handle font load failures gracefully', async () => {
    const mockFonts = {
      ready: Promise.resolve(),
      check: vi.fn().mockReturnValue(false),
      load: vi.fn().mockRejectedValue(new Error('Font not found')),
    }

    Object.defineProperty(document, 'fonts', {
      value: mockFonts,
      writable: true,
      configurable: true,
    })

    expect(() => initFontOptimization()).not.toThrow()

    await mockFonts.ready
    await new Promise((r) => setTimeout(r, 50))
    // Should not throw even if font load rejects
  })

  it('should fallback with setTimeout when Font Loading API is absent', () => {
    vi.useFakeTimers()

    // Remove the fonts property
    const originalFonts = document.fonts
    Object.defineProperty(document, 'fonts', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    // Also need to make 'fonts' in document return false
    const descriptor = Object.getOwnPropertyDescriptor(document, 'fonts')
    delete (document as any).fonts

    initFontOptimization()

    expect(addClassSpy).not.toHaveBeenCalled()

    // Advance past the 1000ms fallback
    vi.advanceTimersByTime(1001)

    expect(addClassSpy).toHaveBeenCalledWith('fonts-loaded')

    // Restore
    Object.defineProperty(document, 'fonts', {
      value: originalFonts,
      writable: true,
      configurable: true,
    })
    vi.useRealTimers()
  })
})
