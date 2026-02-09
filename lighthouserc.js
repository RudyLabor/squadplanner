/**
 * Lighthouse CI Configuration - Accessibility focus
 * This config enforces a perfect accessibility score (100) on all public pages.
 * Protected pages (/home, /squads, /messages, /profile) require authentication
 * and are tested via Playwright + axe-core instead.
 */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/auth',
        'http://localhost:4173/premium',
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        onlyCategories: ['accessibility'],
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
