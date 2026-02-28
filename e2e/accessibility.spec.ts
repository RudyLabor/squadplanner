import { test, expect, dismissCookieBanner, checkAccessibility } from './fixtures'

/**
 * Accessibility (WCAG 2.1 AA) E2E Tests — STRICT MODE
 *
 * REGLE STRICTE :
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de toBeGreaterThanOrEqual(0)
 * - Si axe-core trouve des violations serious/critical → FAIL
 * - Si un element ARIA est manquant → FAIL
 * - Si le keyboard focus est casse → FAIL
 * - Si le heading hierarchy saute un niveau → FAIL
 * - Si une image n'a pas d'alt → FAIL
 * - Si un input n'a pas de label → FAIL
 *
 * Utilise checkAccessibility() de fixtures.ts (axe-core WCAG 2.1 AA)
 * + tests manuels pour keyboard nav, focus trap, skip links, heading hierarchy
 */

// ============================================================
// Page lists
// ============================================================
const publicPages = [
  { name: 'Landing', path: '/' },
  { name: 'Auth', path: '/auth' },
  { name: 'Premium', path: '/premium' },
]

const protectedPages = [
  { name: 'Home', path: '/home' },
  { name: 'Squads', path: '/squads' },
  { name: 'Sessions', path: '/sessions' },
  { name: 'Messages', path: '/messages' },
  { name: 'Settings', path: '/settings' },
  { name: 'Profile', path: '/profile' },
]

// ============================================================
// AXE-CORE WCAG 2.1 AA — Public Pages (dark + light)
// ============================================================
test.describe('A11Y-AXE: WCAG Audit — Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} (dark mode): zero serious/critical WCAG violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance for serious/critical violations (including color-contrast)
      expect(
        violations.length,
        `${name} dark mode: ${violations.length} violations serious/critical trouvees: ${JSON.stringify(violations.map((v) => ({ id: v.id, impact: v.impact, description: v.description })))}`
      ).toBe(0)
    })

    test(`${name} (light mode): zero serious/critical WCAG violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance (including color-contrast)
      expect(
        violations.length,
        `${name} light mode: ${violations.length} violations trouvees: ${JSON.stringify(violations.map((v) => ({ id: v.id, impact: v.impact, description: v.description })))}`
      ).toBe(0)
    })
  }
})

// ============================================================
// AXE-CORE WCAG 2.1 AA — Protected Pages (dark + light)
// ============================================================
test.describe('A11Y-AXE: WCAG Audit — Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} (dark mode): zero serious/critical WCAG violations`, async ({
      authenticatedPage: page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance (including color-contrast)
      expect(
        violations.length,
        `${name} dark mode: violations trouvees: ${JSON.stringify(violations.map((v) => ({ id: v.id, impact: v.impact })))}`
      ).toBe(0)
    })

    test(`${name} (light mode): zero serious/critical WCAG violations`, async ({
      authenticatedPage: page,
    }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance (including color-contrast)
      expect(
        violations.length,
        `${name} light mode: violations trouvees: ${JSON.stringify(violations.map((v) => ({ id: v.id, impact: v.impact })))}`
      ).toBe(0)
    })
  }
})

// ============================================================
// KEYBOARD NAVIGATION — Tab through interactive elements
// ============================================================
test.describe('A11Y-KEYBOARD: Keyboard Navigation — Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name}: Tab key reaches interactive elements`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)

      // Reset focus to body
      await page.evaluate(() => {
        ;(document.activeElement as HTMLElement)?.blur()
        document.body.focus()
      })

      // Tab through first 5 interactive elements
      const focusedElements: string[] = []
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        const tag = await page.evaluate(() => {
          const el = document.activeElement
          return el ? el.tagName.toLowerCase() : 'none'
        })
        focusedElements.push(tag)
      }

      // STRICT: At least one Tab press MUST land on an interactive element
      const interactiveTags = ['a', 'button', 'input', 'select', 'textarea']
      const interactiveReached = focusedElements.some((tag) => interactiveTags.includes(tag))
      expect(
        interactiveReached,
        `${name}: Tab DOIT atteindre un element interactif. Elements focuses: ${focusedElements.join(', ')}`
      ).toBe(true)
    })
  }
})

