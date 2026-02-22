import { test } from './fixtures'
import AxeBuilder from '@axe-core/playwright'

const pagesToTest = [
  { name: 'Sessions', path: '/sessions', needsAuth: true },
  { name: 'Messages', path: '/messages', needsAuth: true },
  { name: 'Party', path: '/party', needsAuth: true },
  { name: 'Discover', path: '/discover', needsAuth: true },
  { name: 'Settings', path: '/settings', needsAuth: true },
  { name: 'Profile', path: '/profile', needsAuth: true },
  { name: 'Premium', path: '/premium', needsAuth: false },
  { name: 'Landing-mobile', path: '/', needsAuth: false },
  { name: 'Landing-dark', path: '/', needsAuth: false },
]

for (const { name, path, needsAuth } of pagesToTest) {
  test(`DEBUG contrast: ${name}`, async ({ authenticatedPage, page }) => {
    const p = needsAuth ? authenticatedPage : page

    if (name === 'Landing-dark') {
      await p.emulateMedia({ colorScheme: 'dark' })
    }
    if (name === 'Landing-mobile') {
      await p.setViewportSize({ width: 375, height: 812 })
    }

    await p.goto(path)
    await p.waitForLoadState('networkidle')
    await p.waitForTimeout(1000)

    const results = await new AxeBuilder({ page: p })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (serious.length > 0) {
      for (const v of serious) {
        console.log(`\n=== VIOLATION: ${v.id} (${v.impact}) — ${v.help} ===`)
        for (const node of v.nodes) {
          console.log(`  Target: ${JSON.stringify(node.target)}`)
          console.log(`  HTML: ${node.html.substring(0, 200)}`)
          if (node.any && node.any[0]?.data) {
            const d = node.any[0].data as Record<string, unknown>
            console.log(
              `  FG: ${d.fgColor}, BG: ${d.bgColor}, Ratio: ${d.contrastRatio}, Expected: ${d.expectedContrastRatio}, FontSize: ${d.fontSize}, FontWeight: ${d.fontWeight}`
            )
          }
        }
      }
    } else {
      console.log(`${name}: NO serious violations`)
    }
  })
}
