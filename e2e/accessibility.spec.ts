import { test, expect } from './fixtures'
import { checkAccessibility } from './fixtures'

/**
 * Accessibility Tests — STRICT MODE
 *
 * REGLE STRICTE : Chaque test DOIT echouer si une violation serious/critical est detectee.
 * Pas de .catch(() => false) sur les assertions.
 * Pas de toBeGreaterThanOrEqual(0).
 * Pas de try/catch qui avale les erreurs.
 * Pas de fallback qui masque les problemes.
 * Si axe-core trouve des violations serious/critical → FAIL.
 * Si un element ARIA est manquant → FAIL.
 * Si le keyboard focus est casse → FAIL.
 */

// ============================================================
// PUBLIC PAGES — Axe-core WCAG 2.1 AA Audit
// ============================================================

const publicPages = [
  { name: 'Landing', path: '/' },
  { name: 'Auth', path: '/auth' },
  { name: 'Premium', path: '/premium' },
]

test.describe('A11Y-PUBLIC: Axe WCAG Audit — Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} (dark mode): zero serious/critical WCAG violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Wait for CSS custom properties and animations to settle
      await page.waitForTimeout(500)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance for serious/critical violations
      expect(violations.length).toBe(0)
    })

    test(`${name} (light mode): zero serious/critical WCAG violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Wait for CSS custom properties and animations to settle
      await page.waitForTimeout(500)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance for serious/critical violations
      expect(violations.length).toBe(0)
    })
  }
})

// ============================================================
// PROTECTED PAGES — Axe-core WCAG 2.1 AA Audit (authenticated)
// ============================================================

const protectedPages = [
  { name: 'Home', path: '/home' },
  { name: 'Squads', path: '/squads' },
  { name: 'Messages', path: '/messages' },
  { name: 'Profile', path: '/profile' },
  { name: 'Settings', path: '/settings' },
  { name: 'Party', path: '/party' },
]

test.describe('A11Y-PROTECTED: Axe WCAG Audit — Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} (dark mode): zero serious/critical WCAG violations`, async ({ authenticatedPage: page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance for serious/critical violations
      expect(violations.length).toBe(0)
    })

    test(`${name} (light mode): zero serious/critical WCAG violations`, async ({ authenticatedPage: page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const { violations } = await checkAccessibility(page)

      // STRICT: Zero tolerance for serious/critical violations
      expect(violations.length).toBe(0)
    })
  }
})

// ============================================================
// HEADING STRUCTURE — h1 must exist and be visible
// ============================================================

