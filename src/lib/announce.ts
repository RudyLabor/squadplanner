/**
 * Announces messages to screen readers via aria-live regions.
 * Uses the regions defined in root.tsx.
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const el = document.getElementById(
    priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite'
  )
  if (el) {
    // Clear and re-set to ensure announcement
    el.textContent = ''
    requestAnimationFrame(() => {
      el.textContent = message
    })
  }
}