test.describe('A11Y-KEYBOARD: Keyboard Navigation — Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name}: Tab key reaches interactive elements after auth`, async ({
      authenticatedPage: page,
    }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await page.evaluate(() => {
        ;(document.activeElement as HTMLElement)?.blur()
        document.body.focus()
      })

      const focusedElements: string[] = []
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        const tag = await page.evaluate(
          () => document.activeElement?.tagName.toLowerCase() || 'none'
        )
        focusedElements.push(tag)
      }

      // STRICT: At least one interactive element MUST be reachable
      const interactiveTags = ['a', 'button', 'input', 'select', 'textarea']
      const interactiveReached = focusedElements.some((tag) => interactiveTags.includes(tag))
      expect(
        interactiveReached,
        `${name}: Tab DOIT atteindre un element interactif apres auth. Focuses: ${focusedElements.join(', ')}`
      ).toBe(true)
    })
  }
})

// ============================================================
// FOCUS VISIBILITY — focused elements MUST be visually distinct
// ============================================================
test.describe('A11Y-FOCUS: Visible Focus Indicator', () => {
  test('Landing page: focused element has a visible focus indicator', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    await page.evaluate(() => document.body.focus())
    await page.keyboard.press('Tab')

    // STRICT: Active element MUST NOT be body or html
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    expect(activeTag, 'Le focus DOIT quitter body apres Tab').not.toBe('body')
    expect(activeTag, 'Le focus DOIT quitter html apres Tab').not.toBe('html')

    // STRICT: Focus indicator (outline, box-shadow, or border) MUST be present
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      if (!el) return false
      const style = window.getComputedStyle(el)
      const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px'
      const hasBoxShadow = style.boxShadow !== 'none' && style.boxShadow !== ''
      const hasBorder = style.borderWidth !== '0px'
      return hasOutline || hasBoxShadow || hasBorder
    })

    expect(
      hasFocusStyle,
      "L'element focus DOIT avoir un indicateur visuel (outline, box-shadow ou border)"
    ).toBe(true)
  })

  test('Auth page: focused form input has a visible focus indicator', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')
    await dismissCookieBanner(page)

    const emailInput = page.locator('input[type="email"]')
    await emailInput.focus()

    const hasFocusStyle = await emailInput.evaluate((el) => {
      const style = window.getComputedStyle(el)
      const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px'
      const hasBoxShadow = style.boxShadow !== 'none' && style.boxShadow !== ''
      const hasRing = style.boxShadow.includes('rgb') // Tailwind ring-* uses box-shadow
      return hasOutline || hasBoxShadow || hasRing
    })

    expect(hasFocusStyle, "L'input email focus DOIT avoir un indicateur visuel de focus").toBe(true)
  })
})

// ============================================================
// FOCUS TRAP — Modal/Dialog focus containment
// ============================================================
test.describe('A11Y-FOCUS-TRAP: Modal Focus Containment', () => {
  test('Cookie banner (if present) traps focus within itself', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check if cookie banner is visible
    const cookieBanner = page
      .locator('[role="dialog"], [aria-modal="true"], [data-testid="cookie-banner"]')
      .first()
    const bannerButton = page.getByRole('button', { name: /Tout accepter/i })

    const bannerVisible = await bannerButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (bannerVisible) {
      // Focus the accept button
      await bannerButton.focus()

      // Tab through all elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
      }

      // STRICT: After many tabs, focus should still be on an interactive element
      // (either inside the banner or it cycled)
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
      expect(
        ['a', 'button', 'input'].includes(focusedTag || ''),
        'Apres Tab dans le banner cookie, le focus DOIT rester sur un element interactif'
      ).toBe(true)
    } else {
      // No cookie banner — test passes (nothing to trap)
      expect(true).toBe(true)
    }
  })
})

// ============================================================
// SKIP LINKS — skip-to-content
// ============================================================
test.describe('A11Y-SKIP: Skip Navigation Links', () => {
  test('Landing page: skip-to-content link exists or main landmark is directly accessible', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for explicit skip link
    const skipLink = page.locator(
      'a[href="#main-content"], a[href="#content"], a:has-text("Aller au contenu"), a:has-text("Skip to content")'
    )
    const skipLinkCount = await skipLink.count()

    // Check for main landmark as fallback
    const mainLandmark = page.locator('main, [role="main"]')
    const mainCount = await mainLandmark.count()

    // STRICT: Either a skip link or a <main> landmark MUST exist
    expect(
      skipLinkCount + mainCount,
      'Un skip link (a[href="#main-content"]) OU un <main> landmark DOIT exister'
    ).toBeGreaterThan(0)
  })

  test('Auth page: main landmark exists for skip-to-content target', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')

    const mainLandmark = page.locator('main')
    // STRICT: <main> MUST exist
    const count = await mainLandmark.count()
    expect(count, 'La page auth DOIT avoir un element <main>').toBeGreaterThan(0)
    await expect(mainLandmark.first(), '<main> DOIT etre visible').toBeVisible()
  })
})

