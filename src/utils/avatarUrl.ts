/**
 * Avatar URL Optimization Utility
 *
 * Optimizes avatar URLs for Supabase Storage by adding
 * image transformation parameters for optimal size and quality.
 * This reduces bandwidth and improves page load performance.
 */

/**
 * Optimizes avatar URLs for Supabase Storage
 * Adds image transformation parameters for optimal size and quality
 *
 * @param url - Original avatar URL (can be null/undefined)
 * @param size - Target display size in pixels (will use 2x for retina)
 * @returns Optimized URL with transform parameters or original URL
 *
 * @example
 * // For a 40px avatar display (will request 80px for retina)
 * getOptimizedAvatarUrl(profile.avatar_url, 40)
 *
 * // Using size presets
 * getOptimizedAvatarUrl(profile.avatar_url, AVATAR_SIZES.md)
 */
export function getOptimizedAvatarUrl(url: string | null | undefined, size: number): string | null {
  if (!url) return null

  // Only optimize Supabase Storage URLs
  if (!url.includes('supabase') || !url.includes('/storage/')) {
    return url
  }

  // Calculate optimal size (2x for retina displays)
  const optimizedSize = Math.ceil(size * 2)

  // Add Supabase Storage transform parameters with WebP format
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}width=${optimizedSize}&height=${optimizedSize}&resize=cover&quality=80&format=webp`
}
