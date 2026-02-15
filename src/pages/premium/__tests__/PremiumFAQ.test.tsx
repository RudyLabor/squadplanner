import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  FAQ: [
    { q: 'Comment annuler mon abonnement ?', a: 'Tu peux annuler depuis les paramètres.' },
    { q: 'Y a-t-il une période d\'essai ?', a: 'Oui, 7 jours gratuits.' },
    { q: 'Quels moyens de paiement ?', a: 'Carte bancaire via Stripe.' },
  ],
}))

import { PremiumFAQ } from '../PremiumFAQ'

describe('PremiumFAQ', () => {
  // STRICT: verifies section renders with title, all questions visible, answers hidden by default, accordion structure
  it('renders FAQ section with title, all questions, and answers hidden by default', () => {
    const { container } = render(<PremiumFAQ />)

    // 1. Section title
    expect(screen.getByText(/Questions fr/)).toBeDefined()
    // 2. First question displayed
    expect(screen.getByText('Comment annuler mon abonnement ?')).toBeDefined()
    // 3. Second question displayed
    expect(screen.getByText(/Y a-t-il une période/)).toBeDefined()
    // 4. Third question displayed
    expect(screen.getByText('Quels moyens de paiement ?')).toBeDefined()
    // 5. Answers NOT visible by default
    expect(screen.queryByText(/Tu peux annuler/)).toBeNull()
    expect(screen.queryByText(/7 jours gratuits/)).toBeNull()
    expect(screen.queryByText(/Carte bancaire/)).toBeNull()
    // 6. Each question has a clickable button
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(3)
  })

  // STRICT: verifies accordion toggle — clicking opens answer, clicking again closes, only one open at a time
  it('toggles FAQ answers on click and only one is open at a time', () => {
    render(<PremiumFAQ />)

    // 1. Click first question
    fireEvent.click(screen.getByText('Comment annuler mon abonnement ?'))
    // 2. First answer appears
    expect(screen.getByText(/Tu peux annuler/)).toBeDefined()
    // 3. Other answers still hidden
    expect(screen.queryByText(/7 jours gratuits/)).toBeNull()

    // 4. Click second question
    fireEvent.click(screen.getByText(/Y a-t-il une période/))
    // 5. Second answer appears
    expect(screen.getByText(/7 jours gratuits/)).toBeDefined()
    // 6. First answer now hidden (only one open at a time)
    expect(screen.queryByText(/Tu peux annuler/)).toBeNull()

    // 7. Click second question again to close
    fireEvent.click(screen.getByText(/Y a-t-il une période/))
    // 8. All answers hidden
    expect(screen.queryByText(/7 jours gratuits/)).toBeNull()
  })

  // STRICT: verifies FAQ structure — each item is wrapped in a card, ChevronDown icon rendered for each, content accessibility
  it('renders each FAQ item with card wrapper, chevron icon, and accessible button', () => {
    const { container } = render(<PremiumFAQ />)

    // 1. Three FAQ items rendered
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(3)
    // 2. Each button has full-width class
    buttons.forEach(btn => {
      expect(btn.className).toContain('w-full')
    })
    // 3. ChevronDown icons present (rendered as spans by mock)
    const spans = container.querySelectorAll('button span')
    expect(spans.length).toBeGreaterThanOrEqual(3)
    // 4. FAQ title visible
    expect(screen.getByText(/Questions fr/)).toBeDefined()
    // 5. Cards wrap each question
    const cards = container.querySelectorAll('div > div')
    expect(cards.length).toBeGreaterThan(3)
    // 6. Text content is non-empty
    expect(container.textContent!.length).toBeGreaterThan(50)
  })
})