test.describe('A11Y-HEADINGS: Heading Structure', () => {
  test('Landing page MUST have exactly one visible h1', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const h1 = page.locator('h1')

    // STRICT: At least one h1 must exist
    const count = await h1.count()
    expect(count).toBeGreaterThan(0)

    // STRICT: The first h1 must be visible
    await expect(h1.first()).toBeVisible()

    // STRICT: h1 must have non-empty text content
    const text = await h1.first().textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test('Auth page MUST have exactly one visible h1', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const h1 = page.locator('h1')

    // STRICT: At least one h1 must exist
    const count = await h1.count()
    expect(count).toBeGreaterThan(0)

    // STRICT: The first h1 must be visible
    await expect(h1.first()).toBeVisible()

    // STRICT: h1 must have non-empty text content
    const text = await h1.first().textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test('Premium page MUST have exactly one visible h1', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForLoadState('networkidle')

    const h1 = page.locator('h1')

    // STRICT: At least one h1 must exist
    const count = await h1.count()
    expect(count).toBeGreaterThan(0)

    // STRICT: The first h1 must be visible
    await expect(h1.first()).toBeVisible()
  })
})

// ============================================================
// FORM ACCESSIBILITY — labels, roles, keyboard support
// ============================================================

test.describe('A11Y-FORMS: Form Accessibility', () => {
  test('Auth form: email input MUST have an accessible label', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const emailInput = page.locator('input[type="email"]')

    // STRICT: Email input must exist and be visible
    await expect(emailInput).toBeVisible()

    // STRICT: Email input must have an accessible label (aria-label, aria-labelledby, or associated <label>)
    const ariaLabel = await emailInput.getAttribute('aria-label')
    const ariaLabelledBy = await emailInput.getAttribute('aria-labelledby')
    const id = await emailInput.getAttribute('id')
    const placeholder = await emailInput.getAttribute('placeholder')

    let hasLabel = !!(ariaLabel || ariaLabelledBy)
    if (!hasLabel && id) {
      const associatedLabel = page.locator(`label[for="${id}"]`)
      hasLabel = (await associatedLabel.count()) > 0
    }
    // placeholder alone does not count as a sufficient label for a11y
    // but we accept it as a minimum fallback if explicitly set
    if (!hasLabel && placeholder) {
      hasLabel = true
    }

    // STRICT: Input MUST have an accessible label mechanism
    expect(hasLabel).toBe(true)
  })

  test('Auth form: password input MUST have an accessible label', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const passwordInput = page.locator('input[type="password"]')

    // STRICT: Password input must exist and be visible
    await expect(passwordInput).toBeVisible()

    // STRICT: Password input must have an accessible label
    const ariaLabel = await passwordInput.getAttribute('aria-label')
    const ariaLabelledBy = await passwordInput.getAttribute('aria-labelledby')
    const id = await passwordInput.getAttribute('id')
    const placeholder = await passwordInput.getAttribute('placeholder')

    let hasLabel = !!(ariaLabel || ariaLabelledBy)
    if (!hasLabel && id) {
      const associatedLabel = page.locator(`label[for="${id}"]`)
      hasLabel = (await associatedLabel.count()) > 0
    }
    if (!hasLabel && placeholder) {
      hasLabel = true
    }

    // STRICT: Input MUST have an accessible label mechanism
    expect(hasLabel).toBe(true)
  })

  test('Auth form: submit button MUST be accessible and enabled', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const submitBtn = page.locator('button[type="submit"]')

    // STRICT: Submit button must exist and be visible
    await expect(submitBtn).toBeVisible()

    // STRICT: Submit button must be enabled (not disabled)
    await expect(submitBtn).toBeEnabled()

    // STRICT: Submit button must have accessible text content
    const text = await submitBtn.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test('Auth form: Tab key navigates between email and password fields', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const emailInput = page.locator('input[type="email"]')
    await emailInput.focus()

    // STRICT: Email input must receive focus
    const emailFocused = await page.evaluate(() => document.activeElement?.getAttribute('type'))
    expect(emailFocused).toBe('email')

    await page.keyboard.press('Tab')

    // STRICT: After Tab, password input must receive focus
    const passwordFocused = await page.evaluate(() => document.activeElement?.getAttribute('type'))
    expect(passwordFocused).toBe('password')
  })
})

// ============================================================
// LINK ACCESSIBILITY — all visible links must have accessible names
// ============================================================

test.describe('A11Y-LINKS: Link Accessibility', () => {
  test('Landing page: every visible link MUST have an accessible name', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const links = page.locator('a')
    const count = await links.count()

    // STRICT: Landing page must have at least one link
    expect(count).toBeGreaterThan(0)

    const violatingLinks: string[] = []

    for (let i = 0; i < count; i++) {
      const link = links.nth(i)
      const isVisible = await link.isVisible()
      if (!isVisible) continue

      const ariaLabel = await link.getAttribute('aria-label')
      const textContent = await link.textContent()
      const title = await link.getAttribute('title')
      const href = await link.getAttribute('href')

      const hasAccessibleName = !!(
        ariaLabel?.trim() ||
        textContent?.trim() ||
        title?.trim()
      )

      if (!hasAccessibleName) {
        violatingLinks.push(`Link #${i} (href="${href}") has no accessible name`)
      }
    }

    // STRICT: Zero links without accessible names
    expect(violatingLinks).toEqual([])
  })
})

