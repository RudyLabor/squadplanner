import { test, expect, dismissCookieBanner, loginViaUI } from './fixtures'

/**
 * Performance Budget E2E Tests (STRICT MODE)
 *
 * REGLE STRICTE :
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de toBeGreaterThanOrEqual(0)
 * - Chaque metrique DOIT etre measurable — sinon FAIL
 * - Les budgets sont reels : TTFB < 800ms, FCP < 1.8s, LCP < 2.5s, CLS < 0.1
 * - Les bundles DOIVENT respecter les limites de taille
 * - Les images DOIVENT avoir loading="lazy"
 * - Les ressources critiques DOIVENT avoir des preload hints
 */

// ============================================================
// Thresholds — real performance budgets
// ============================================================
const THRESHOLDS = {
  // Navigation timing
  ttfb: 800, // Time to First Byte < 800ms
  pageLoad: 3000, // Full page load < 3s (loadEventEnd - navigationStart)
  domContentLoaded: 3000, // DOM Content Loaded < 3s
  loadComplete: 8000, // Lenient fallback for SSR pages

  // Core Web Vitals
  fcp: 1800, // First Contentful Paint < 1.8s
  lcp: 2500, // Largest Contentful Paint < 2.5s
  cls: 0.1, // Cumulative Layout Shift < 0.1

  // Resource budgets
  maxRequests: 150, // Max total HTTP requests
  maxJsSize: 500_000, // Max JS transfer size (500KB)
  maxCssSize: 150_000, // Max CSS transfer size (150KB)
  maxImageSize: 2_000_000, // Max image transfer size (2MB)
  maxSingleJsFile: 200_000, // Max single JS file (200KB)
  maxSingleImage: 500_000, // Max single image (500KB)
}

// ============================================================
// Helpers — Performance API access
// ============================================================

/** Collect navigation timing metrics via Performance API */
async function getNavigationTiming(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation')
    if (entries.length === 0) return null
    const nav = entries[0] as PerformanceNavigationTiming
    return {
      ttfb: nav.responseStart - nav.requestStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadComplete: nav.loadEventEnd - nav.startTime,
      domInteractive: nav.domInteractive - nav.startTime,
      transferSize: nav.transferSize,
      // loadEventEnd - navigationStart equivalent
      pageLoadTime: nav.loadEventEnd - nav.startTime,
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
    const largeJsFiles: Array<{ name: string; size: number }> = []
    const largeImages: Array<{ name: string; size: number }> = []

    for (const r of resources) {
      const size = r.transferSize || 0
      const fileName = r.name.split('/').pop() || r.name

      if (r.initiatorType === 'script' || r.name.endsWith('.js') || r.name.endsWith('.mjs')) {
        jsSize += size
        jsCount++
        if (size > 200_000) largeJsFiles.push({ name: fileName, size })
      } else if (r.initiatorType === 'css' || r.name.endsWith('.css')) {
        cssSize += size
        cssCount++
      } else if (r.initiatorType === 'img' || /\.(png|jpg|jpeg|webp|avif|svg|gif)/.test(r.name)) {
        imageSize += size
        imageCount++
        if (size > 500_000) largeImages.push({ name: fileName, size })
      }
    }

    return {
      totalRequests: resources.length,
      jsSize,
      cssSize,
      imageSize,
      jsCount,
      cssCount,
      imageCount,
      largeJsFiles,
      largeImages,
    }
  })
}

/** Measure FCP via Performance API paint entries */
async function measureFCP(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const entries = performance.getEntriesByName('first-contentful-paint', 'paint')
    return entries.length > 0 ? entries[0].startTime : -1
  })
}

/** Measure LCP via PerformanceObserver with buffered entries */
async function measureLCP(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let lcpValue = -1
      try {
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
      } catch {
        // PerformanceObserver not supported for LCP
        resolve(-1)
      }
    })
  })
}