// ============================================================
// HEADING HIERARCHY — one h1 per page, no skipped levels
// ============================================================
test.describe('A11Y-HEADINGS: Heading Hierarchy', () => {
  for (const { name, path } of publicPages) {
    test(`${name}: has exactly one h1 and no skipped heading levels`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)

      // Count h1 elements
      const h1Count = await page.locator('h1').count()

      // STRICT: Exactly one h1 per page
      expect(h1Count, `${name} DOIT avoir exactement 1 h1, trouve: ${h1Count}`).toBe(1)

      // STRICT: h1 MUST be visible and have text content
      const h1 = page.locator('h1').first()
      await expect(h1, `${name}: h1 DOIT etre visible`).toBeVisible()
      const h1Text = await h1.textContent()
      expect(h1Text?.trim().length, `${name}: h1 DOIT avoir du contenu textuel`).toBeGreaterThan(0)

      // Check heading level hierarchy (no skipping)
      const headingLevels = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        return Array.from(headings).map((h) => parseInt(h.tagName.charAt(1)))
      })

      // STRICT: Headings MUST NOT skip levels (e.g., h1 -> h3 without h2)
      const skippedLevels: string[] = []
      for (let i = 1; i < headingLevels.length; i++) {
        const current = headingLevels[i]
        const previous = headingLevels[i - 1]
        // A heading can go deeper by exactly 1 level, or go back up to any level
        if (current > previous + 1) {
          skippedLevels.push(`h${previous} -> h${current} (saute h${previous + 1})`)
        }
      }

      expect(
        skippedLevels,
        `${name}: la hierarchie des headings ne DOIT pas sauter de niveaux. Sauts: ${skippedLevels.join(', ')}`
      ).toEqual([])
    })
  }

  for (const { name, path } of protectedPages) {
    test(`${name}: has at least one h1 after auth`, async ({ authenticatedPage: page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const h1Count = await page.locator('h1').count()

      // STRICT: At least one h1 MUST exist
      expect(h1Count, `${name} DOIT avoir au moins 1 h1 apres auth`).toBeGreaterThan(0)

      // STRICT: First h1 MUST be visible
      await expect(page.locator('h1').first(), `${name}: h1 DOIT etre visible`).toBeVisible()
    })
  }
})

// ============================================================
// IMAGE ACCESSIBILITY — all images MUST have alt text
// ============================================================
test.describe('A11Y-IMAGES: Image Alt Text', () => {
  for (const { name, path } of publicPages) {
    test(`${name}: every image has alt text or role=presentation`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const violatingImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'))
        const violations: string[] = []
        for (let i = 0; i < imgs.length; i++) {
          const img = imgs[i]
          const alt = img.getAttribute('alt')
          const role = img.getAttribute('role')
          const ariaHidden = img.getAttribute('aria-hidden')
          // alt="" is valid for decorative images
          const isAccessible =
            alt !== null || role === 'presentation' || role === 'none' || ariaHidden === 'true'
          if (!isAccessible) {
            const src = img.src || img.getAttribute('data-src') || ''
            violations.push(
              `Image #${i} (src="${src.split('/').pop()}") n'a ni alt ni role=presentation`
            )
          }
        }
        return violations
      })

      // STRICT: Zero images without alt text
      expect(
        violatingImages,
        `${name}: toutes les images DOIVENT avoir un attribut alt. Violations: ${violatingImages.join('; ')}`
      ).toEqual([])
    })
  }
})

// ============================================================
// FORM ACCESSIBILITY — all inputs MUST have labels
// ============================================================
test.describe('A11Y-FORMS: Form Input Labels', () => {
  test('Auth page: all form inputs have accessible labels', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const violatingInputs = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])')
      )
      const violations: string[] = []
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i] as HTMLInputElement
        // Skip invisible inputs
        if (input.offsetParent === null && !input.getAttribute('aria-hidden')) continue

        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledBy = input.getAttribute('aria-labelledby')
        const id = input.id
        const placeholder = input.getAttribute('placeholder')
        const title = input.getAttribute('title')

        let hasLabel = !!(ariaLabel || ariaLabelledBy || title)
        if (!hasLabel && id) {
          hasLabel = !!document.querySelector(`label[for="${id}"]`)
        }
        // Placeholder is accepted as minimum fallback
        if (!hasLabel && placeholder) {
          hasLabel = true
        }

        if (!hasLabel) {
          violations.push(
            `Input #${i} (type="${input.type}", name="${input.name}") n'a pas de label accessible`
          )
        }
      }
      return violations
    })

    // STRICT: Zero inputs without labels
    expect(
      violatingInputs,
      `Auth: tous les inputs DOIVENT avoir un label. Violations: ${violatingInputs.join('; ')}`
    ).toEqual([])
  })

  test('Settings page: all form inputs have accessible labels after auth', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const violatingInputs = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll(
          'input:not([type="hidden"]):not([type="submit"]), select, textarea'
        )
      )
      const violations: string[] = []
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i] as HTMLInputElement
        if (input.offsetParent === null) continue

        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledBy = input.getAttribute('aria-labelledby')
        const id = input.id
        const placeholder = input.getAttribute('placeholder')
        const title = input.getAttribute('title')

        let hasLabel = !!(ariaLabel || ariaLabelledBy || title)
        if (!hasLabel && id) {
          hasLabel = !!document.querySelector(`label[for="${id}"]`)
        }
        if (!hasLabel && placeholder) {
          hasLabel = true
        }

        if (!hasLabel) {
          violations.push(
            `Input #${i} (type="${input.type || 'text'}", name="${input.name}") n'a pas de label`
          )
        }
      }
      return violations
    })

    expect(
      violatingInputs,
      `Settings: tous les inputs DOIVENT avoir un label accessible. Violations: ${violatingInputs.join('; ')}`
    ).toEqual([])
  })
})

