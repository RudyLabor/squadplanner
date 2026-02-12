/**
 * Route prefetching utilities.
 * Warms browser caches and DNS for probable next navigations.
 */

/**
 * Prefetch route chunks for probable next navigations.
 * Called after initial page load to warm the browser cache.
 */
export function prefetchProbableRoutes() {
  // Only prefetch in browser environment
  if (typeof window === 'undefined') return

  // Use requestIdleCallback to not block the main thread
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 5000 })
    } else {
      setTimeout(callback, 3000)
    }
  }

  schedulePreload(() => {
    // Warm Supabase connection if not already done
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (supabaseUrl) {
      const supabaseLink = document.createElement('link')
      supabaseLink.rel = 'preconnect'
      supabaseLink.href = supabaseUrl
      document.head.appendChild(supabaseLink)
    }

    // Prefetch most visited route chunks via dynamic import
    // These are no-ops if already loaded, and warm the cache for first visit
    const prefetchRoutes = [
      () => import('../pages/Home'),
      () => import('../pages/Messages'),
      () => import('../pages/Squads'),
      () => import('../pages/Sessions'),
    ]

    prefetchRoutes.forEach((prefetch, index) => {
      setTimeout(() => {
        prefetch().catch(() => {
          /* ignore prefetch failures */
        })
      }, index * 500) // Stagger prefetches by 500ms to avoid bandwidth contention
    })
  })
}
