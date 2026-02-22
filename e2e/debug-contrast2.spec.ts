import { test as base } from './fixtures'
import AxeBuilder from '@axe-core/playwright'

// Use base test (no authenticatedPage) to avoid implicit login
const test = base

test('DEBUG: Landing dark mode violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  )

  for (const v of serious) {
    console.log(`\n=== ${v.id} (${v.impact}) — ${v.help} ===`)
    for (const node of v.nodes) {
      console.log(`  Target: ${JSON.stringify(node.target)}`)
      console.log(`  HTML: ${node.html.substring(0, 300)}`)
      if (node.any?.[0]?.data) {
        const d = node.any[0].data as Record<string, unknown>
        console.log(
          `  FG: ${d.fgColor}, BG: ${d.bgColor}, Ratio: ${d.contrastRatio}, Expected: ${d.expectedContrastRatio}, Size: ${d.fontSize}, Weight: ${d.fontWeight}`
        )
      }
    }
  }
  console.log(`\nTotal serious violations: ${serious.length}`)
})

test('DEBUG: Sessions light mode violations', async ({ page }) => {
  // Login first
  const { loginViaUI } = await import('./fixtures')
  await loginViaUI(page)
  await page.goto('/sessions')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  )

  for (const v of serious) {
    console.log(`\n=== ${v.id} (${v.impact}) — ${v.help} ===`)
    for (const node of v.nodes) {
      console.log(`  Target: ${JSON.stringify(node.target)}`)
      console.log(`  HTML: ${node.html.substring(0, 300)}`)
      if (node.any?.[0]?.data) {
        const d = node.any[0].data as Record<string, unknown>
        console.log(
          `  FG: ${d.fgColor}, BG: ${d.bgColor}, Ratio: ${d.contrastRatio}, Expected: ${d.expectedContrastRatio}, Size: ${d.fontSize}, Weight: ${d.fontWeight}`
        )
      }
    }
  }
  console.log(`\nTotal serious violations: ${serious.length}`)
})

test('DEBUG: Home dark mode violations', async ({ page }) => {
  const { loginViaUI } = await import('./fixtures')
  await page.emulateMedia({ colorScheme: 'dark' })
  await loginViaUI(page)
  await page.goto('/home')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  )

  for (const v of serious) {
    console.log(`\n=== ${v.id} (${v.impact}) — ${v.help} ===`)
    for (const node of v.nodes) {
      console.log(`  Target: ${JSON.stringify(node.target)}`)
      console.log(`  HTML: ${node.html.substring(0, 300)}`)
      if (node.any?.[0]?.data) {
        const d = node.any[0].data as Record<string, unknown>
        console.log(
          `  FG: ${d.fgColor}, BG: ${d.bgColor}, Ratio: ${d.contrastRatio}, Expected: ${d.expectedContrastRatio}, Size: ${d.fontSize}, Weight: ${d.fontWeight}`
        )
      }
    }
  }
  console.log(`\nTotal serious violations: ${serious.length}`)
})
