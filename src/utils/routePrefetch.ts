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
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback to not block the main thread
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 3000 });
    } else {
      setTimeout(callback, 2000);
    }
  };

  schedulePreload(() => {
    // Warm Supabase connection if not already done
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const supabaseLink = document.createElement('link');
      supabaseLink.rel = 'preconnect';
      supabaseLink.href = supabaseUrl;
      document.head.appendChild(supabaseLink);
    }
  });
}

/**
 * Prefetch a route's data when user shows intent (hover/focus on nav link).
 * Uses intersection observer for visible links.
 */
export function setupVisibilityPrefetch(
  element: HTMLElement,
  onVisible: () => void
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onVisible();
          observer.disconnect();
        }
      });
    },
    { rootMargin: '100px' }
  );

  observer.observe(element);
  return () => observer.disconnect();
}