// ============================================================
// Landing Page — Navigation Timing (TTFB, Page Load)
// ============================================================
test.describe('Performance - Landing Page Navigation Timing', () => {
  test('Landing page TTFB < 800ms', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const timing = await getNavigationTiming(page)

    // STRICT: Navigation timing MUST be available
    expect(timing, 'Navigation timing DOIT etre disponible sur la landing page').not.toBeNull()

    // STRICT: TTFB (responseStart - requestStart) < 800ms
    expect(
      timing!.ttfb,
      `TTFB DOIT etre < ${THRESHOLDS.ttfb}ms, obtenu: ${timing!.ttfb.toFixed(0)}ms`
    ).toBeLessThan(THRESHOLDS.ttfb)
  })

  test('Landing page load time < 3s (loadEventEnd - navigationStart)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const timing = await getNavigationTiming(page)
    expect(timing, 'Navigation timing DOIT etre disponible').not.toBeNull()

    // STRICT: Full page load < 3s
    expect(
      timing!.pageLoadTime,
      `Page load DOIT etre < ${THRESHOLDS.pageLoad}ms, obtenu: ${timing!.pageLoadTime.toFixed(0)}ms`
    ).toBeLessThan(THRESHOLDS.pageLoad)
  })

  test('Landing page DOMContentLoaded < 3s', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const timing = await getNavigationTiming(page)
    expect(timing, 'Navigation timing DOIT etre disponible').not.toBeNull()

    // STRICT: DOMContentLoaded < 3s
    expect(
      timing!.domContentLoaded,
      `DOMContentLoaded DOIT etre < ${THRESHOLDS.domContentLoaded}ms, obtenu: ${timing!.domContentLoaded.toFixed(0)}ms`
    ).toBeLessThan(THRESHOLDS.domContentLoaded)
  })
})

// ============================================================
// Core Web Vitals — FCP, LCP, CLS
// ============================================================
test.describe('Performance - Core Web Vitals', () => {
  test('Landing page FCP < 1.8s', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForTimeout(1000)

    const fcp = await measureFCP(page)

    // STRICT: FCP MUST be measurable (> 0)
    expect(fcp, 'FCP DOIT etre mesurable (> 0) sur la landing page').toBeGreaterThan(0)

    // STRICT: FCP < 1.8s
    expect(fcp, `FCP DOIT etre < ${THRESHOLDS.fcp}ms, obtenu: ${fcp.toFixed(0)}ms`).toBeLessThan(
      THRESHOLDS.fcp
    )
  })

  test('Auth page FCP < 1.8s', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'load' })
    await page.waitForTimeout(1000)

    const fcp = await measureFCP(page)

    // STRICT: FCP MUST be measurable
    expect(fcp, 'FCP DOIT etre mesurable sur la page auth').toBeGreaterThan(0)

    // STRICT: FCP < 1.8s
    expect(fcp, `FCP DOIT etre < ${THRESHOLDS.fcp}ms, obtenu: ${fcp.toFixed(0)}ms`).toBeLessThan(
      THRESHOLDS.fcp
    )
  })

  test('Landing page LCP < 2.5s', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })

    const lcp = await measureLCP(page)

    // STRICT: LCP MUST be measurable
    expect(lcp, 'LCP DOIT etre mesurable sur la landing page').toBeGreaterThan(0)

    // STRICT: LCP < 2.5s
    expect(lcp, `LCP DOIT etre < ${THRESHOLDS.lcp}ms, obtenu: ${lcp.toFixed(0)}ms`).toBeLessThan(
      THRESHOLDS.lcp
    )
  })

  test('Auth page LCP < 2.5s', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'load' })

    const lcp = await measureLCP(page)

    // STRICT: LCP MUST be measurable
    expect(lcp, 'LCP DOIT etre mesurable sur la page auth').toBeGreaterThan(0)

    // STRICT: LCP < 2.5s
    expect(lcp, `LCP DOIT etre < ${THRESHOLDS.lcp}ms, obtenu: ${lcp.toFixed(0)}ms`).toBeLessThan(
      THRESHOLDS.lcp
    )
  })

  test('Landing page CLS < 0.1', async ({ page }) => {
    // Inject CLS observer BEFORE navigation
    await page.addInitScript(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      ;(window as unknown as { __clsEntries: number }).__clsEntries = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
            ;(window as unknown as { __cls: number }).__cls += (
              entry as unknown as { value: number }
            ).value
            ;(window as unknown as { __clsEntries: number }).__clsEntries++
          }
        }
      })
      observer.observe({ type: 'layout-shift', buffered: true })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)

    // STRICT: CLS MUST be a number
    expect(typeof cls, 'CLS DOIT etre un nombre').toBe('number')

    // STRICT: CLS < 0.1
    expect(cls, `CLS DOIT etre < ${THRESHOLDS.cls}, obtenu: ${cls}`).toBeLessThan(THRESHOLDS.cls)
  })
})

