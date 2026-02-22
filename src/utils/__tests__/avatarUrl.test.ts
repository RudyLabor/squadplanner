import { describe, it, expect } from 'vitest'
import { getOptimizedAvatarUrl } from '../avatarUrl'

describe('getOptimizedAvatarUrl', () => {
  it('returns null for null input', () => {
    expect(getOptimizedAvatarUrl(null, 40)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(getOptimizedAvatarUrl(undefined, 40)).toBeNull()
  })

  it('returns original URL for non-Supabase URLs', () => {
    expect(getOptimizedAvatarUrl('https://example.com/avatar.png', 40)).toBe(
      'https://example.com/avatar.png'
    )
  })

  it('adds transform params for Supabase Storage URLs', () => {
    const url = 'https://nxbqiwmfyafgshxzczxo.supabase.co/storage/v1/avatars/test.png'
    const result = getOptimizedAvatarUrl(url, 40)
    expect(result).toContain('width=80') // 2x for retina
    expect(result).toContain('height=80')
    expect(result).toContain('format=webp')
  })

  it('uses & separator when URL already has params', () => {
    const url = 'https://nxbqiwmfyafgshxzczxo.supabase.co/storage/v1/avatars/test.png?token=abc'
    const result = getOptimizedAvatarUrl(url, 40)
    expect(result).toContain('&width=80')
  })
})
