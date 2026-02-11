let webpSupported: boolean | null = null
let avifSupported: boolean | null = null

export function getPlaceholderUrl(src: string, width: number = 10): string | undefined {
  if (src.includes('supabase') && src.includes('/storage/')) {
    try {
      const url = new URL(src)
      url.searchParams.set('width', String(width))
      url.searchParams.set('quality', '20')
      url.searchParams.set('format', 'webp')
      return url.toString()
    } catch {
      return undefined
    }
  }
  return undefined
}

export function checkWebPSupport(): boolean {
  if (webpSupported !== null) return webpSupported
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  return webpSupported
}

export function checkAVIFSupport(): boolean {
  if (avifSupported !== null) return avifSupported
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  avifSupported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  return avifSupported
}

export function getVercelImageUrl(src: string, width?: number, quality: number = 80): string {
  if (src.startsWith('data:') || src.startsWith('blob:') || src.endsWith('.svg')) return src

  const params = new URLSearchParams()
  params.set('url', src)
  if (width) params.set('w', String(width))
  params.set('q', String(quality))
  return `/_vercel/image?${params.toString()}`
}

export function getOptimizedSrc(src: string, width?: number, webpSrc?: string, avifSrc?: string): string {
  if (avifSrc && checkAVIFSupport()) return avifSrc
  if (webpSrc && checkWebPSupport()) return webpSrc

  if (width) return getVercelImageUrl(src, width)

  const isConvertible = /\.(jpe?g|png)$/i.test(src)
  if (!isConvertible) return src

  if (checkAVIFSupport()) return src.replace(/\.(jpe?g|png)$/i, '.avif')
  if (checkWebPSupport()) return src.replace(/\.(jpe?g|png)$/i, '.webp')

  return src
}