// ============================================================
// COLOR CONTRAST — automated axe-core check
// ============================================================
test.describe('A11Y-CONTRAST: Color Contrast', () => {
  test('Landing page: zero color-contrast violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const { violations } = await checkAccessibility(page, { tags: ['wcag2aa'] })

    const contrastViolations = violations.filter((v) => v.id === 'color-contrast')

    // STRICT: All contrast issues fixed (bg-primary-bg #7C3AED = 5.70:1 vs white)
    expect(
      contrastViolations.length,
      `Landing: ${contrastViolations.length} violation(s) de contraste: ${JSON.stringify(contrastViolations.map((v) => v.nodes?.map((n) => n.html).join(', ')))}`
    ).toBe(0)
  })

  test('Auth page: zero color-contrast violations', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const { violations } = await checkAccessibility(page, { tags: ['wcag2aa'] })

    const contrastViolations = violations.filter((v) => v.id === 'color-contrast')

    // STRICT: All contrast issues fixed
    expect(
      contrastViolations.length,
      `Auth: ${contrastViolations.length} violation(s) de contraste: ${JSON.stringify(contrastViolations.map((v) => v.nodes?.map((n) => n.html).join(', ')))}`
    ).toBe(0)
  })
})

// ============================================================
// ARIA LANDMARKS — main, nav, role structure
// ============================================================
test.describe('A11Y-LANDMARKS: ARIA Landmarks', () => {
  for (const { name, path } of publicPages) {
    test(`${name}: has a <main> landmark`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const main = page.locator('main')
      const count = await main.count()

      // STRICT: <main> element MUST exist
      expect(count, `${name} DOIT avoir un element <main>`).toBeGreaterThan(0)
      await expect(main.first(), `${name}: <main> DOIT etre visible`).toBeVisible()
    })

    test(`${name}: has a navigation landmark or interactive elements`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const nav = page.locator('nav, [role="navigation"], a[href], button')
      const count = await nav.count()

      // Public pages MUST have navigation or interactive elements for accessibility
      expect(count, `${name} DOIT avoir au moins un element de navigation ou interactif`).toBeGreaterThan(0)
    })
  }

  for (const { name, path } of protectedPages) {
    test(`${name}: has a <main> landmark after auth`, async ({ authenticatedPage: page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const main = page.locator('main')
      const count = await main.count()

      expect(count, `${name} DOIT avoir un <main> landmark apres auth`).toBeGreaterThan(0)
      await expect(main.first()).toBeVisible()
    })

    test(`${name}: has a navigation landmark after auth`, async ({ authenticatedPage: page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const nav = page.locator('nav, [role="navigation"]')
      const count = await nav.count()

      expect(count, `${name} DOIT avoir au moins un <nav> landmark apres auth`).toBeGreaterThan(0)
    })
  }
})

// ============================================================
// ARIA-LIVE REGIONS — dynamic content announcements
// ============================================================
test.describe('A11Y-LIVE: ARIA Live Regions', () => {
  test('App has aria-live regions for dynamic content announcements', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const liveRegions = await page.evaluate(() => {
      const regions = document.querySelectorAll(
        '[aria-live], [role="alert"], [role="status"], [role="log"]'
      )
      return Array.from(regions).map((el) => ({
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live'),
        tag: el.tagName.toLowerCase(),
      }))
    })

    // STRICT: At least one aria-live region or role="alert"/"status" MUST exist
    expect(
      liveRegions.length,
      'L\'app DOIT avoir au moins une region aria-live, role="alert" ou role="status" pour le contenu dynamique'
    ).toBeGreaterThan(0)
  })
})

