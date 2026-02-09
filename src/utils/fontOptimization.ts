/**
 * Font Loading Optimization Utility
 *
 * Uses the Font Loading API to detect when web fonts are loaded
 * and adds a `fonts-loaded` class to <html>. This enables CSS
 * to use system fonts as fallback until web fonts are ready,
 * preventing invisible text (FOIT).
 */

const FONT_FAMILIES = ['Inter', 'Space Grotesk'] as const

/**
 * Initialize font load detection.
 * Adds `fonts-loaded` class to documentElement once all fonts are ready.
 */
export function initFontOptimization(): void {
  if (typeof document === 'undefined') return

  // If Font Loading API is available, use it
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      // Verify that at least Inter loaded (primary font)
      const interLoaded = document.fonts.check('16px Inter')
      if (interLoaded) {
        document.documentElement.classList.add('fonts-loaded')
      }
    })

    // Also set up individual font checks for faster feedback
    Promise.all(
      FONT_FAMILIES.map(family =>
        document.fonts.load(`16px "${family}"`).catch(() => {
          // Font load failure is non-critical
        })
      )
    ).then(() => {
      document.documentElement.classList.add('fonts-loaded')
    })
  } else {
    // Fallback: assume fonts loaded after a short delay
    setTimeout(() => {
      document.documentElement.classList.add('fonts-loaded')
    }, 1000)
  }
}
