/**
 * Pure functions for deep link URL parsing.
 * Extracted for testability — no Capacitor/React dependency.
 */

/**
 * Extracts the app-relative path from a deep link URL.
 *
 * Supported formats:
 *   - https://squadplanner.fr/join/abc   -> /join/abc
 *   - squadplanner://app/join/abc        -> /join/abc
 *
 * Returns null if the URL doesn't match a supported deep link route.
 */
export function parseDeepLinkUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString)

    // Custom scheme: squadplanner://app/join/abc
    if (url.protocol === 'squadplanner:') {
      // url.pathname for custom schemes includes the host, so we need host + pathname
      // e.g. squadplanner://app/join/abc => host="app", pathname="/join/abc"
      const path = url.pathname + url.search
      return path || null
    }

    // Universal link: https://squadplanner.fr/join/abc
    if (url.hostname === 'squadplanner.fr') {
      const path = url.pathname + url.search
      return path || null
    }

    return null
  } catch {
    return null
  }
}

/** Routes that are valid deep link targets. */
export const DEEP_LINK_PREFIXES = ['/join/', '/s/', '/squad/', '/u/', '/referral/']

export function isValidDeepLinkPath(path: string): boolean {
  return DEEP_LINK_PREFIXES.some((prefix) => path.startsWith(prefix))
}