// ============================================================
// Bundle Size — JS, CSS, Image budgets
// ============================================================
test.describe('Performance - Bundle Size Budgets', () => {
  test('Landing page total JS transfer < 500KB', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: Total JS under 500KB
    expect(
      resources.jsSize,
      `Total JS DOIT etre < ${THRESHOLDS.maxJsSize} bytes (${(THRESHOLDS.maxJsSize / 1024).toFixed(0)}KB), obtenu: ${(resources.jsSize / 1024).toFixed(0)}KB`
    ).toBeLessThan(THRESHOLDS.maxJsSize)
  })

  test('Landing page total CSS transfer < 150KB', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: Total CSS under 150KB
    expect(
      resources.cssSize,
      `Total CSS DOIT etre < ${THRESHOLDS.maxCssSize} bytes (${(THRESHOLDS.maxCssSize / 1024).toFixed(0)}KB), obtenu: ${(resources.cssSize / 1024).toFixed(0)}KB`
    ).toBeLessThan(THRESHOLDS.maxCssSize)
  })

  test('Landing page total image payload < 2MB', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: Total image size under 2MB
    expect(
      resources.imageSize,
      `Total images DOIT etre < ${THRESHOLDS.maxImageSize} bytes (${(THRESHOLDS.maxImageSize / (1024 * 1024)).toFixed(0)}MB), obtenu: ${(resources.imageSize / 1024).toFixed(0)}KB`
    ).toBeLessThan(THRESHOLDS.maxImageSize)
  })

  test('No single JS file exceeds 200KB', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: No oversized JS files
    expect(
      resources.largeJsFiles,
      `Aucun fichier JS ne DOIT depasser ${THRESHOLDS.maxSingleJsFile / 1024}KB. Fichiers trop gros: ${JSON.stringify(resources.largeJsFiles)}`
    ).toEqual([])
  })

  test('No single image exceeds 500KB', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: No oversized images
    expect(
      resources.largeImages,
      `Aucune image ne DOIT depasser ${THRESHOLDS.maxSingleImage / 1024}KB. Images trop grosses: ${JSON.stringify(resources.largeImages)}`
    ).toEqual([])
  })

  test('Total HTTP requests < 150 on landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const resources = await getResourceMetrics(page)

    // STRICT: Total requests under budget
    expect(
      resources.totalRequests,
      `Total requetes DOIT etre < ${THRESHOLDS.maxRequests}, obtenu: ${resources.totalRequests}`
    ).toBeLessThan(THRESHOLDS.maxRequests)
  })
})

// ============================================================
// Image Optimization — lazy loading
// ============================================================
test.describe('Performance - Image Lazy Loading', () => {
  test('Below-the-fold images have loading="lazy" on landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await dismissCookieBanner(page)

    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs.map((img) => ({
        src: img.src || img.getAttribute('data-src') || '',
        loading: img.getAttribute('loading'),
        isAboveFold: img.getBoundingClientRect().top < window.innerHeight,
        alt: img.alt || '',
      }))
    })

    // STRICT: Filter below-the-fold images (not visible in initial viewport)
    const belowFoldImages = images.filter((img) => !img.isAboveFold && img.src)

    if (belowFoldImages.length > 0) {
      const missingLazy = belowFoldImages.filter((img) => img.loading !== 'lazy')
      // STRICT: All below-the-fold images MUST have loading="lazy"
      expect(
        missingLazy,
        `Toutes les images sous le fold DOIVENT avoir loading="lazy". Manquants: ${JSON.stringify(missingLazy.map((i) => i.src.split('/').pop()))}`
      ).toEqual([])
    }
  })

  test('Images use modern formats (webp, avif, or svg)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const imageFormats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return resources
        .filter(
          (r) => r.initiatorType === 'img' || /\.(png|jpg|jpeg|webp|avif|svg|gif)/.test(r.name)
        )
        .map((r) => {
          const name = r.name.split('/').pop() || r.name
          const ext = name.split('.').pop()?.toLowerCase() || 'unknown'
          return { name, ext, size: r.transferSize }
        })
    })

    // Count legacy format images (jpg, png, gif) that are large enough to matter (> 10KB)
    const legacyLargeImages = imageFormats.filter(
      (img) => ['jpg', 'jpeg', 'png', 'gif'].includes(img.ext) && img.size > 10_000
    )

    // STRICT: No large legacy format images (should use webp/avif)
    expect(
      legacyLargeImages.length,
      `Les images > 10KB DOIVENT utiliser des formats modernes (webp/avif). Format legacy: ${JSON.stringify(legacyLargeImages.map((i) => `${i.name} (${(i.size / 1024).toFixed(0)}KB)`))}`
    ).toBe(0)
  })
})

