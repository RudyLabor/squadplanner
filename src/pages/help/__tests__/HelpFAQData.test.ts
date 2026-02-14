import { describe, it, expect } from 'vitest'
import { FAQ_ITEMS, CATEGORIES } from '../HelpFAQData'
import type { FAQItem } from '../HelpFAQData'

describe('HelpFAQData', () => {
  it('exports FAQ_ITEMS as a non-empty array', () => {
    expect(Array.isArray(FAQ_ITEMS)).toBe(true)
    expect(FAQ_ITEMS.length).toBeGreaterThan(0)
  })

  it('exports CATEGORIES as a non-empty array', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true)
    expect(CATEGORIES.length).toBeGreaterThan(0)
  })

  it('each FAQ item has question, answer, and category', () => {
    FAQ_ITEMS.forEach((item: FAQItem) => {
      expect(item.question).toBeTruthy()
      expect(item.answer).toBeTruthy()
      expect(item.category).toBeTruthy()
    })
  })

  it('all FAQ categories exist in CATEGORIES', () => {
    const uniqueCategories = [...new Set(FAQ_ITEMS.map((item) => item.category))]
    uniqueCategories.forEach((cat) => {
      expect(CATEGORIES).toContain(cat)
    })
  })

  it('some items have illustrations', () => {
    const withIllustrations = FAQ_ITEMS.filter((item) => item.illustration)
    expect(withIllustrations.length).toBeGreaterThan(0)
  })
})
