import { type ImgHTMLAttributes } from 'react'

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackColor?: string
}

export function LazyImage({ fallbackColor = 'var(--color-overlay-subtle)', style, ...props }: LazyImageProps) {
  return (
    <img
      loading="lazy"
      decoding="async"
      style={{ backgroundColor: fallbackColor, ...style }}
      {...props}
    />
  )
}
