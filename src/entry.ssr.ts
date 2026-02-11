import { generateHTML as defaultGenerateHTML } from "@react-router/dev/config/default-rsc-entries/entry.ssr";
import { isbot } from "isbot";

// Pre-rendered / public pages that can be cached aggressively
const PRE_RENDERED_PATHS = new Set([
  "/",
  "/auth",
  "/legal",
  "/help",
  "/premium",
  "/maintenance",
]);

// Protected / dynamic pages that contain user-specific data
const PROTECTED_PATH_PREFIXES = [
  "/home",
  "/squads",
  "/sessions",
  "/messages",
  "/party",
  "/settings",
  "/profile",
];

// API-like paths
const API_PATH_PREFIXES = ["/api", "/__data"];

function getCacheControl(pathname: string): string {
  if (API_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "no-store";
  }
  if (PRE_RENDERED_PATHS.has(pathname)) {
    return "public, s-maxage=3600, stale-while-revalidate=86400";
  }
  if (PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "private, no-cache";
  }
  return "private, no-cache";
}

function setSecurityHeaders(headers: Headers): void {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=()"
  );
}

export async function generateHTML(
  request: Request,
  serverResponse: Response
): Promise<Response> {
  const response = await defaultGenerateHTML(request, serverResponse);

  // Cache headers based on URL path
  const url = new URL(request.url);
  response.headers.set("Cache-Control", getCacheControl(url.pathname));

  // Security & performance headers
  setSecurityHeaders(response.headers);

  // Link headers for Early Hints (103) - Vercel uses these to preconnect/preload
  response.headers.append(
    "Link",
    [
      "<https://nxbqiwmfyafgshxzczxo.supabase.co>; rel=preconnect; crossorigin",
      "</fonts/inter-var-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin",
      "</fonts/space-grotesk-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin",
    ].join(", ")
  );

  return response;
}