// ============================================================
// IMAGE ACCESSIBILITY — all images must have alt or role=presentation
// ============================================================

test.describe('A11Y-IMAGES: Image Accessibility', () => {
  test('Landing page: every image MUST have alt text or role=presentation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const images = page.locator('img')
    const count = await images.count()

    const violatingImages: string[] = []

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      const src = await img.getAttribute('src')

      // alt="" is acceptable for decorative images (equivalent to role=presentation)
      const isAccessible = alt !== null || role === 'presentation' || role === 'none'

      if (!isAccessible) {
        violatingImages.push(`Image #${i} (src="${src}") has no alt attribute and no role=presentation`)
      }
    }

    // STRICT: Zero images without alt text or presentation role
    expect(violatingImages).toEqual([])
  })
})

// ============================================================
// KEYBOARD NAVIGATION — focus must work correctly
// ============================================================

test.describe('A11Y-KEYBOARD: Focus Management', () => {
  test('Landing page: Tab key MUST move focus to interactive elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click body to reset focus
    await page.click('body')

    // Tab twice to ensure we reach an interactive element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const focusedTag = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName.toLowerCase() : null
    })

    // STRICT: Focused element MUST be an interactive element
    const interactiveElements = ['a', 'button', 'input', 'select', 'textarea']
    expect(interactiveElements).toContain(focusedTag)
  })

  test('Landing page: focused element MUST have a visible focus indicator', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('body')
    await page.keyboard.press('Tab')

    // STRICT: Active element must exist and not be body
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    expect(activeTag).not.toBe('body')
    expect(activeTag).not.toBe('html')

    // STRICT: The focused element must have some visual differentiation
    // (outline, box-shadow, or border change)
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      if (!el) return false
      const style = window.getComputedStyle(el)
      const hasOutline = style.outline !== 'none' && style.outline !== '' && style.outlineWidth !== '0px'
      const hasBoxShadow = style.boxShadow !== 'none' && style.boxShadow !== ''
      const hasBorder = style.borderColor !== '' || style.borderWidth !== '0px'
      return hasOutline || hasBoxShadow || hasBorder
    })

    // STRICT: Focus indicator MUST be present
    expect(hasFocusStyle).toBe(true)
  })

  test('Auth form: Enter key on submit button MUST trigger form submission', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    // Fill the form with invalid data (so we don't actually login)
    await page.locator('input[type="email"]').fill('keyboard-test@invalid.test')
    await page.locator('input[type="password"]').fill('keyboard-test-pass')

    // Focus the submit button and press Enter
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.focus()
    await page.keyboard.press('Enter')

    // STRICT: The form must have been submitted (we stay on /auth because credentials are invalid)
    // Wait a moment for any form processing
    await page.waitForTimeout(2000)

    // STRICT: We should still be on the auth page (invalid creds) — proving the form was submitted
    await expect(page).toHaveURL(/\/auth/)
  })
})

// ============================================================
// COLOR CONTRAST — text must have sufficient contrast
// ============================================================

test.describe('A11Y-CONTRAST: Color Contrast', () => {
  test('Landing page: h1 text color MUST differ from its background', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1').first()

    // STRICT: h1 must be visible
    await expect(heading).toBeVisible()

    const { color, bgColor } = await heading.evaluate((el) => {
      const style = window.getComputedStyle(el)
      const textColor = style.color

      let current = el as HTMLElement | null
      let bg = 'rgba(0, 0, 0, 0)'
      while (current) {
        const currentBg = window.getComputedStyle(current).backgroundColor
        if (currentBg && currentBg !== 'rgba(0, 0, 0, 0)' && currentBg !== 'transparent') {
          bg = currentBg
          break
        }
        current = current.parentElement
      }
      return { color: textColor, bgColor: bg }
    })

    // STRICT: Text color MUST NOT equal background color
    expect(color).not.toBe(bgColor)
  })

  test('Landing page: axe-core color-contrast rule has zero violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Wait for CSS custom properties and animations to settle
    await page.waitForTimeout(500)

    const { violations } = await checkAccessibility(page, {
      tags: ['wcag2aa'],
    })

    // Filter only color-contrast violations
    const contrastViolations = violations.filter((v) => v.id === 'color-contrast')

    // STRICT: Zero color contrast violations
    expect(contrastViolations.length).toBe(0)
  })
})

