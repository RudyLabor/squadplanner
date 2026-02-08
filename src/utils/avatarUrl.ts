/**
 * Avatar URL Optimization Utility
 *
 * Optimizes avatar URLs for Supabase Storage by adding
 * image transformation parameters for optimal size and quality.
 * This reduces bandwidth and improves page load performance.
 */

/**
 * Size presets for common avatar usages
 */
export const AVATAR_SIZES = {
  xs: 24,   // Extra small - 6 * 4
  sm: 32,   // Small - 8 * 4
  md: 40,   // Medium - 10 * 4
  lg: 48,   // Large - 12 * 4
  xl: 64,   // Extra large - 16 * 4
  xxl: 96,  // 2XL - 24 * 4
  xxxl: 128 // 3XL - 32 * 4
} as const

export type AvatarSize = keyof typeof AVATAR_SIZES

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
export function getOptimizedAvatarUrl(
  url: string | null | undefined,
  size: number
): string | null {
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

/**
 * Helper to get optimized avatar URL using preset size
 *
 * @example
 * getOptimizedAvatarUrlPreset(profile.avatar_url, 'md')
 */
export function getOptimizedAvatarUrlPreset(
  url: string | null | undefined,
  preset: AvatarSize
): string | null {
  return getOptimizedAvatarUrl(url, AVATAR_SIZES[preset])
}
