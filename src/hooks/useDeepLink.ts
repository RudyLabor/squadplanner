import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Capacitor } from '@capacitor/core'
import { parseDeepLinkUrl, isValidDeepLinkPath } from '../lib/deepLinkParsing'

// Re-export pure functions for consumers that imported them from here
export { parseDeepLinkUrl, isValidDeepLinkPath, DEEP_LINK_PREFIXES } from '../lib/deepLinkParsing'

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
        const { App } = await import(/* @vite-ignore */ '@capacitor/app')

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
