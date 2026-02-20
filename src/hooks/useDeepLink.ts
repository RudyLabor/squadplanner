import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Capacitor } from '@capacitor/core'

/**
 * Extracts the app-relative path from a deep link URL.
 *
 * Supported formats:
 *   - https://squadplanner.fr/join/abc   -> /join/abc
 *   - squadplanner://app/join/abc        -> /join/abc
 *
 * Returns null if the URL doesn't match a supported deep link route.
 */
function parseDeepLinkUrl(urlString: string): string | null {
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
const DEEP_LINK_PREFIXES = ['/join/', '/s/', '/squad/', '/u/', '/referral/']

function isValidDeepLinkPath(path: string): boolean {
  return DEEP_LINK_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * Listens for deep link events from Capacitor and navigates to the
 * corresponding React Router route.
 *
 * Only active on native platforms (iOS/Android). On web, universal links
 * are handled by the server/browser directly.
 *
 * Usage: call once in your root layout component.
 *
 * ```tsx
 * import { useDeepLink } from '~/hooks/useDeepLink'
 *
 * export default function RootLayout() {
 *   useDeepLink()
 *   return <Outlet />
 * }
 * ```
 */
export function useDeepLink() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let cleanup: (() => void) | undefined

    async function setup() {
      try {
        const { App } = await import('@capacitor/app')

        // Handle URLs that open the app while it's running (warm start)
        const listener = await App.addListener('appUrlOpen', ({ url }) => {
          const path = parseDeepLinkUrl(url)
          if (path && isValidDeepLinkPath(path)) {
            navigate(path)
          }
        })

        cleanup = () => {
          listener.remove()
        }

        // Handle the URL that launched the app (cold start)
        const launchUrl = await App.getLaunchUrl()
        if (launchUrl?.url) {
          const path = parseDeepLinkUrl(launchUrl.url)
          if (path && isValidDeepLinkPath(path)) {
            navigate(path, { replace: true })
          }
        }
      } catch {
        // @capacitor/app not available (e.g. web build) -- silently ignore
      }
    }

    setup()

    return () => {
      cleanup?.()
    }
  }, [navigate])
}