// ============================================================
// Critical Resource Preloading
// ============================================================
test.describe('Performance - Critical Resource Hints', () => {
  test('Landing page has preload hints for critical resources', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const preloadLinks = await page.evaluate(() => {
      const links = Array.from(
        document.querySelectorAll('link[rel="preload"], link[rel="modulepreload"]')
      )
      return links.map((link) => ({
        href: link.getAttribute('href') || '',
        as: link.getAttribute('as') || '',
        rel: link.getAttribute('rel') || '',
      }))
    })

    // STRICT: At least one preload/modulepreload hint MUST exist for JS or CSS
    expect(
      preloadLinks.length,
      'La landing page DOIT avoir au moins un preload hint (link rel="preload" ou rel="modulepreload")'
    ).toBeGreaterThan(0)
  })

  test('Landing page has font preconnect or preload hints', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const fontHints = await page.evaluate(() => {
      const preconnects = Array.from(document.querySelectorAll('link[rel="preconnect"]'))
      const fontPreloads = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]'))
      return {
        preconnectCount: preconnects.length,
        fontPreloadCount: fontPreloads.length,
        preconnectHrefs: preconnects.map((l) => l.getAttribute('href')),
      }
    })

    // STRICT: Should have either preconnect or font preload
    const totalHints = fontHints.preconnectCount + fontHints.fontPreloadCount
    expect(
      totalHints,
      'La page DOIT avoir des preconnect ou preload hints pour les fonts'
    ).toBeGreaterThan(0)
  })
})

// ============================================================
// Protected Pages — Load Time
// ============================================================
const protectedPages = [
  { name: 'Home', path: '/home' },
  { name: 'Squads', path: '/squads' },
  { name: 'Messages', path: '/messages' },
  { name: 'Settings', path: '/settings' },
]

test.describe('Performance - Protected Pages Load Time', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} page loads within budget after auth`, async ({ page }) => {
      await loginViaUI(page)

      // Navigate and measure wall-clock load time
      const start = Date.now()
      await page.goto(path, { waitUntil: 'networkidle' })
      const loadTime = Date.now() - start

      // STRICT: Protected pages must load within 8s (SSR + data fetching)
      expect(
        loadTime,
        `${name} page DOIT charger en < ${THRESHOLDS.loadComplete}ms, obtenu: ${loadTime}ms`
      ).toBeLessThan(THRESHOLDS.loadComplete)

      // STRICT: Resource count check
      const resources = await getResourceMetrics(page)
      expect(
        resources.totalRequests,
        `${name}: total requetes DOIT etre < ${THRESHOLDS.maxRequests}`
      ).toBeLessThan(THRESHOLDS.maxRequests)

      // STRICT: JS size check
      expect(
        resources.jsSize,
        `${name}: total JS DOIT etre < ${THRESHOLDS.maxJsSize / 1024}KB`
      ).toBeLessThan(THRESHOLDS.maxJsSize)
    })
  }
})

// ============================================================
// Console Errors — No critical errors on public pages
// ============================================================
test.describe('Performance - Console Error Budget', () => {
  test('No critical console errors on public pages', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    const publicPages = ['/', '/auth', '/premium']
    for (const path of publicPages) {
      await page.goto(path, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
    }

    // Filter known non-critical third-party errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('analytics') &&
        !e.includes('gtag') &&
        !e.includes('401') &&
        !e.includes('ERR_BLOCKED_BY_CLIENT')
    )

    // STRICT: No critical console errors
    expect(
      criticalErrors,
      `Aucune erreur critique dans la console. Erreurs trouvees: ${JSON.stringify(criticalErrors)}`
    ).toEqual([])
  })
})
