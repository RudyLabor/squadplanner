import { test, expect, dismissCookieBanner, loginViaUI } from './fixtures'

/**
 * STRICT MODE — Performance Regression Tests
 *
 * Measures real performance metrics (TTFB, FCP, LCP, CLS) and enforces
 * hard budgets. No soft assertions, no fallbacks, no toBeGreaterThanOrEqual(0).
 *
 * Rules enforced:
 * - Import from ./fixtures (test, expect)
 * - No .catch(() => false)
 * - No early returns without assertions
 * - No toBeGreaterThanOrEqual(0) — real performance budgets only
 * - No if (metric !== null) skipping — metric MUST exist
 * - // STRICT: before every critical assertion
 */

// Performance thresholds — real budgets, not rubber stamps
const THRESHOLDS = {
  // Navigation timing
  ttfb: 800,              // Time to First Byte < 800ms
  domContentLoaded: 3000, // DOM Content Loaded < 3s
  loadComplete: 8000,     // Full page load < 8s

  // Resource budgets
  maxRequests: 80,         // Max total HTTP requests
  maxJsSize: 500_000,     // Max JS transfer size (500KB)
  maxCssSize: 150_000,    // Max CSS transfer size (150KB)
  maxImageSize: 2_000_000, // Max image transfer size (2MB)
  maxSingleJsFile: 200_000, // Max single JS file (200KB)
  maxSingleImage: 500_000,  // Max single image (500KB)

  // Core Web Vitals
  fcp: 2000,  // First Contentful Paint < 2s
  lcp: 4000,  // Largest Contentful Paint < 4s
  cls: 0.1,   // Cumulative Layout Shift < 0.1
}

/** Collect navigation timing metrics from the Performance API */
async function getNavigationTiming(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!nav) return null
    return {
      ttfb: nav.responseStart - nav.requestStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadComplete: nav.loadEventEnd - nav.startTime,
      domInteractive: nav.domInteractive - nav.startTime,
      transferSize: nav.transferSize,
    }
  })
}

/** Collect resource metrics from Performance API */
async function getResourceMetrics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    let jsSize = 0
    let cssSize = 0
    let imageSize = 0
    let jsCount = 0
    let cssCount = 0
    let imageCount = 0

    for (const r of resources) {
      const size = r.transferSize || 0
      if (r.initiatorType === 'script' || r.name.endsWith('.js') || r.name.endsWith('.mjs')) {
        jsSize += size
        jsCount++
      } else if (r.initiatorType === 'css' || r.name.endsWith('.css')) {
        cssSize += size
        cssCount++
      } else if (r.initiatorType === 'img' || /\.(png|jpg|jpeg|webp|avif|svg|gif)/.test(r.name)) {
        imageSize += size
        imageCount++
      }
    }

    return { totalRequests: resources.length, jsSize, cssSize, imageSize, jsCount, cssCount, imageCount }
  })
}

/** Measure FCP via Performance API paint entries */
async function measureFCP(page: import('@playwright/test').Page): Promise<number> {
  const fcp = await page.evaluate(() => {
    const entries = performance.getEntriesByName('first-contentful-paint', 'paint')
    return entries.length > 0 ? entries[0].startTime : -1
  })
  return fcp
}

/** Measure LCP via PerformanceObserver with buffered entries */
async function measureLCP(page: import('@playwright/test').Page): Promise<number> {
  const lcp = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let lcpValue = -1
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          lcpValue = entries[entries.length - 1].startTime
        }
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      // Give LCP time to finalize
      setTimeout(() => {
        observer.disconnect()
        resolve(lcpValue)
      }, 3000)
    })
  })
  return lcp
}

/** Get list of oversized JS files */
async function getLargeScripts(page: import('@playwright/test').Page, threshold: number) {
  return page.evaluate((maxSize) => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return resources
      .filter((r) => r.initiatorType === 'script' || r.name.endsWith('.js'))
      .filter((r) => (r.transferSize || 0) > maxSize)
      .map((r) => ({ name: r.name.split('/').pop(), size: r.transferSize }))
  }, threshold)
}

/** Get list of oversized images */
async function getLargeImages(page: import('@playwright/test').Page, threshold: number) {
  return page.evaluate((maxSize) => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return resources
      .filter((r) => r.initiatorType === 'img' || /\.(png|jpg|jpeg|webp|avif|svg|gif)/.test(r.name))
      .filter((r) => (r.transferSize || 0) > maxSize)
      .map((r) => ({ name: r.name.split('/').pop(), size: r.transferSize }))
  }, threshold)
}

// ============================================================
// Public Pages — Navigation Timing
// ============================================================

const publicPages = [
  { name: 'Landing', path: '/' },
  { name: 'Auth', path: '/auth' },
  { name: 'Premium', path: '/premium' },
]

