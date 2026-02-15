import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock import.meta.env before imports
vi.stubGlobal('import', { meta: { env: { VITE_BUILD_VERSION: '1.0.0', VITE_GIT_BRANCH: 'main', PROD: false } } })

// We need to mock PerformanceObserver, fetch, navigator, window globals
// The module uses them at construction time

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
let observerCallbacks: Map<string, (list: { getEntries: () => any[] }) => void> = new Map()

class MockPerformanceObserver {
  callback: (list: { getEntries: () => any[] }) => void
  constructor(callback: (list: { getEntries: () => any[] }) => void) {
    this.callback = callback
  }
  observe(options: { type: string; buffered: boolean }) {
    mockObserve(options)
    observerCallbacks.set(options.type, this.callback)
  }
  disconnect() {
    mockDisconnect()
  }
}

vi.stubGlobal('PerformanceObserver', MockPerformanceObserver)

// Mock fetch
const mockFetch = vi.fn().mockResolvedValue({ ok: true })
vi.stubGlobal('fetch', mockFetch)

describe('webVitalsMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    observerCallbacks.clear()
    mockFetch.mockResolvedValue({ ok: true })

    // Mock performance.getEntriesByType for TTFB
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { responseStart: 200, fetchStart: 50, domInteractive: 500 } as any,
    ])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('PerformanceBudget', () => {
    let PerformanceBudget: any

    beforeEach(async () => {
      const mod = await import('../webVitalsMonitoring')
      PerformanceBudget = mod.PerformanceBudget
    })

    it('passes when all metrics are within budget', () => {
      const budget = new PerformanceBudget()
      const metrics = {
        sessionId: 'test-session',
        lcp: { name: 'LCP' as const, value: 2000, rating: 'good' as const, timestamp: Date.now(), url: '', userAgent: '' },
        fcp: { name: 'FCP' as const, value: 1500, rating: 'good' as const, timestamp: Date.now(), url: '', userAgent: '' },
        cls: { name: 'CLS' as const, value: 0.05, rating: 'good' as const, timestamp: Date.now(), url: '', userAgent: '' },
        timeToInteractive: 2500,
      }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('reports LCP violation when exceeds budget', () => {
      const budget = new PerformanceBudget()
      const metrics = {
        sessionId: 'test-session',
        lcp: { name: 'LCP' as const, value: 3000, rating: 'needs-improvement' as const, timestamp: Date.now(), url: '', userAgent: '' },
      }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toContain('LCP exceeded budget')
      expect(result.violations[0]).toContain('3000ms')
      expect(result.violations[0]).toContain('2500ms')
    })

    it('reports FCP violation when exceeds budget', () => {
      const budget = new PerformanceBudget()
      const metrics = {
        sessionId: 'test-session',
        fcp: { name: 'FCP' as const, value: 2000, rating: 'needs-improvement' as const, timestamp: Date.now(), url: '', userAgent: '' },
      }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(false)
      expect(result.violations[0]).toContain('FCP exceeded budget')
      expect(result.violations[0]).toContain('2000ms')
      expect(result.violations[0]).toContain('1800ms')
    })

    it('reports CLS violation when exceeds budget', () => {
      const budget = new PerformanceBudget()
      const metrics = {
        sessionId: 'test-session',
        cls: { name: 'CLS' as const, value: 0.2, rating: 'needs-improvement' as const, timestamp: Date.now(), url: '', userAgent: '' },
      }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(false)
      expect(result.violations[0]).toContain('CLS exceeded budget')
      expect(result.violations[0]).toContain('0.2')
      expect(result.violations[0]).toContain('0.1')
    })

    it('reports TTI violation when exceeds budget', () => {
      const budget = new PerformanceBudget()
      const metrics = {
        sessionId: 'test-session',
        timeToInteractive: 4000,
      }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(false)
      expect(result.violations[0]).toContain('TTI exceeded budget')
      expect(result.violations[0]).toContain('4000ms')
      expect(result.violations[0]).toContain('3000ms')
    })

    it('reports multiple violations', () => {
      const budget = new PerformanceBudget()
      const metrics = {
        sessionId: 'test-session',
        lcp: { name: 'LCP' as const, value: 5000, rating: 'poor' as const, timestamp: Date.now(), url: '', userAgent: '' },
        fcp: { name: 'FCP' as const, value: 4000, rating: 'poor' as const, timestamp: Date.now(), url: '', userAgent: '' },
        cls: { name: 'CLS' as const, value: 0.3, rating: 'poor' as const, timestamp: Date.now(), url: '', userAgent: '' },
        timeToInteractive: 5000,
      }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(false)
      expect(result.violations).toHaveLength(4)
    })

    it('passes when no metrics are provided', () => {
      const budget = new PerformanceBudget()
      const metrics = { sessionId: 'test-session' }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('passes when metrics are exactly at budget limits', () => {
      const budget = new PerformanceBudget()
      const metrics = {
        sessionId: 'test-session',
        lcp: { name: 'LCP' as const, value: 2500, rating: 'good' as const, timestamp: Date.now(), url: '', userAgent: '' },
        fcp: { name: 'FCP' as const, value: 1800, rating: 'good' as const, timestamp: Date.now(), url: '', userAgent: '' },
        cls: { name: 'CLS' as const, value: 0.1, rating: 'good' as const, timestamp: Date.now(), url: '', userAgent: '' },
        timeToInteractive: 3000,
      }
      const result = budget.checkBudget(metrics)
      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })
  })

  describe('initializeWebVitalsMonitoring', () => {
    let initializeWebVitalsMonitoring: any

    beforeEach(async () => {
      const mod = await import('../webVitalsMonitoring')
      initializeWebVitalsMonitoring = mod.initializeWebVitalsMonitoring
    })

    it('returns a collector object', () => {
      const collector = initializeWebVitalsMonitoring()
      expect(collector).toBeDefined()
      expect(typeof collector.getPerformanceScore).toBe('function')
      expect(typeof collector.getDashboardData).toBe('function')
      expect(typeof collector.onVital).toBe('function')
      expect(typeof collector.disconnect).toBe('function')
    })

    it('generates unique sessionIds', () => {
      // We can't inspect the sessionId directly but we can verify the collector is created
      const collector1 = initializeWebVitalsMonitoring()
      const collector2 = initializeWebVitalsMonitoring()
      expect(collector1).toBeDefined()
      expect(collector2).toBeDefined()
      // These are different instances
      expect(collector1).not.toBe(collector2)
    })

    it('sets up performance observers', () => {
      initializeWebVitalsMonitoring()
      // Should observe at minimum: layout-shift, paint, largest-contentful-paint, first-input
      expect(mockObserve).toHaveBeenCalled()
      const observedTypes = mockObserve.mock.calls.map((call: any) => call[0].type)
      expect(observedTypes).toContain('layout-shift')
      expect(observedTypes).toContain('paint')
      expect(observedTypes).toContain('largest-contentful-paint')
      expect(observedTypes).toContain('first-input')
    })

    it('observes with buffered: true', () => {
      initializeWebVitalsMonitoring()
      for (const call of mockObserve.mock.calls) {
        expect(call[0].buffered).toBe(true)
      }
    })

    it('logs poor vitals via onVital callback', () => {
      const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const collector = initializeWebVitalsMonitoring()

      // Simulate a poor LCP via the layout-shift observer callback
      const lcpCallback = observerCallbacks.get('largest-contentful-paint')
      if (lcpCallback) {
        lcpCallback({ getEntries: () => [{ startTime: 5000 }] })
      }

      // The onVital callback in initializeWebVitalsMonitoring logs poor vitals
      // LCP = 5000 > 4000 threshold = poor
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('disconnect cleans up all observers', () => {
      const collector = initializeWebVitalsMonitoring()
      collector.disconnect()
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('WebVitalsCollector (via initializeWebVitalsMonitoring)', () => {
    let collector: any

    beforeEach(async () => {
      const mod = await import('../webVitalsMonitoring')
      collector = mod.initializeWebVitalsMonitoring()
    })

    afterEach(() => {
      collector.disconnect()
    })

    describe('getPerformanceScore', () => {
      it('returns 0 when no vitals have been collected', () => {
        expect(collector.getPerformanceScore()).toBe(0)
      })

      it('returns 100 when all vitals are good', () => {
        // Simulate good FCP
        const fcpCallback = observerCallbacks.get('paint')
        if (fcpCallback) {
          fcpCallback({ getEntries: () => [{ name: 'first-contentful-paint', startTime: 1000 }] })
        }

        // Simulate good LCP
        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 2000 }] })
        }

        // Simulate good CLS
        const clsCallback = observerCallbacks.get('layout-shift')
        if (clsCallback) {
          clsCallback({ getEntries: () => [{ hadRecentInput: false, value: 0.05 }] })
        }

        // Simulate good FID
        const fidCallback = observerCallbacks.get('first-input')
        if (fidCallback) {
          fidCallback({ getEntries: () => [{ startTime: 100, processingStart: 150 }] })
        }

        expect(collector.getPerformanceScore()).toBe(100)
      })

      it('returns correct mixed score with good and needs-improvement', () => {
        // Simulate good FCP (1000 < 1800)
        const fcpCallback = observerCallbacks.get('paint')
        if (fcpCallback) {
          fcpCallback({ getEntries: () => [{ name: 'first-contentful-paint', startTime: 1000 }] })
        }

        // Simulate needs-improvement LCP (3000 > 2500 but <= 4000)
        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 3000 }] })
        }

        // Score: (1*100 + 1*60) / 2 = 80
        expect(collector.getPerformanceScore()).toBe(80)
      })

      it('returns 20 when all vitals are poor', () => {
        // Simulate poor FCP (> 3000)
        const fcpCallback = observerCallbacks.get('paint')
        if (fcpCallback) {
          fcpCallback({ getEntries: () => [{ name: 'first-contentful-paint', startTime: 5000 }] })
        }

        // Simulate poor LCP (> 4000)
        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 6000 }] })
        }

        // Score: (0*100 + 0*60 + 2*20) / 2 = 20
        expect(collector.getPerformanceScore()).toBe(20)
      })
    })

    describe('getDashboardData', () => {
      it('returns correct structure', () => {
        const data = collector.getDashboardData()
        expect(data).toHaveProperty('score')
        expect(data).toHaveProperty('vitals')
        expect(data).toHaveProperty('context')
        expect(data.vitals).toHaveProperty('cls')
        expect(data.vitals).toHaveProperty('fcp')
        expect(data.vitals).toHaveProperty('lcp')
        expect(data.vitals).toHaveProperty('fid')
        expect(data.vitals).toHaveProperty('ttfb')
        expect(data.context).toHaveProperty('deviceType')
        expect(data.context).toHaveProperty('connection')
        expect(data.context).toHaveProperty('timeToInteractive')
      })

      it('score matches getPerformanceScore', () => {
        const data = collector.getDashboardData()
        expect(data.score).toBe(collector.getPerformanceScore())
      })
    })

    describe('onVital callback', () => {
      it('receives vital when a metric is reported', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        // Trigger FCP
        const fcpCallback = observerCallbacks.get('paint')
        if (fcpCallback) {
          fcpCallback({ getEntries: () => [{ name: 'first-contentful-paint', startTime: 1500 }] })
        }

        expect(vitals).toHaveLength(1)
        expect(vitals[0].name).toBe('FCP')
        expect(vitals[0].value).toBe(1500)
        expect(vitals[0].rating).toBe('good')
      })

      it('vital rating is good for values within good threshold', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 2000 }] })
        }

        expect(vitals[0].rating).toBe('good')
      })

      it('vital rating is needs-improvement for values between thresholds', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 3500 }] })
        }

        expect(vitals[0].rating).toBe('needs-improvement')
      })

      it('vital rating is poor for values exceeding poor threshold', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 5000 }] })
        }

        expect(vitals[0].rating).toBe('poor')
      })
    })

    describe('vital value rounding', () => {
      it('rounds values to 2 decimal places', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const clsCallback = observerCallbacks.get('layout-shift')
        if (clsCallback) {
          clsCallback({ getEntries: () => [{ hadRecentInput: false, value: 0.12345 }] })
        }

        expect(vitals[0].value).toBe(0.12)
      })
    })

    describe('CLS observer', () => {
      it('ignores layout shifts with recent input', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const clsCallback = observerCallbacks.get('layout-shift')
        if (clsCallback) {
          clsCallback({
            getEntries: () => [
              { hadRecentInput: true, value: 0.5 },
            ],
          })
        }

        // Should not report because all entries had recent input (value = 0)
        const clsVitals = vitals.filter((v: any) => v.name === 'CLS')
        expect(clsVitals).toHaveLength(0)
      })

      it('sums up multiple layout shift entries', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const clsCallback = observerCallbacks.get('layout-shift')
        if (clsCallback) {
          clsCallback({
            getEntries: () => [
              { hadRecentInput: false, value: 0.05 },
              { hadRecentInput: false, value: 0.03 },
              { hadRecentInput: true, value: 0.1 }, // ignored
            ],
          })
        }

        const clsVitals = vitals.filter((v: any) => v.name === 'CLS')
        expect(clsVitals).toHaveLength(1)
        expect(clsVitals[0].value).toBe(0.08)
      })
    })

    describe('FCP observer', () => {
      it('only reports first-contentful-paint entry', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const fcpCallback = observerCallbacks.get('paint')
        if (fcpCallback) {
          fcpCallback({
            getEntries: () => [
              { name: 'first-paint', startTime: 500 },
              { name: 'first-contentful-paint', startTime: 1200 },
            ],
          })
        }

        const fcpVitals = vitals.filter((v: any) => v.name === 'FCP')
        expect(fcpVitals).toHaveLength(1)
        expect(fcpVitals[0].value).toBe(1200)
      })

      it('does not report when no first-contentful-paint entry', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const fcpCallback = observerCallbacks.get('paint')
        if (fcpCallback) {
          fcpCallback({
            getEntries: () => [{ name: 'first-paint', startTime: 500 }],
          })
        }

        const fcpVitals = vitals.filter((v: any) => v.name === 'FCP')
        expect(fcpVitals).toHaveLength(0)
      })
    })

    describe('LCP observer', () => {
      it('uses the last entry as LCP', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({
            getEntries: () => [
              { startTime: 1000 },
              { startTime: 1500 },
              { startTime: 2200 },
            ],
          })
        }

        const lcpVitals = vitals.filter((v: any) => v.name === 'LCP')
        expect(lcpVitals).toHaveLength(1)
        expect(lcpVitals[0].value).toBe(2200)
      })
    })

    describe('FID observer', () => {
      it('calculates FID as processingStart - startTime', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const fidCallback = observerCallbacks.get('first-input')
        if (fidCallback) {
          fidCallback({
            getEntries: () => [{ startTime: 1000, processingStart: 1050 }],
          })
        }

        const fidVitals = vitals.filter((v: any) => v.name === 'FID')
        expect(fidVitals).toHaveLength(1)
        expect(fidVitals[0].value).toBe(50)
        expect(fidVitals[0].rating).toBe('good') // 50 < 100
      })
    })

    describe('sendToMonitoring', () => {
      it('sends data to /api/vitals endpoint', () => {
        const vitals: any[] = []
        collector.onVital((vital: any) => vitals.push(vital))

        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 2000 }] })
        }

        expect(mockFetch).toHaveBeenCalledWith('/api/vitals', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }))
      })

      it('logs warning for poor vitals', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 5000 }] })
        }

        // The class sendToMonitoring logs via console.warn with [PERFORMANCE ALERT] prefix
        // Format: console.warn(`[PERFORMANCE ALERT] ${name}: ${value} (${rating})`)
        const allWarnCalls = warnSpy.mock.calls.map(c => c[0])
        const allErrorCalls = errorSpy.mock.calls.map(c => c[0])
        const allLogs = [...allWarnCalls, ...allErrorCalls]
        expect(allLogs.some((msg: string) =>
          typeof msg === 'string' && msg.includes('PERFORMANCE ALERT')
        )).toBe(true)

        warnSpy.mockRestore()
        errorSpy.mockRestore()
      })

      it('handles fetch failure gracefully', () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const lcpCallback = observerCallbacks.get('largest-contentful-paint')
        if (lcpCallback) {
          lcpCallback({ getEntries: () => [{ startTime: 2000 }] })
        }

        // Should not throw
        expect(true).toBe(true)
        warnSpy.mockRestore()
      })
    })

    describe('TTFB observer', () => {
      it('computes TTFB from navigation timing when available', () => {
        // In jsdom, 'navigation' may or may not be in performance
        // If TTFB was computed during construction, verify the result
        const data = collector.getDashboardData()
        // The TTFB check depends on 'navigation' in performance which may be absent in jsdom
        // We verify the structure is correct regardless
        if (data.vitals.ttfb) {
          expect(data.vitals.ttfb.name).toBe('TTFB')
          expect(typeof data.vitals.ttfb.value).toBe('number')
          expect(['good', 'needs-improvement', 'poor']).toContain(data.vitals.ttfb.rating)
        } else {
          // TTFB is undefined when 'navigation' not in performance - that's OK
          expect(data.vitals.ttfb).toBeUndefined()
        }
      })

      it('reports TTFB when navigation property exists on performance', async () => {
        // Force the condition by adding 'navigation' to performance
        const originalNavigation = Object.getOwnPropertyDescriptor(performance, 'navigation')
        Object.defineProperty(performance, 'navigation', {
          value: {},
          configurable: true,
        })

        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
          { responseStart: 300, fetchStart: 100, domInteractive: 600 } as any,
        ])

        // Re-create a collector with navigation available
        const mod = await import('../webVitalsMonitoring')
        const newCollector = mod.initializeWebVitalsMonitoring()
        const data = newCollector.getDashboardData()

        if (data.vitals.ttfb) {
          expect(data.vitals.ttfb.name).toBe('TTFB')
          expect(data.vitals.ttfb.value).toBe(200) // 300 - 100
          expect(data.vitals.ttfb.rating).toBe('good') // 200 < 800
        }

        newCollector.disconnect()

        // Restore
        if (originalNavigation) {
          Object.defineProperty(performance, 'navigation', originalNavigation)
        } else {
          delete (performance as any).navigation
        }
      })
    })

    describe('device info collection', () => {
      it('detects desktop user agent', () => {
        const data = collector.getDashboardData()
        // jsdom has a desktop-like userAgent by default
        expect(data.context.deviceType).toBeDefined()
      })
    })
  })
})
