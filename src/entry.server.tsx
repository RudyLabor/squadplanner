import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { renderToReadableStream } from 'react-dom/server'
import { isbot } from 'isbot'

// Vercel Edge skew protection — keeps users on the same deployment version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (globalThis as any).process?.env ?? {}
const vercelDeploymentId: string | undefined = env.VERCEL_DEPLOYMENT_ID
const vercelSkewProtection = env.VERCEL_SKEW_PROTECTION_ENABLED === '1'

// Pre-rendered / public pages that can be cached aggressively
const PRE_RENDERED_PATHS = new Set(['/', '/auth', '/legal', '/help', '/premium', '/maintenance'])

// Protected / dynamic pages that contain user-specific data
const PROTECTED_PATH_PREFIXES = ['/home', '/squads', '/sessions', '/messages', '/party', '/settings', '/profile']

// API-like paths
const API_PATH_PREFIXES = ['/api', '/__data']

function getCacheControl(pathname: string): string {
  // API-like responses: never store
  if (API_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return 'no-store'
  }

  // Pre-rendered public pages: cache at CDN for 1h, stale-while-revalidate for 24h
  if (PRE_RENDERED_PATHS.has(pathname)) {
    return 'public, s-maxage=3600, stale-while-revalidate=86400'
  }

  // Protected/dynamic pages: private, always revalidate
  if (PROTECTED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return 'private, no-cache'
  }

  // Default: private, no-cache (safe fallback)
  return 'private, no-cache'
}

function setSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()')
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
) {
  const userAgent = request.headers.get('user-agent')
  const isCrawler = userAgent ? isbot(userAgent) : false

  const stream = await renderToReadableStream(
    <ServerRouter context={entryContext} url={request.url} />,
    {
      // Use request.signal for Edge Runtime compatibility (auto-aborts when client disconnects)
      signal: request.signal,
      onError(error: unknown) {
        responseStatusCode = 500
        console.error('[SSR Error]', error)
      },
    }
  )

  // For bots/crawlers, wait for the full HTML to be ready (better SEO)
  if (isCrawler) {
    await stream.allReady
  }

  // Content type
  responseHeaders.set('Content-Type', 'text/html')

  // Cache headers based on URL path
  const url = new URL(request.url)
  responseHeaders.set('Cache-Control', getCacheControl(url.pathname))

  // Security & performance headers
  setSecurityHeaders(responseHeaders)

  // Vercel Skew Protection — pin users to the same deployment version
  if (vercelSkewProtection && vercelDeploymentId) {
    responseHeaders.append('Set-Cookie', `__vdpl=${vercelDeploymentId}; HttpOnly`)
  }

  // Link headers for Early Hints (103) - Vercel uses these to send preconnect/preload
  // hints before the full response is ready, saving ~100-300ms on font loading
  responseHeaders.append(
    'Link',
    [
      '<https://nxbqiwmfyafgshxzczxo.supabase.co>; rel=preconnect; crossorigin',
      '</fonts/inter-var-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      '</fonts/space-grotesk-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
    ].join(', ')
  )

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
