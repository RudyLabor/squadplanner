import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { StrictMode } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { isbot } from 'isbot'

const ABORT_DELAY = 5_000

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
    <StrictMode>
      <ServerRouter context={entryContext} url={request.url} />
    </StrictMode>,
    {
      signal: AbortSignal.timeout(ABORT_DELAY),
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

  // Link headers for Early Hints (103) - Vercel uses these to send preconnect/preload
  // hints before the full response is ready, saving ~100-300ms on font loading
  responseHeaders.append(
    'Link',
    [
      '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
      '<https://fonts.googleapis.com>; rel=preconnect',
      '<https://nxbqiwmfyafgshxzczxo.supabase.co>; rel=preconnect; crossorigin',
      '<https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      '<https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
    ].join(', ')
  )

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
