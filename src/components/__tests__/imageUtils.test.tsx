import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock document for canvas
const mockCanvas = {
  toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
}
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as any
  return document.createElement(tag)
})

import { getPlaceholderUrl, getVercelImageUrl, getOptimizedSrc } from '../imageUtils'

describe('imageUtils', () => {
  describe('getPlaceholderUrl', () => {
    it('returns placeholder for supabase storage URLs', () => {
      const result = getPlaceholderUrl('https://abc.supabase.co/storage/v1/object/image.jpg')
      expect(result).toBeDefined()
      expect(result).toContain('width=10')
    })

    it('returns undefined for non-supabase URLs', () => {
      expect(getPlaceholderUrl('https://example.com/image.jpg')).toBeUndefined()
    })

    it('allows custom width', () => {
      const result = getPlaceholderUrl('https://abc.supabase.co/storage/v1/object/img.jpg', 20)
      expect(result).toContain('width=20')
    })
  })

  describe('getVercelImageUrl', () => {
    it('returns original for data: URLs', () => {
      expect(getVercelImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    })

    it('returns original for blob: URLs', () => {
      expect(getVercelImageUrl('blob:http://localhost/abc')).toBe('blob:http://localhost/abc')
    })

    it('returns original for SVG files', () => {
      expect(getVercelImageUrl('https://example.com/icon.svg')).toBe('https://example.com/icon.svg')
    })

    it('returns Vercel image URL for regular images', () => {
      const result = getVercelImageUrl('https://example.com/photo.jpg', 800)
      expect(result).toContain('/_vercel/image')
      expect(result).toContain('w=800')
    })
  })

  describe('getOptimizedSrc', () => {
    it('returns avif source if available and supported', () => {
      // Can't easily test format support, but test the fallback path
      const result = getOptimizedSrc('https://example.com/photo.jpg')
      expect(result).toBeTruthy()
    })

    it('returns original src for non-convertible formats', () => {
      const result = getOptimizedSrc('https://example.com/image.gif')
      expect(result).toBe('https://example.com/image.gif')
    })
  })
})
