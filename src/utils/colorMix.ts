/**
 * Safari 15 compatible color-mix() utility.
 *
 * Uses native `color-mix(in srgb, ...)` when supported (Safari 15.4+, Chrome 111+, Firefox 113+).
 * Falls back to the provided fallback value for older browsers (Safari 15.0–15.3).
 *
 * @param color - CSS color value (can be a CSS variable like `var(--color-gold)`)
 * @param percentage - Opacity percentage (0–100)
 * @param fallback - Optional fallback CSS value for browsers without color-mix() support
 * @returns CSS color string
 */

let _supported: boolean | undefined

function isColorMixSupported(): boolean {
  if (_supported !== undefined) return _supported
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return true // SSR: assume modern browser
  _supported = CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')
  return _supported
}

export function colorMix(color: string, percentage: number, fallback?: string): string {
  if (isColorMixSupported()) {
    return `color-mix(in srgb, ${color} ${percentage}%, transparent)`
  }
  return fallback ?? color
}

export function colorMixBlend(
  color1: string,
  percentage: number,
  color2: string,
  fallback?: string
): string {
  if (isColorMixSupported()) {
    return `color-mix(in srgb, ${color1} ${percentage}%, ${color2})`
  }
  return fallback ?? color1
}