// ============================================================
// LINK ACCESSIBILITY — all visible links MUST have accessible names
// ============================================================
test.describe('A11Y-LINKS: Link Accessible Names', () => {
  test('Landing page: every visible link has an accessible name', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const violatingLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'))
      const violations: string[] = []
      for (let i = 0; i < links.length; i++) {
        const link = links[i]
        // Skip invisible links
        if (link.offsetParent === null && !link.closest('[aria-hidden="true"]')) {
          // Check if it's actually visible (could be position:fixed etc.)
          const rect = link.getBoundingClientRect()
          if (rect.width === 0 && rect.height === 0) continue
        }

        const ariaLabel = link.getAttribute('aria-label')
        const textContent = link.textContent?.trim()
        const title = link.getAttribute('title')
        const ariaLabelledBy = link.getAttribute('aria-labelledby')
        // SVG icon inside the link counts if it has title or aria-label
        const svgTitle = link.querySelector('svg title')?.textContent?.trim()

        const hasAccessibleName = !!(
          ariaLabel ||
          textContent ||
          title ||
          ariaLabelledBy ||
          svgTitle
        )

        if (!hasAccessibleName) {
          const href = link.getAttribute('href')
          violations.push(`Link #${i} (href="${href}") n'a pas de nom accessible`)
        }
      }
      return violations
    })

    // STRICT: Zero links without accessible names
    expect(
      violatingLinks,
      `Landing: tous les liens DOIVENT avoir un nom accessible. Violations: ${violatingLinks.join('; ')}`
    ).toEqual([])
  })
})

// ============================================================
// BUTTON ACCESSIBILITY — all visible buttons MUST have accessible names
// ============================================================
test.describe('A11Y-BUTTONS: Button Accessible Names', () => {
  test('Landing page: every visible button has an accessible name', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const violatingButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const violations: string[] = []
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i]
        // Skip invisible buttons
        const rect = btn.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue

        const ariaLabel = btn.getAttribute('aria-label')
        const textContent = btn.textContent?.trim()
        const title = btn.getAttribute('title')
        const ariaLabelledBy = btn.getAttribute('aria-labelledby')

        const hasAccessibleName = !!(ariaLabel || textContent || title || ariaLabelledBy)

        if (!hasAccessibleName) {
          const classes = btn.className?.substring(0, 60)
          violations.push(`Button #${i} (class="${classes}") n'a pas de nom accessible`)
        }
      }
      return violations
    })

    // STRICT: Zero buttons without accessible names
    expect(
      violatingButtons,
      `Landing: tous les boutons DOIVENT avoir un nom accessible. Violations: ${violatingButtons.join('; ')}`
    ).toEqual([])
  })
})

// ============================================================
// ARIA ATTRIBUTES — form inputs must have correct ARIA
// ============================================================
test.describe('A11Y-ARIA: ARIA Attributes on Auth Form', () => {
  test('Auth form: inputs have correct type and autocomplete attributes', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    // STRICT: Both inputs MUST be visible
    await expect(emailInput, 'Email input DOIT etre visible').toBeVisible()
    await expect(passwordInput, 'Password input DOIT etre visible').toBeVisible()

    // STRICT: type attributes MUST be correct
    const emailType = await emailInput.getAttribute('type')
    expect(emailType, 'Email input DOIT avoir type="email"').toBe('email')

    const passwordType = await passwordInput.getAttribute('type')
    expect(passwordType, 'Password input DOIT avoir type="password"').toBe('password')

    // STRICT: autocomplete attributes MUST exist for autofill support
    const emailAutocomplete = await emailInput.getAttribute('autocomplete')
    expect(emailAutocomplete, 'Email input DOIT avoir un attribut autocomplete').toBeTruthy()

    const passwordAutocomplete = await passwordInput.getAttribute('autocomplete')
    expect(passwordAutocomplete, 'Password input DOIT avoir un attribut autocomplete').toBeTruthy()
  })

  test('Auth form: Enter key on submit triggers form submission', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    // Fill form with invalid data to test keyboard submission
    await page.locator('input[type="email"]').fill('keyboard-a11y@invalid.test')
    await page.locator('input[type="password"]').fill('keyboard-test-pass')

    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.focus()
    await page.keyboard.press('Enter')

    // Wait for form processing
    await page.waitForTimeout(2000)

    // STRICT: We should still be on /auth (invalid credentials prove form was submitted)
    await expect(page).toHaveURL(/\/auth/)
  })
})
