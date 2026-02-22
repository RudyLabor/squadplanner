import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock canvas.toDataURL since jsdom does not implement it
beforeEach(() => {
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,')
})

import {
  getPlaceholderUrl,
  checkWebPSupport,
  checkAVIFSupport,
  getVercelImageUrl,
  getOptimizedSrc,
} from '../imageUtils'

describe('imageUtils', () => {
  describe('getPlaceholderUrl', () => {
    it('returns placeholder URL for supabase storage URLs', () => {
      const result = getPlaceholderUrl('https://example.supabase.co/storage/v1/bucket/image.jpg')
      expect(result).toBeDefined()
      expect(result).toContain('width=10')
      expect(result).toContain('quality=20')
      expect(result).toContain('format=webp')
    })

    it('returns undefined for non-supabase URLs', () => {
      const result = getPlaceholderUrl('https://example.com/image.jpg')
      expect(result).toBeUndefined()
    })

    it('returns undefined for invalid URLs', () => {
      const result = getPlaceholderUrl('not-a-url')
      expect(result).toBeUndefined()
    })

    it('uses custom width parameter', () => {
      const result = getPlaceholderUrl(
        'https://example.supabase.co/storage/v1/bucket/image.jpg',
        20
      )
      expect(result).toContain('width=20')
    })
  })

  describe('getVercelImageUrl', () => {
    it('returns vercel image URL with parameters', () => {
      const result = getVercelImageUrl('https://example.com/image.jpg', 800)
      expect(result).toContain('/_vercel/image?')
      expect(result).toContain('url=')
      expect(result).toContain('w=800')
      expect(result).toContain('q=80')
    })

    it('returns original for data: URLs', () => {
      const result = getVercelImageUrl('data:image/png;base64,abc')
      expect(result).toBe('data:image/png;base64,abc')
    })

    it('returns original for blob: URLs', () => {
      const result = getVercelImageUrl('blob:http://localhost/abc')
      expect(result).toBe('blob:http://localhost/abc')
    })

    it('returns original for SVG files', () => {
      const result = getVercelImageUrl('https://example.com/icon.svg')
      expect(result).toBe('https://example.com/icon.svg')
    })

    it('accepts custom quality', () => {
      const result = getVercelImageUrl('https://example.com/image.jpg', 400, 95)
      expect(result).toContain('q=95')
    })
  })

  describe('checkWebPSupport', () => {
    it('returns a boolean', () => {
      const result = checkWebPSupport()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('checkAVIFSupport', () => {
    it('returns a boolean', () => {
      const result = checkAVIFSupport()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getOptimizedSrc', () => {
    it('falls back when avif/webp not supported in test env', () => {
      // In test env, toDataURL returns png, so avif/webp detection returns false
      // and the function falls back to the vercel image path or original
      const result = getOptimizedSrc(
        'https://example.com/image.jpg',
        undefined,
        undefined,
        'https://example.com/image.avif'
      )
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('falls back for webpSrc in test env', () => {
      const result = getOptimizedSrc(
        'https://example.com/image.jpg',
        undefined,
        'https://example.com/image.webp'
      )
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns vercel image url when width specified', () => {
      const result = getOptimizedSrc('https://example.com/image.jpg', 400)
      expect(result).toContain('/_vercel/image')
    })

    it('returns original src for non-convertible formats', () => {
      const result = getOptimizedSrc('https://example.com/image.gif')
      expect(result).toBe('https://example.com/image.gif')
    })
  })
})
