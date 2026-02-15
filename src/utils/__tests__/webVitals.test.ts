import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to control import.meta.env for the module under test
// The module uses import.meta.env.DEV and import.meta.env.VITE_SUPABASE_URL

describe('webVitals', () => {
  let reportWebVitals: () => void

  // Mock web-vitals module
  const mockOnLCP = vi.fn()
  const mockOnCLS = vi.fn()
  const mockOnINP = vi.fn()
  const mockOnTTFB = vi.fn()
  const mockOnFCP = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('web-vitals', () => ({
      onLCP: mockOnLCP,
      onCLS: mockOnCLS,
      onINP: mockOnINP,
      onTTFB: mockOnTTFB,
      onFCP: mockOnFCP,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should do nothing when window is undefined', async () => {
    const origWindow = globalThis.window
    // @ts-expect-error - testing server environment
    delete globalThis.window

    const mod = await import('../webVitals')
    mod.reportWebVitals()

    // web-vitals should not be imported
    expect(mockOnLCP).not.toHaveBeenCalled()
    globalThis.window = origWindow
  })

  it('should register all 5 web vital handlers when window exists', async () => {
    // Make sure we are in DEV mode (default in tests) so no flush schedule
    const mod = await import('../webVitals')
    mod.reportWebVitals()

    // Wait for dynamic import promise
    await vi.dynamicImportSettled?.()
    // Fallback: give the import promise time to resolve
    await new Promise((r) => setTimeout(r, 10))

    expect(mockOnLCP).toHaveBeenCalledTimes(1)
    expect(mockOnCLS).toHaveBeenCalledTimes(1)
    expect(mockOnINP).toHaveBeenCalledTimes(1)
    expect(mockOnTTFB).toHaveBeenCalledTimes(1)
    expect(mockOnFCP).toHaveBeenCalledTimes(1)
  })

  it('should pass handleMetric as callback to each web vital function', async () => {
    const mod = await import('../webVitals')
    mod.reportWebVitals()

    await new Promise((r) => setTimeout(r, 10))

    // Each function should receive a single callback argument (handleMetric)
    const handler = mockOnLCP.mock.calls[0]?.[0]
    expect(typeof handler).toBe('function')

    // All handlers should receive the same function
    expect(mockOnCLS.mock.calls[0]?.[0]).toBe(handler)
    expect(mockOnINP.mock.calls[0]?.[0]).toBe(handler)
    expect(mockOnTTFB.mock.calls[0]?.[0]).toBe(handler)
    expect(mockOnFCP.mock.calls[0]?.[0]).toBe(handler)
  })

  describe('handleMetric in DEV mode', () => {
    it('should log good metric in green', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mod = await import('../webVitals')
      mod.reportWebVitals()
      await new Promise((r) => setTimeout(r, 10))

      const handler = mockOnLCP.mock.calls[0]?.[0]
      handler({ name: 'LCP', value: 2500, rating: 'good' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WebVital] LCP: 2500ms (good)'),
        expect.stringContaining('#0cce6b')
      )
    })

    it('should log needs-improvement metric in orange', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mod = await import('../webVitals')
      mod.reportWebVitals()
      await new Promise((r) => setTimeout(r, 10))

      const handler = mockOnLCP.mock.calls[0]?.[0]
      handler({ name: 'FCP', value: 1800, rating: 'needs-improvement' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('#ffa400')
      )
    })

    it('should log poor metric in red', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mod = await import('../webVitals')
      mod.reportWebVitals()
      await new Promise((r) => setTimeout(r, 10))

      const handler = mockOnLCP.mock.calls[0]?.[0]
      handler({ name: 'TTFB', value: 5000, rating: 'poor' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('#ff4e42')
      )
    })

    it('should format CLS with 3 decimal places', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mod = await import('../webVitals')
      mod.reportWebVitals()
      await new Promise((r) => setTimeout(r, 10))

      const handler = mockOnCLS.mock.calls[0]?.[0]
      handler({ name: 'CLS', value: 0.125, rating: 'good' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('0.125ms'),
        expect.anything()
      )
    })

    it('should format non-CLS metrics with 0 decimal places', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mod = await import('../webVitals')
      mod.reportWebVitals()
      await new Promise((r) => setTimeout(r, 10))

      const handler = mockOnLCP.mock.calls[0]?.[0]
      handler({ name: 'LCP', value: 2500.456, rating: 'good' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('LCP: 2500ms'),
        expect.anything()
      )
    })
  })
})
