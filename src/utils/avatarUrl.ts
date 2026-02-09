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

/**
 * Generate a srcSet string for responsive avatar images at multiple DPR levels.
 * Returns 1x, 1.5x, 2x, and 3x variants for sharp rendering on all screens.
 *
 * @param url - Original avatar URL
 * @param baseSize - Display size in CSS pixels
 * @returns srcSet string for use in <img srcSet="...">
 */
export function getAvatarSrcSet(url: string | null | undefined, baseSize: number): string {
  if (!url) return ''

  // Only generate srcSet for Supabase Storage URLs (others don't support transforms)
  if (!url.includes('supabase') || !url.includes('/storage/')) {
    return ''
  }

  const multipliers = [1, 1.5, 2, 3]
  return multipliers
    .map(dpr => {
      const size = Math.round(baseSize * dpr)
      const optimized = getOptimizedAvatarUrl(url, size)
      return optimized ? `${optimized} ${dpr}x` : ''
    })
    .filter(Boolean)
    .join(', ')
}