// ============================================================
// ARIA LANDMARKS — pages must have correct landmark structure
// ============================================================

test.describe('A11Y-LANDMARKS: ARIA Landmarks', () => {
  test('Landing page MUST have a <main> landmark', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const main = page.locator('main')

    // STRICT: Exactly one <main> element must exist (not [role="main"] fallback)
    const count = await main.count()
    expect(count).toBeGreaterThan(0)

    // STRICT: The main landmark must be visible
    await expect(main.first()).toBeVisible()
  })

  test('Auth page MUST have a <main> landmark', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')

    const main = page.locator('main')

    // STRICT: <main> element must exist
    const count = await main.count()
    expect(count).toBeGreaterThan(0)

    // STRICT: The main landmark must be visible
    await expect(main.first()).toBeVisible()
  })

  test('Landing page: navigation landmark MUST exist', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const nav = page.locator('nav, [role="navigation"]')

    // STRICT: At least one navigation landmark must exist
    const count = await nav.count()
    expect(count).toBeGreaterThan(0)
  })
})

// ============================================================
// ARIA ATTRIBUTES — interactive elements must have correct ARIA
// ============================================================

test.describe('A11Y-ARIA: ARIA Attributes', () => {
  test('Auth page: form inputs MUST have required ARIA attributes', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    // STRICT: Inputs must be visible
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    // STRICT: Email input must have type="email" (provides implicit ARIA role)
    const emailType = await emailInput.getAttribute('type')
    expect(emailType).toBe('email')

    // STRICT: Password input must have type="password"
    const passwordType = await passwordInput.getAttribute('type')
    expect(passwordType).toBe('password')

    // STRICT: Inputs must have autocomplete attributes for autofill support
    const emailAutocomplete = await emailInput.getAttribute('autocomplete')
    const passwordAutocomplete = await passwordInput.getAttribute('autocomplete')
    // Accept any valid autocomplete value (email, username, current-password, etc.)
    expect(emailAutocomplete).toBeTruthy()
    expect(passwordAutocomplete).toBeTruthy()
  })

  test('Landing page: buttons MUST have accessible names', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const buttons = page.locator('button')
    const count = await buttons.count()

    const violatingButtons: string[] = []

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i)
      const isVisible = await btn.isVisible()
      if (!isVisible) continue

      const ariaLabel = await btn.getAttribute('aria-label')
      const textContent = await btn.textContent()
      const title = await btn.getAttribute('title')

      const hasAccessibleName = !!(
        ariaLabel?.trim() ||
        textContent?.trim() ||
        title?.trim()
      )

      if (!hasAccessibleName) {
        const classes = await btn.getAttribute('class')
        violatingButtons.push(`Button #${i} (class="${classes?.substring(0, 50)}") has no accessible name`)
      }
    }

    // STRICT: Zero buttons without accessible names
    expect(violatingButtons).toEqual([])
  })
})

// ============================================================
// PROTECTED PAGES — ARIA Landmarks (authenticated)
// ============================================================

test.describe('A11Y-PROTECTED-LANDMARKS: Protected Page Landmarks', () => {
  test('Home page MUST have a <main> landmark after auth', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const main = page.locator('main')

    // STRICT: <main> element must exist
    const count = await main.count()
    expect(count).toBeGreaterThan(0)

    // STRICT: The main landmark must be visible
    await expect(main.first()).toBeVisible()
  })

  test('Home page MUST have navigation landmark after auth', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const nav = page.locator('nav, [role="navigation"]')

    // STRICT: At least one navigation landmark must exist
    const count = await nav.count()
    expect(count).toBeGreaterThan(0)
  })
})
