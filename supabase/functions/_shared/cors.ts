/**
 * Centralized CORS configuration for all Edge Functions.
 * SEC: Single source of truth for allowed origins — prevents
 * inconsistencies where some functions allow www. and others don't.
 *
 * Usage:
 *   import { getCorsHeaders } from '../_shared/cors.ts'
 *   // In your handler:
 *   const corsHeaders = getCorsHeaders(req.headers.get('origin'))
 */

/**
 * Canonical list of allowed origins for CORS.
 * Includes all production domains (with and without www.), dev servers,
 * Capacitor origins for mobile apps, and the Supabase project URL.
 */
export const ALLOWED_ORIGINS: string[] = [
  // Dev servers (common Vite ports)
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:3000',
  // Production domains (with and without www.)
  'https://squadplanner.fr',
  'https://www.squadplanner.fr',
  'https://squadplanner.app',
  'https://www.squadplanner.app',
  // Capacitor mobile origins
  'capacitor://localhost',
  'http://localhost',
  // Supabase project URL (for direct API calls)
  Deno.env.get('SUPABASE_URL') || '',
].filter(Boolean)

/**
 * Standard CORS headers for JSON API responses.
 * Returns the origin in Access-Control-Allow-Origin only if it matches
 * the allowed list (no wildcard). If origin doesn't match, the
 * Access-Control-Allow-Origin header is omitted entirely.
 *
 * @param origin - The Origin header from the request
 * @param extraHeaders - Additional allowed headers (e.g., 'x-cron-secret')
 * @param methods - Allowed HTTP methods (default: 'POST, OPTIONS')
 */
export function getCorsHeaders(
  origin: string | null,
  options?: {
    extraHeaders?: string
    methods?: string
  }
): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed) ? origin : null

  const allowHeaders = options?.extraHeaders
    ? `authorization, x-client-info, apikey, content-type, ${options.extraHeaders}`
    : 'authorization, x-client-info, apikey, content-type'

  const methods = options?.methods || 'POST, OPTIONS'

  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': allowHeaders,
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Credentials': 'true',
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Credentials': 'true',
  }
}

/**
 * Helper to create a CORS preflight response.
 */
export function corsPreflightResponse(origin: string | null, options?: Parameters<typeof getCorsHeaders>[1]): Response {
  return new Response('ok', {
    headers: getCorsHeaders(origin, options),
  })
}
