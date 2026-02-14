import { describe, it, expect } from 'vitest'
import { FEATURES, TESTIMONIALS, FAQ } from '../PremiumData'

describe('PremiumData', () => {
  it('exports FEATURES as a non-empty array', () => {
    expect(Array.isArray(FEATURES)).toBe(true)
    expect(FEATURES.length).toBeGreaterThan(0)
  })

  it('each feature has name, free, premium, and icon', () => {
    FEATURES.forEach((f) => {
      expect(f.name).toBeTruthy()
      expect(f.icon).toBeTruthy()
      expect(f.free !== undefined).toBe(true)
      expect(f.premium !== undefined).toBe(true)
    })
  })

  it('exports TESTIMONIALS as a non-empty array', () => {
    expect(Array.isArray(TESTIMONIALS)).toBe(true)
    expect(TESTIMONIALS.length).toBeGreaterThan(0)
  })

  it('each testimonial has name, squad, text, and avatarType', () => {
    TESTIMONIALS.forEach((t) => {
      expect(t.name).toBeTruthy()
      expect(t.squad).toBeTruthy()
      expect(t.text).toBeTruthy()
      expect(t.avatarType).toBeTruthy()
    })
  })

  it('exports FAQ as a non-empty array', () => {
    expect(Array.isArray(FAQ)).toBe(true)
    expect(FAQ.length).toBeGreaterThan(0)
  })

  it('each FAQ item has q and a', () => {
    FAQ.forEach((item) => {
      expect(item.q).toBeTruthy()
      expect(item.a).toBeTruthy()
    })
  })
})
