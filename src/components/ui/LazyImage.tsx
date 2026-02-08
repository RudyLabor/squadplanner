import { type ImgHTMLAttributes } from 'react'

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackColor?: string
}

export function LazyImage({ fallbackColor = 'rgba(255,255,255,0.05)', style, ...props }: LazyImageProps) {
  return (
    <img
      loading="lazy"
      decoding="async"
      style={{ backgroundColor: fallbackColor, ...style }}
      {...props}
    />
  )
}