test.describe('Performance - Public Pages Navigation Timing', () => {
  for (const { name, path } of publicPages) {
    test(`${name} page — TTFB, DOMContentLoaded, load within budget`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' })
      await page.waitForTimeout(1000)

      const timing = await getNavigationTiming(page)

      // STRICT: navigation timing MUST be available
      expect(timing, `Navigation timing not available for ${name}`).not.toBeNull()

      // STRICT: TTFB must be under 800ms
      expect(timing!.ttfb).toBeLessThan(THRESHOLDS.ttfb)

      // STRICT: DOM Content Loaded must be under 3s
      expect(timing!.domContentLoaded).toBeLessThan(THRESHOLDS.domContentLoaded)

      // STRICT: full load must be under 8s
      expect(timing!.loadComplete).toBeLessThan(THRESHOLDS.loadComplete)
    })

    test(`${name} page — resource budgets within limits`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' })

      const resources = await getResourceMetrics(page)

      // STRICT: total requests under budget
      expect(resources.totalRequests).toBeLessThan(THRESHOLDS.maxRequests)

      // STRICT: JS bundle size under budget
      expect(resources.jsSize).toBeLessThan(THRESHOLDS.maxJsSize)

      // STRICT: CSS size under budget
      expect(resources.cssSize).toBeLessThan(THRESHOLDS.maxCssSize)
    })

    test(`${name} page — FCP within budget`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' })
      await page.waitForTimeout(1000)

      const fcp = await measureFCP(page)

      // STRICT: FCP must be available (not -1) for SSR pages
      expect(fcp, `FCP not available for ${name} page`).toBeGreaterThan(0)

      // STRICT: FCP must be under 2s
      expect(fcp).toBeLessThan(THRESHOLDS.fcp)
    })
  }
})

// ============================================================
// Protected Pages — Load Time & Resource Budgets
// ============================================================

const protectedPages = [
  { name: 'Home', path: '/home' },
  { name: 'Squads', path: '/squads' },
  { name: 'Messages', path: '/messages' },
  { name: 'Settings', path: '/settings' },
]

test.describe('Performance - Protected Pages Load Time', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} page — load time within budget`, async ({ page }) => {
      await loginViaUI(page)

      // Navigate and measure wall-clock load time
      const start = Date.now()
      await page.goto(path, { waitUntil: 'networkidle' })
      const loadTime = Date.now() - start

      // STRICT: protected pages must load within 8s (SSR + data fetching)
      expect(loadTime).toBeLessThan(THRESHOLDS.loadComplete)

      // STRICT: resource count check
      const resources = await getResourceMetrics(page)
      expect(resources.totalRequests).toBeLessThan(THRESHOLDS.maxRequests)

      // STRICT: JS size check
      expect(resources.jsSize).toBeLessThan(THRESHOLDS.maxJsSize)
    })
  }
})

// ============================================================
// Core Web Vitals — LCP, CLS
// ============================================================

test.describe('Performance - Core Web Vitals', () => {
  test('Landing page LCP within budget', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })

    const lcp = await measureLCP(page)

    // STRICT: LCP must be measurable
    expect(lcp, 'LCP not available for landing page').toBeGreaterThan(0)

    // STRICT: LCP must be under 4s
    expect(lcp).toBeLessThan(THRESHOLDS.lcp)
  })

  test('Auth page LCP within budget', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'load' })

    const lcp = await measureLCP(page)

    // STRICT: LCP must be measurable
    expect(lcp, 'LCP not available for auth page').toBeGreaterThan(0)

    // STRICT: LCP must be under 4s
    expect(lcp).toBeLessThan(THRESHOLDS.lcp)
  })

  test('Landing page CLS within budget', async ({ page }) => {
    // Inject CLS observer before navigation
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
            (window as unknown as { __cls: number }).__cls += (entry as unknown as { value: number }).value
          }
        }
      })
      observer.observe({ type: 'layout-shift', buffered: true })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)

    // STRICT: CLS must be a number (observer worked)
    expect(typeof cls).toBe('number')

    // STRICT: CLS must be under 0.1 (good threshold per Web Vitals)
    expect(cls).toBeLessThan(THRESHOLDS.cls)
  })

  test('No critical console errors on public pages', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    for (const { path } of publicPages) {
      await page.goto(path, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
    }

    // Filter known non-critical third-party errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('gtag')
    )

    // STRICT: no critical console errors
    expect(criticalErrors).toEqual([])
  })
})

// ============================================================
// Bundle Size Regression
// ============================================================

test.describe('Performance - Bundle Size Regression', () => {
  test('Total JS bundle under 500KB on landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: total JS under 500KB
    expect(resources.jsSize).toBeLessThan(THRESHOLDS.maxJsSize)
  })

  test('No single JS file exceeds 200KB', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const largeScripts = await getLargeScripts(page, THRESHOLDS.maxSingleJsFile)

    // STRICT: no oversized JS files
    expect(largeScripts).toEqual([])
  })

  test('Images are optimized — no single image > 500KB', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const largeImages = await getLargeImages(page, THRESHOLDS.maxSingleImage)

    // STRICT: no oversized images
    expect(largeImages).toEqual([])
  })

  test('Total image payload under 2MB on landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: total image size under 2MB
    expect(resources.imageSize).toBeLessThan(THRESHOLDS.maxImageSize)
  })
})
